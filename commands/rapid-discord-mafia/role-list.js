const ids = require("../../bot-config/discord-ids.js");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { GameState } = require("../../services/rapid-discord-mafia/game-state-manager.js");
const { Announcement } = require("../../services/rapid-discord-mafia/constants/possible-messages.js");

module.exports = new SlashCommand({
	name: "role-list",
	description: "Get the current role list",
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		if (!global.game_manager || global.game_manager.state !== GameState.IN_PROGRESS) {
			return await interaction.editReply("The game has to start before I can tell you the role list...");
		}

		interaction.editReply(Announcement.SHOW_ROLE_LIST(global.game_manager.unshuffled_role_identifiers));
	}
});