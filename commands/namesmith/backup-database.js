import { PermissionFlagsBits } from "discord.js";
import ids from "../../bot-config/discord-ids";
import SlashCommand from "../../services/command-creation/slash-command";
import { deferInteraction } from "../../utilities/discord-action-utils";
import { createBackup } from "../../services/namesmith/database/backup-database";

const command = new SlashCommand({
	name: "backup-database",
	description: "Backs up the namesmith database",
});
command.required_servers = [ids.servers.namesmith];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.isInDevelopment = true;
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	createBackup();

	await interaction.editReply(`Backup created successfully.`);
}

module.exports = command;