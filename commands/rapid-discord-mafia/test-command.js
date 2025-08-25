const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { Parameter } = require("../../services/command-creation/parameter");
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager.js");

const { ids } = require(`../../bot-config/discord-ids`);
const { TrialVote } = require("../../services/rapid-discord-mafia/vote-manager.js");
const { GameState } = require("../../services/rapid-discord-mafia/game-state-manager.js");
const { deferInteraction } = require("../../utilities/discord-action-utils.js");
const { getRequiredStringParam, getSubcommandUsed } = require("../../utilities/discord-fetch-utils");

const Subparameters = {
	PlayerVotingFor: new Parameter({
		type: "string",
		name: "player-voting-for",
		description: "The player you want to put on trial",
		isAutocomplete: true,
	}),
	TrialOutcome: new Parameter({
		type: "string",
		name: "trial-outcome",
		description: "The vote you want to cast for the current trial",
		autocomplete: TrialVote
	}),
	PlayerVoting: new Parameter({
		type: "string",
		name: "player-voting",
		description: "The player you are making vote",
		isAutocomplete: true,
	}),
}
const Parameters = {
	ForPlayer: new Parameter({
		type: "subcommand",
		name: "for-player",
		description: "Vote for a player to put on trial",
		subparameters: [
			Subparameters.PlayerVoting,
			Subparameters.PlayerVotingFor,
		]
	}),
	ForTrialOutcome: new Parameter({
		type: "subcommand",
		name: "for-trial-outcome",
		description: "Vote for whether or not you want to execute the player on trial",
		subparameters: [
			Subparameters.PlayerVoting,
			Subparameters.TrialOutcome,
		]
	}),
}

module.exports = new SlashCommand({
	name: "test-command",
	description: "Test a command at any point as any person",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		new Parameter({
			type: "subcommand",
			name: "join",
			description: "Test the /join command",
			subparameters: [
				new Parameter({
					type: "string",
					name: "player-name",
					description: "The name you want the player to join with",
					isRequired: true
				}),
				new Parameter({
					type: "string",
					name: "player-id",
					description: "ID of the user joining if not a fake user",
					isRequired: false
				}),
				new Parameter({
					type: "boolean",
					name: "fake-user",
					description: "If the user joining is a fake test user",
					isRequired: false
				}),
			]
		}),
		new Parameter({
			type: "subcommand",
			name: "use",
			description: "Test the /use command",
			subparameters: [
				new Parameter({
					type: "string",
					name: "player-name",
					description: "The name of the player you want to do the action",
				}),
				new Parameter({
					type: "string",
					name: "ability-name",
					description: "Name of the ability being performed",
				}),
				new Parameter({
					type: "string",
					name: "ability-arguments",
					description: "The arguments of the ability your performing. (Ex: \"player-killing: Dave, player-eating: Bob\") ",
					isRequired: false
				}),
			]
		}),
		new Parameter({
			type: "subcommand",
			name: "vote",
			description: "Test the /vote command",
			subcommands : [
				Parameters.ForPlayer,
				Parameters.ForTrialOutcome,
			]
		}),
		new Parameter({
			type: "subcommand",
			name: "start-with-fake-joins",
			description: "Start sign ups and add multiple fake test users",
			subparameters: [
				new Parameter({
					type: "string",
					name: "player-names",
					description: "All the names of test users you want to fake join (Seperated by spaces)",
				}),
			]
		}),
	],
	execute: async function execute(interaction) {
		deferInteraction(interaction);

		const subcommand = interaction.options.getSubcommand();

		// Fake Joins
		if (subcommand === "start-with-fake-joins") {

			// @ts-ignore
			if ( [GameState.SIGN_UP, GameState.IN_PROGRESS].includes(global.game_manager.state) ) {
				return interaction.editReply("There's already a game in sign-ups or in progress.");
			}
			else {
				interaction.editReply("Attemping to start sign-ups. Once sign-ups is over, use the command `/startgame` to begin the game.");
			}

			console.time("Game.reset()");
			await GameManager.reset();
			console.timeEnd("Game.reset()");

			global.game_manager.startSignUps();

			const player_names_str = getRequiredStringParam(interaction, "player-names");


			const player_names = player_names_str.split(" ");

			const join_command = require(`./join.js`);
			// const delete_chnls_command = require(`../admin/deletechannels.js`);

			// await delete_chnls_command.execute(interaction, ["1031365761320624132"], true);

			for (let player_name of player_names) {
				join_command.execute(interaction, [ids.users.LL, player_name, true], true);
			}

			interaction.editReply("Did fake joins!");
		}
		else {
			let command;
			let command_name = getSubcommandUsed(interaction);

			try {
				command = require(`./${command_name}.js`);
			}
			catch {
				return interaction.editReply(`\`${command_name}\` is an invalid command name.`)
			}

			await command.execute(interaction, true);
		}

	},
	autocomplete: async function(interaction) {
		const focused_param = await interaction.options.getFocused(true);

		if ([Subparameters.PlayerVotingFor.name, Subparameters.PlayerVoting.name].includes(focused_param.name)) {
			return await GameManager.getAlivePlayersAutocomplete(interaction)
		}
		else {
			const autocomplete_values = [{name: "Sorry, there are no alive players to choose from", value: "N/A"}];

			await interaction.respond(
				autocomplete_values
			);
		}
	},
});