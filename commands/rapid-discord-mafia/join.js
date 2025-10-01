const { Parameter } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { ids } = require(`../../bot-config/discord-ids`);
const { GameState } = require("../../services/rapid-discord-mafia/game-state-manager.js");
const { getRequiredStringParam, getStringParamValue } = require("../../utilities/discord-fetch-utils");
const { isArray, isString } = require("../../utilities/types/type-guards");

module.exports = new SlashCommand({
	name: "join",
	description: "Join a game of Rapid Discord Mafia and choose your name",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_roles: ['Spectators'],
	parameters: [
		new Parameter({
			type: "string",
			name: "name",
			description: "What you want to be called during the game"
		})
	],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		let isTest = false;
		if ('isTest' in interaction) isTest = true;

		/**
		 * @type {unknown[]}
		 */
		let args = [];
		if (
			'args' in interaction &&
			isArray(interaction.args)
		)
			args = interaction.args;

		let player_id, player_name, isFakeUser;

		if (!isTest) {
			player_id = interaction.user.id;
			player_name = getRequiredStringParam(interaction, "name");
			isFakeUser = false;
		}
		else {
			player_id = getStringParamValue(interaction, "player-id") ?? args[0];

			if (!isString(player_id))
				return await interaction.editReply("You must provide a player id.");

			player_name = getStringParamValue(interaction, "player-name") ?? args[1];

			if (!isString(player_name))
				return await interaction.editReply("You must provide a player name.");

			isFakeUser = interaction.options.getBoolean("fake-user") ?? args[2];

			if (isFakeUser) {
				isFakeUser = true;
				player_id = ids.users.LL;
			}
			else
				isFakeUser = false;

			// global.game_manager.state = GameState.ReadyToBegin;
		}

		if (global.game_manager.state !== GameState.SIGN_UP) {
			return await interaction.editReply("We're not in sign-ups so you can't join just yet.");
		}

		global.game_manager.addPlayerToGame(player_name, player_id, interaction, isFakeUser);

		await interaction.editReply(`**${player_name}** has been added to the game`);
	}
});