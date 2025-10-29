import { PermissionFlagsBits } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { startGame } from "../../services/namesmith/event-listeners/on-game-start";

export const command = new SlashCommand({
	name: "start-namesmith-game",
	description: "Start a Namesmith game",
	required_servers: [ids.servers.NAMESMITH],
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function execute() {
		await startGame();
		return "The Namesmith game has started!";
	}
});