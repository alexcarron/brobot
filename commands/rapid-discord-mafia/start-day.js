const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { ids } = require("../../bot-config/discord-ids");
const { deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "start-day",
	description: "Start the day phase in RDM.",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);
		await global.game_manager.startDay();
	}
});