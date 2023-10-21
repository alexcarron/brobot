const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { toTitleCase, deferInteraction, getRDMGuild, getChannel } = require("../../modules/functions");
const { Abilities } = require("../../modules/rapid_discord_mafia/ability");
const { ArgumentTypes, ArgumentSubtypes, Factions, AbilityUses } = require("../../modules/enums");
const roles = require("../../modules/rapid_discord_mafia/roles");
const ids = require("../../databases/ids.json")

const command = new SlashCommand({
	name: "use",
	description: "(Players Only) Use an ability your role has",
});


command.parameters.push(new Parameter({
	type: "subcommand",
	name: "nothing",
	description: "Use to do nothing for the night and speed things up"
}));

for (const ability_name in Abilities) {
	const ability = Abilities[ability_name];

	if (
		(!ability.uses || ability.uses === AbilityUses.None) ||
		(!ability.phases_can_use || ability.phases_can_use.length <= 0)
	) {
		continue;
	}

	const subcommand_name = ability.name.split(" ").join("-").toLowerCase()
	let subcommand_description = ability.description;

	if (ability.description.length > 100) {
		subcommand_description = ability.description.substring(0, 96) + "...";
	}

	const parameter = new Parameter({
		type: "subcommand",
		name: subcommand_name,
		description: subcommand_description,
	});

	if (ability.args) {
		parameter.subparameters = [];

		for (const arg of ability.args) {
			const arg_name = arg.name.split(" ").join("-").toLowerCase();
			const subparameter = new Parameter({
				type: "string",
				name: arg_name,
				isAutocomplete: true,
			});

			let arg_description = arg.description;

			if (arg.subtypes && arg.subtypes.length > 0) {
				arg_description +=
					" " + arg.subtypes.map(subtype => toTitleCase(subtype)).join(", ")

				if (arg_description.length > 100) {
					arg_description = arg_description.substring(0, 96) + "...";
				}
			}

			subparameter.description = arg_description;

			parameter.subparameters.push(
				subparameter
			);
		}
	}
	command.parameters.push(parameter);
}

command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_categories = [
	ids.rapid_discord_mafia.category.player_action,
	ids.rapid_discord_mafia.category.night,
];
command.required_roles = [ids.rapid_discord_mafia.roles.living];

