const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const Host = require('../../modules/gameforge/Host');
const { confirmAction, deferInteraction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`);
const SlashCommand = require('../../modules/commands/SlashCommand');

const command = new SlashCommand({
	name: "my-level",
	description: "See what your level and XP is in GameForge"
});
command.required_roles = ["Host"];
command.required_servers = [ids.servers.gameforge];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const user_id = interaction.user.id;
	const host = global.GameForge.getHostByID(user_id);

	if (!host) {
		return await interaction.editReply("Only hosts may run this command.");
	}

	interaction.editReply({embeds: [await host.toEmbed()]});
}
module.exports = command;