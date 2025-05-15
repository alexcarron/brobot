const { PermissionFlagsBits } = require("discord.js");
const SlashCommand = require("../../services/command-creation/SlashCommand");

const command = new SlashCommand({
	name: "update-tiers",
	description: "Update the tier and tier role of every viewer in the database",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.allowsDMs = true;
command.execute = async function(interaction) {
	if (interaction) {
		try {
			await interaction.deferReply({ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	await global.LLPointManager.giveTiersToViewers();

	interaction.editReply("Done.")
}

module.exports = command;