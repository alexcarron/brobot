const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const { confirmAction, deferInteraction } = require('../../modules/functions');
const ids = require(`../../databases/ids.json`);
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');

const Parameters = {
	Topic: new Parameter({
		type: "string",
		name: "topic",
		description: "The topic you are setting for GameForge's next proposing phase",
	}),
}



const command = new SlashCommand({
	name: "set-topic",
	description: "Set the topic on GameForge",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.required_servers = [ids.servers.gameforge];
command.parameters = [
	Parameters.Topic,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	let topic = interaction.options.getString(Parameters.Topic.name);
	await global.GameForge.setTopic(topic);
	await global.GameForge.saveGameDataToDatabase();
	await interaction.editReply(`Set topic to \`${topic}\``);
};

module.exports = command;

// 1151658087720173638
// 1151658306562170921