const SlashCommand = require('../../modules/commands/SlashCommand.js');
const ids = require(`../../databases/ids.json`);
const
	{ PermissionFlagsBits } = require('discord.js'),
	Game = require("../../modules/rapid_discord_mafia/game.js"),
	Players = require("../../modules/rapid_discord_mafia/players.js"),
	{ getChannel, getRole, getCategoryChildren, deferInteraction, editReplyToInteraction } = require("../../modules/functions.js"),
	{ rdm_server_id, night_chat_category_id}
		= require("../../databases/ids.json").rapid_discord_mafia,
	{ rapid_discord_mafia: rdm_ids } = require("../../databases/ids.json");

const command = new SlashCommand({
	name: "reset-game",
	description: "Resets the current Rapid Discord Mafia game",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	await Game.reset();

	await editReplyToInteraction(interaction, "Reset everything.");
}

module.exports = command;