command.execute = async function(interaction, isTest) {
	await deferInteraction(interaction);

	let player, ability_name;

	if (isTest) {
		const player_name = interaction.options.getString("player-name");
		player = global.Game.Players.getPlayerFromName(player_name);
	}
	else {
		player = global.Game.Players.getPlayerFromId(interaction.user.id);
	}

	if (!player) {
		return await interaction.editReply("You must be a player to use this command");
	}

	if (isTest) {
		ability_name =
			interaction.options.getString("ability-name")
				.split("-")
				.map(name => toTitleCase(name))
				.join(" ");
	}
	else {
		const subcommand_name = interaction.options.getSubcommand();
		ability_name = subcommand_name.split("-").map(name => toTitleCase(name)).join(" ");
	}

	if (ability_name === "Nothing") {
		player.setAbilityDoing("nothing", {});

		player.resetInactivity();

		return await interaction.editReply(
			`You will attempt to do **Nothing**`
		);
	}

	const ability = Object.values(Abilities).find(ability =>
		ability.name === ability_name
	);

	console.log({ability_name, ability, player});

	const player_role = roles[player.role]

	if (player_role.abilities.every(ability => ability.name !== ability_name)) {
		return await interaction.editReply("You can't use this ability.");
	}

	if (!ability.phases_can_use.includes(global.Game.phase)) {
		return await interaction.editReply(`You can't use this ability during the** ${global.Game.phase}** phase`)
	}

	const arg_values = {};

	for (const arg of ability.args) {
		const arg_param_name = arg.name.split(" ").join("-").toLowerCase();
		let arg_param_value;

		if (isTest) {
			const ability_arguments_str = interaction.options.getString("ability-arguments");
			const ability_arguments = ability_arguments_str.split(", ").map(str => str.split(": "));

			console.log({ability_arguments, ability_arguments_str});

			arg_param_value = ability_arguments.find(arg => {
				return arg[0].split(" ").join("-").toLowerCase() === arg_param_name
			})[1];
		}
		else {
			arg_param_value = interaction.options.getString(arg_param_name);
		}

		console.log({arg, arg_param_name, arg_param_value});

		arg_values[arg.name] = arg_param_value;

		console.log({arg_values});

		if (arg.subtypes.includes(ArgumentSubtypes.Visiting)) {
			player.setVisiting(arg_param_value);
		}

		const isArgValueValid = (player_using_ability, ability_arg, arg_value) => {
			if (ability_arg.subtypes.includes(ArgumentSubtypes.NonMafia)) {
				const player_targeting = global.Players.get(arg_param_value);
				const player_targeting_role = roles[player_targeting.role];
				if (player_targeting_role.faction === Factions.Mafia) {
					return `You cannot target **${player_targeting.name}** as you may only target non-mafia`;
				}
			}
			if (ability_arg.subtypes.includes(ArgumentSubtypes.NotSelf)) {
				if (arg_param_value === player_using_ability.name) {
					return `You cannot target yourself`;
				}
			}

			return true;
		}


		if (arg_param_value === "N/A") {
			return await interaction.editReply(`You did not enter in a valid player in the argument **${arg_param_name}**`);
		}
	}

	player.setAbilityDoing(ability_name, arg_values);
	await global.Game.saveGameDataToDatabase();

	let arg_values_txt = "";
	if (Object.entries(arg_values).length > 0) {

		arg_values_txt =
			" with the arguments " +
			Object.entries(arg_values).map((entry) => {
				let name = entry[0];
				let value = entry[1];

				return `**${name}**: **${value}**`
			}).join(", ");
	}

	player.resetInactivity();

	await interaction.editReply(
		ability.feedback(...Object.values(arg_values))
	);

	console.log({player});

	if (roles[player.role].faction === Factions.Mafia) {
		const rdm_guild = await getRDMGuild();
		const mafia_channel = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.mafia_chat);

		mafia_channel.send(
			ability.feedback(...Object.values(arg_values), player.name)
		);
	}
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = interaction.options.getFocused(true);

	if (!focused_param) return;

	const player = global.Game.Players.getPlayerFromId(interaction.user.id);

	if (!player) {
		return await interaction.respond(
			[{name: "Sorry, you're not allowed to use this command", value: "N/A"}]
		);
	}

	const subcommand_name = interaction.options.getSubcommand();
	const ability_name = subcommand_name.split("-").map(name => toTitleCase(name)).join(" ");

	const arg_name = focused_param.name.split("-").map(name => toTitleCase(name)).join(" ");

	const ability = Object.values(Abilities).find(ability => ability.name === ability_name);
	const ability_arg = ability.args.find(arg => arg.name === arg_name);

	const player_role = roles[player.role]

	if (player_role.abilities.every(ability => ability.name !== ability_name)) {
		return await interaction.respond(
			[{name: "Sorry, you're not allowed to use this command", value: "N/A"}]
		);
	}

	console.log({ability_arg})

	if (ability_arg.type === ArgumentTypes.Player) {
		autocomplete_values =
			global.Game.Players.getAlivePlayers().filter(
				(player) => {
					console.log(ability_arg.subtypes);
					console.log(player.role);
					console.log(player.role.faction);

					if (
						ability_arg.subtypes.includes(ArgumentSubtypes.NonMafia) &&
						roles[player.role].faction === Factions.Mafia
					) {
						console.log(player.name);
						return false;
					}

					if (
						ability_arg.subtypes.includes(ArgumentSubtypes.NotSelf) &&
						player.id === interaction.user.id
					) {
						console.log(player.name);
						return false;
					}

					return true;
				}
			)
			.reduce(
				(accumValue, prevPlayer) => {
					return [
						...accumValue,
						{name: prevPlayer.name, value: prevPlayer.name},
					];
				},
				[]
			);
	}

	if (Object.values(autocomplete_values).length <= 0) {
		autocomplete_values = [{name: "Sorry, there are no players left to choose from", value: "N/A"}];
	}
	else if (Object.values(autocomplete_values).length > 25) {
		autocomplete_values.splice(25);
	}

	await interaction.respond(
		autocomplete_values
	);
}


module.exports = command;