import { PermissionFlagsBits } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { deferInteraction } from "../../utilities/discord-action-utils";
import { startGame } from "../../services/namesmith/event-listeners/on-game-start";

export const command = new SlashCommand({
	name: "start-namesmith-game",
	description: "Start a Namesmith game",
	required_servers: [ids.servers.NAMESMITH],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);
		await startGame({...getNamesmithServices()});
		await interaction.editReply(`Namesmith game has started!`);
	}
});