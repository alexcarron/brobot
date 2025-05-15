const Parameter = require("../../services/command-creation/Paramater");
const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../services/command-creation/SlashCommand");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { GameStates, Announcements } = require("../../modules/enums");

const command = new SlashCommand({
	name: "role-list",
	description: "Get the current role list",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (!global.game_manager || global.game_manager.state !== GameStates.InProgress) {
		return await interaction.editReply("The game has to start before I can tell you the role list...");
	}

	interaction.editReply(Announcements.RoleList(global.game_manager.unshuffled_role_identifiers));
};
module.exports = command;