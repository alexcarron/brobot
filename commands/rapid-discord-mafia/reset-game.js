const SlashCommand = require('../../modules/commands/SlashCommand.js');
const ids = require(`../../bot-config/discord-ids.js`);
const
	{ PermissionFlagsBits } = require('discord.js'),
	GameManager = require("../../modules/rapid_discord_mafia/GameManager.js"),
	{ deferInteraction, editReplyToInteraction } = require("../../modules/functions.js");

const command = new SlashCommand({
	name: "reset-game",
	description: "Resets the current Rapid Discord Mafia game",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	await GameManager.reset();

	await editReplyToInteraction(interaction, "Reset everything.");
}

module.exports = command;