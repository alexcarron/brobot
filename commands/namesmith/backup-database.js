import { PermissionFlagsBits } from "discord.js";
import ids from "../../bot-config/discord-ids";
import { deferInteraction } from "../../utilities/discord-action-utils";
import { createBackup } from "../../services/namesmith/database/backup-database";
import { SlashCommand } from "../../services/command-creation/slash-command";

module.exports = new SlashCommand({
	name: "backup-database",
	description: "Backs up the namesmith database",
	required_servers: [ids.servers.namesmith],
	required_permissions: [PermissionFlagsBits.Administrator],
	isInDevelopment: true,
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		createBackup();

		await interaction.editReply(`Backup created successfully.`);
	}
});