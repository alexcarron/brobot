const SlashCommand = require("../../modules/commands/SlashCommand");
const { GameStates, Announcements, PhaseWaitTimes } = require("../../modules/enums");
const GameManager = require("../../modules/rapid_discord_mafia/GameManager");
const

	{ PermissionFlagsBits } = require('discord.js'),
	{ getChannel, getRole, getUnixTimestamp, wait, deferInteraction } = require("../../modules/functions"),
	ids = require(`../../bot-config/discord-ids.json`),
	{
		rdm_server_id,
		channels: channel_ids,
		roles:  role_ids,
		living_role_id,
	}
		= require("../../bot-config/discord-ids.json").rapid_discord_mafia,

	{ min_player_count } = require("../../data/rapid_discord_mafia/constants.json");



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