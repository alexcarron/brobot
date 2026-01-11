import { PermissionFlagsBits } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { startGame } from "../../services/namesmith/event-listeners/on-game-start";
import { Parameter } from "../../services/command-creation/parameter";

export const command = new SlashCommand({
	name: "start-namesmith-game",
	description: "Start a Namesmith game",
	required_servers: [ids.servers.NAMESMITH],
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		new Parameter({
			name: "theme",
			description: "The theme to use for this Namesmith game",
			type: "string",
		})
	],
	execute: async function execute(_, {theme}) {
		await startGame(theme);
		return "The Namesmith game has started!";
	}
});