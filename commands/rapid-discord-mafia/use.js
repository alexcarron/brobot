const { Parameter } = require("../../services/command-creation/parameter.js");
const { SlashCommand } = require("../../services/command-creation/slash-command.js");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const ids = require("../../bot-config/discord-ids.js");
const AbilityManager = require("../../services/rapid-discord-mafia/ability-manager.js");
const { toTitleCase } = require("../../utilities/text-formatting-utils.js");
const { fetchRDMGuild, fetchTextChannel } = require("../../utilities/discord-fetch-utils.js");
const { AbilityUseCount, AbilityName } = require("../../services/rapid-discord-mafia/ability.js");
const { Faction } = require("../../services/rapid-discord-mafia/role.js");
const { AbilityArgType, ArgumentSubtype } = require("../../services/rapid-discord-mafia/arg.js");

const parameters = [
	new Parameter({
		type: "subcommand",
		name: "nothing",
		description: "Use to do nothing for the night and speed things up"
	}),
];

for (const ability_name in AbilityManager.abilities) {
	const ability = AbilityManager.abilities[ability_name];

	if (
		(!ability.uses || ability.uses === AbilityUseCount.NONE) ||
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
				description: arg.description,
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
	parameters.push(parameter);
}

module.exports = new SlashCommand({
	name: "use",
	description: "(Players Only) Use an ability your role has",
	parameters,
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function(interaction, isTest) {
		await deferInteraction(interaction);

		let player, ability_name;

		// Get player from user or player name argument
		if (isTest) {
			const player_name = interaction.options.getString("player-name");
			console.log({player_name});
			player = global.game_manager.player_manager.get(player_name);
			console.log(player);
		}
		else {
			player = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);
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

		let arg_values = {}, ability_using;
		if (ability_name !== AbilityName.NOTHING) {
			// Organize command parameter values into arg_values
			arg_values = {};
			ability_using = Object.values(AbilityManager.abilities).find(ability =>
				ability.name === ability_name
			);

			if (!ability_using) {
				return await interaction.editReply(`**${ability_name}** is not a valid ability`);
			}

			for (const ability_arg of ability_using.args) {
				const arg_param_name = ability_arg.name.split(" ").join("-").toLowerCase();
				let arg_param_value;

				if (isTest) {
					const ability_arguments_str = interaction.options.getString("ability-arguments");

					const ability_arguments = ability_arguments_str.split(", ").map(str => str.split(": "));

					console.log({ability_arguments, ability_arguments_str});

					const ability_argument = ability_arguments.find(arg => {
						const arg_name = arg[0];
						return arg_name.split(" ").join("-").toLowerCase() === arg_param_name
					});

					if (!ability_argument)
						return await interaction.editReply(`Arguments do not include \`${arg_param_name}\``);

					arg_param_value = ability_argument[1];
				}
				else {
					arg_param_value = interaction.options.getString(arg_param_name);
				}
				arg_values[ability_arg.name] = arg_param_value;
			}
		}

		let can_use_ability_feedback = true;
		if (ability_name !== AbilityName.NOTHING) {
			const ability = AbilityManager.abilities[ability_name];

			if (ability) {
				can_use_ability_feedback =
					await global.game_manager.ability_manager.canPlayerUseAbility({
						player: player,
						ability: ability,
						arg_values: arg_values
					});
			} else
				// @ts-ignore
				can_use_ability_feedback = `**${ability_name}** is not a valid ability`;
		}

		if (can_use_ability_feedback !== true)
			return await interaction.editReply(can_use_ability_feedback);

		const ability = global.game_manager.ability_manager.getAbility(ability_name);
		const ability_feedback = player.useAbility(ability, arg_values);
		await global.game_manager.data_manager.saveToGithub();

		await interaction.editReply(ability_feedback);

		const player_role = global.game_manager.role_manager.getRole(player.role);

		if (player_role.faction === Faction.MAFIA) {
			const rdm_guild = await fetchRDMGuild();
			const mafia_channel = await fetchTextChannel(rdm_guild, ids.rapid_discord_mafia.channels.mafia_chat);

			mafia_channel.send(
				ability_using.feedback(...Object.values(arg_values), player.name, false)
			);
		}

		global.game_manager.startDayIfAllPlayersActed();
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = interaction.options.getFocused(true);

		if (!focused_param) return;

		const player_using_command = global.game_manager.player_manager.getPlayerFromId(interaction.user.id);

		if (!player_using_command) {
			return await interaction.respond(
				[{name: "Sorry, you're not allowed to use this command", value: "N/A"}]
			);
		}

		const subcommand_name = interaction.options.getSubcommand();
		const ability_name = subcommand_name.split("-").map(name => toTitleCase(name)).join(" ");

		const arg_name = focused_param.name.split("-").map(name => toTitleCase(name)).join(" ");

		const ability = Object.values(AbilityManager.abilities).find(ability => ability.name === ability_name);
		const ability_arg = ability.args.find(arg => arg.name === arg_name);

		const player_role = global.game_manager.role_manager.getRole(player_using_command.role);

		if (player_role.abilities.every(ability => ability.name !== ability_name)) {
			return await interaction.respond(
				[{name: "Sorry, you're not allowed to use this command", value: "N/A"}]
			);
		}

		if (ability_arg.type === AbilityArgType.PLAYER) {
			autocomplete_values =
				global.game_manager.player_manager.getAlivePlayers().filter(
					(player) => {

						if (
							ability_arg.subtypes.includes(ArgumentSubtype.NON_MAFIA) &&
							global.game_manager.role_manager.getRole(player.role).faction === Faction.MAFIA
						) {
							console.log(player.name);
							return false;
						}

						if (
							ability_arg.subtypes.includes(ArgumentSubtype.NOT_SELF) &&
							player.name === player_using_command.name
						) {
							console.log(player.name);
							return false;
						}

						if (
							ability_arg.subtypes.includes(ArgumentSubtype.CERTAIN_PLAYERS) &&
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
});
