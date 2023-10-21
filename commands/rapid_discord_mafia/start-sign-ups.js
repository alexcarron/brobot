const SlashCommand = require("../../modules/commands/SlashCommand");
const { GameStates, Announcements, PhaseWaitTimes } = require("../../modules/enums");
const Game = require("../../modules/rapid_discord_mafia/game");
const

	{ PermissionFlagsBits } = require('discord.js'),
	{ getChannel, getRole, getUnixTimestamp, wait, deferInteraction } = require("../../modules/functions"),
	ids = require(`${global.paths.databases_dir}/ids.json`),
	{
		rdm_server_id,
		channels: channel_ids,
		roles:  role_ids,
		living_role_id,
	}
		= require("../../databases/ids.json").rapid_discord_mafia,

	{ min_player_count } = require("../../databases/rapid_discord_mafia/constants.json");



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
	if ( [GameStates.SignUp, GameStates.InProgress].includes(global.Game.state) ) {
		return interaction.editReply("There's already a game in sign-ups or in progress.");
	}
	else {
		interaction.editReply("Attemping to start sign-ups. Once sign-ups is over, use the command `/startgame` to begin the game.");
	}
	console.timeEnd("editReply");

	console.time("Game.reset()");
	await Game.reset();
	console.timeEnd("Game.reset()");

	await global.Game.startSignUps();
}
module.exports = command;