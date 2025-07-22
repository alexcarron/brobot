const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");

const ids = require("../../bot-config/discord-ids.js");
const { deferInteraction } = require("../../utilities/discord-action-utils.js");

module.exports = new SlashCommand({
	name: "start-trial",
	description: "Start the trial phase in RDM",
	required_permissions: [PermissionFlagsBits.Administrator],
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);
		await global.game_manager.startTrial();
	}
});