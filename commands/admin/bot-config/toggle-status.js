const { PermissionFlagsBits } = require('discord.js');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const { botStatus } = require('../../../bot-config/bot-status');
const { SlashCommand } = require('../../../services/command-creation/slash-command');

module.exports = new SlashCommand({
	name: "toggle-status",
	description: "Turn Brobot off and on",
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		if (botStatus.isSleep) {
			botStatus.isSleep = false
		}
		else {
			botStatus.isSleep = true
		}

		interaction.editReply(`Done.`)
	},
});