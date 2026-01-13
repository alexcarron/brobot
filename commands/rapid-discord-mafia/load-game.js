const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { ids } = require(`../../bot-config/discord-ids`);
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager.js");
const { editReplyToInteraction, deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "load-game",
	description: "Load Rapid Discord Mafia game from last save",
	required_permissions: [PermissionFlagsBits.Administrator],
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		if (global.game_manager && global.game_manager instanceof GameManager) {
			await global.game_manager.data_manager.loadFromGithub();
			editReplyToInteraction(interaction, "Game successfully loaded.");
		}
		else {
			editReplyToInteraction(interaction, "Couldn't load the game.");
		}
	},
});