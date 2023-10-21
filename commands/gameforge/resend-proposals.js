const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, channelMention  } = require('discord.js');
const ProposedCreatoinRule = require('../../modules/gameforge/ProposedCreationRule');
const { confirmAction, getCurrentTimeCronExpression } = require('../../modules/functions');
const ProposedModificationRule = require('../../modules/gameforge/ProposedModificationRule');
const ProposedRemovalRule = require('../../modules/gameforge/ProposedRemovalRule');
const SlashCommand = require('../../modules/commands/SlashCommand');
const Parameter = require('../../modules/commands/Paramater');
const ids = require(`../../databases/ids.json`);
const Rule = require('../../modules/gameforge/Rule');
const ProposedRule = require('../../modules/gameforge/ProposedRule');
const GameForge = require('../../modules/gameforge/gameforge');

const command = new SlashCommand({
	name: "resend-proposals",
	description:  "Resend the proposal messages.",
});
command.required_servers = [ids.servers.gameforge];
command.execute = async function(interaction) {
	await interaction.deferReply({ephemeral: true});

	global.GameForge.proposed_rules.forEach(proposed_rule => {
		proposed_rule.createMessage();
	})
}

module.exports = command;