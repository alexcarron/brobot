import { PermissionFlagsBits } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { createBackup } from "../../services/namesmith/database/backup-database";
import { SlashCommand } from "../../services/command-creation/slash-command";

export const command = new SlashCommand({
	name: "backup-database",
	description: "Backs up the naesmith database",
	required_servers: [ids.servers.NAMESMITH],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute() {
		await createBackup();
		return `Backup created successfully.`;
	}
});