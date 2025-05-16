const Parameter = require("../../services/command-creation/Paramater");
const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager");

const Parameters = {
	BugReporting: new Parameter({
		type: "string",
		name: "bug-reporting",
		description: "The bug, error, suggestion, feedback, or idea you encountered or have.",
	}),
}

const command = new SlashCommand({
	name: "report",
	description: "Report a bug or error that happens in the game, or give a suggestion, feedback, or an idea.",
});
command.parameters = [
	Parameters.BugReporting,
];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const bug_reporting = interaction.options.getString(Parameters.BugReporting.name);

	if (global.game_manager && global.game_manager instanceof GameManager) {
		global.game_manager.logger.log(`<@${ids.users.LL}> **${interaction.user.username}** has reported:\n>>> ${bug_reporting}`);
	}

	return await interaction.editReply("You have sucessfully reported the following:\n" + `>>> ${bug_reporting}`);
};

module.exports = command;