import { PermissionFlagsBits } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { deferInteraction } from "../../utilities/discord-action-utils";
import { createBackup } from "../../services/namesmith/database/backup-database";
import { SlashCommand } from "../../services/command-creation/slash-command";

export const command = new SlashCommand({
	name: "backup-database",
	description: "Backs up the naesmith database",
	required_servers: [ids.servers.NAMESMITH],
	required_permissions: [PermissionFlagsBits.Administrator],
	isInDevelopment: true,
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		await createBackup();

		await interaction.editReply(`Backup created successfully.`);
	}
});