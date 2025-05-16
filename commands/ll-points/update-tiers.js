const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");

const command = new SlashCommand({
	name: "update-tiers",
	description: "Update the tier and tier role of every viewer in the database",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.allowsDMs = true;
command.execute = async function(interaction) {
	deferInteraction(interaction);

	await global.LLPointManager.giveTiersToViewers();

	interaction.editReply("Done.")
}

module.exports = command;