const { PermissionFlagsBits } = require("discord.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "update-tiers",
	description: "Update the tier and tier role of every viewer in the database",
	required_permissions: [PermissionFlagsBits.Administrator],
	allowsDMs: true,
	execute: async function(interaction) {
		deferInteraction(interaction);

		await global.LLPointManager.giveTiersToViewers();

		interaction.editReply("Done.")
	}
});