const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { ids } = require(`../../bot-config/discord-ids`);
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager");
const { editReplyToInteraction, deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "save-game",
	description: "Save Rapid Discord Mafia game data.",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		if (global.game_manager && global.game_manager instanceof GameManager) {
			await global.game_manager.data_manager.saveToGithub();
			editReplyToInteraction(interaction, "Game successfully saved.");
		}
		else {
			editReplyToInteraction(interaction, "Couldn't save the game.");
		}

	}
});