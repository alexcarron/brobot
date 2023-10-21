const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Host = require('../../modules/gameforge/Host');
const { confirmAction, deferInteraction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`);
const SlashCommand = require('../../modules/commands/SlashCommand');

const command = new SlashCommand({
	name: "gameforge-leaderboard",
	description: "See the highest level hosts in GameForge"
});
command.required_servers = [ids.servers.gameforge];
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	await global.GameForge.replyWithLeaderboardMessage(interaction);
}
module.exports = command;