const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../databases/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, appendElementToNestedProperty: addElementToNestedProperty, appendElementToNestedProperty, toTitleCase } = require("../../modules/functions");
const roles = require("../../modules/rapid_discord_mafia/roles");
const { GameStates, Announcements } = require("../../modules/enums");

const command = new SlashCommand({
	name: "role-list",
	description: "Get the current role list",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (global.Game.state !== GameStates.InProgress) {
		return await interaction.editReply("The game has to start before I can tell you the role list...");
	}

	interaction.editReply(Announcements.RoleList(global.Game.unshuffled_role_identifiers));
};
module.exports = command;