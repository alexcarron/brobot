const { Parameter } = require("../../services/command-creation/parameter");
const { ids } = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { GameManager } = require("../../services/rapid-discord-mafia/game-manager");
const { getRequiredStringParam } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	BugReporting: new Parameter({
		type: "string",
		name: "bug-reporting",
		description: "The bug, error, suggestion, feedback, or idea you encountered or have.",
	}),
}

module.exports = new SlashCommand({
	name: "report",
	description: "Report a bug or error that happens in the game, or give a suggestion, feedback, or an idea.",
	parameters: [
		Parameters.BugReporting,
	],
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const bug_reporting = getRequiredStringParam(interaction, Parameters.BugReporting.name);

		if (global.game_manager && global.game_manager instanceof GameManager) {
			global.game_manager.logger.log(`<@${ids.users.LL}> **${interaction.user.username}** has reported:\n>>> ${bug_reporting}`);
		}

		return await interaction.editReply("You have sucessfully reported the following:\n" + `>>> ${bug_reporting}`);
	},
});