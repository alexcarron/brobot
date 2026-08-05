import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { handleToggleRefillReminders } from "../../services/namesmith/interfaces/refill-reminders/handle-toggle-refill-reminders";

export const command = new SlashCommand({
	name: "toggle-refill-reminders",
	description: "Toggle whether you get DMed when your refill cooldown expires.",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.CLAIM_REFILL],
	execute: async function execute(interaction) {
		return await handleToggleRefillReminders(interaction.user.id);
	},
});
