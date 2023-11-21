const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../databases/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");
const roles = require("../../modules/rapid_discord_mafia/roles");
const Game = require("../../modules/rapid_discord_mafia/game");
const { Phases, GameStates } = require("../../modules/enums");

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

	Game.log(`<@${ids.users.LL}> **${interaction.user.username}** has reported:\n>>> ${bug_reporting}`);

	return await interaction.editReply("You have sucessfully reported the following:\n" + `>>> ${bug_reporting}`);
};

module.exports = command;