const SlashCommand = require("../../services/command-creation/SlashCommand");
const { GameStates, Announcements, PhaseWaitTimes } = require("../../modules/enums");
const { GameManager } = require("../../services/rapid-discord-mafia/GameManager");
const
	{ PermissionFlagsBits } = require('discord.js'),
	ids = require(`../../bot-config/discord-ids.js`);
const { deferInteraction } = require("../../utilities/discord-action-utils.js");



const command = new SlashCommand({
	name: "start-sign-ups",
	description: "Starts an Rapid Discord Mafia game by starting sign-ups",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function execute(interaction) {
	console.time("deferInteraction");
	await deferInteraction(interaction);
	console.timeEnd("deferInteraction");

	console.time("editReply");
	if ( [GameStates.SignUp, GameStates.InProgress].includes(global.game_manager.state) ) {
		return interaction.editReply("There's already a game in sign-ups or in progress.");
	}
	else {
		interaction.editReply("Attemping to start sign-ups. Once sign-ups is over, use the command `/startgame` to begin the game.");
	}

	console.time("Game.reset()");
	await GameManager.reset();
	console.timeEnd("Game.reset()");

	await global.game_manager.startSignUps();
}
module.exports = command;