const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { toTitleCase, deferInteraction, getRDMGuild, getChannel } = require("../../modules/functions");
const { Abilities } = require("../../modules/rapid_discord_mafia/ability");
const { ArgumentTypes, ArgumentSubtypes, Factions, AbilityUses, Phases } = require("../../modules/enums");
const roles = require("../../modules/rapid_discord_mafia/roles");
const ids = require("../../databases/ids.json");
const Game = require("../../modules/rapid_discord_mafia/game");

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

command.execute = async function(interaction, isTest) {
	await deferInteraction(interaction);

	let player, ability_name;

	// Get player from user or player name argument
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

	// Parse ability name from command use
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

	// Organize command parameter values into arg_values
	const arg_values = {};
	const ability_using = Object.values(Abilities).find(ability =>
		ability.name === ability_name
	);

	for (const ability_arg of ability_using.args) {
		const arg_param_name = ability_arg.name.split(" ").join("-").toLowerCase();
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
		arg_values[ability_arg.name] = arg_param_value;
	}

	const can_use_ability_feedback = await player.canUseAbility(ability_name, arg_values);

	if (can_use_ability_feedback !== true)
		return await interaction.editReply(can_use_ability_feedback);

	const ability_feedback = player.useAbility(ability_name, arg_values);
	await global.Game.saveGameDataToDatabase();

	await interaction.editReply(ability_feedback);

	if (roles[player.role].faction === Factions.Mafia) {
		const rdm_guild = await getRDMGuild();
		const mafia_channel = await getChannel(rdm_guild, ids.rapid_discord_mafia.channels.mafia_chat);

		mafia_channel.send(
			ability_using.feedback(...Object.values(arg_values), player.name, false)
		);
	}

}

command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = interaction.options.getFocused(true);

	if (!focused_param) return;

	const player_using_command = global.Game.Players.getPlayerFromId(interaction.user.id);

	if (!player_using_command) {
		return await interaction.respond(
			[{name: "Sorry, you're not allowed to use this command", value: "N/A"}]
		);
	}

	const subcommand_name = interaction.options.getSubcommand();
	const ability_name = subcommand_name.split("-").map(name => toTitleCase(name)).join(" ");

	const arg_name = focused_param.name.split("-").map(name => toTitleCase(name)).join(" ");

	const ability = Object.values(Abilities).find(ability => ability.name === ability_name);
	const ability_arg = ability.args.find(arg => arg.name === arg_name);

	const player_role = roles[player_using_command.role]

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
						player.name === player_using_command.name
					) {
						console.log(player.name);
						return false;
					}

					if (
						ability_arg.subtypes.includes(ArgumentSubtypes.CertainPlayers) &&
						!player_using_command.players_can_use_on.includes(player.name)
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