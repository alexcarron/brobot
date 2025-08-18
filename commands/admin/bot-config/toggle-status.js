const { PermissionFlagsBits } = require('discord.js');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const { SlashCommand } = require('../../../services/command-creation/slash-command');

module.exports = new SlashCommand({
	name: "toggle-status",
	description: "Turn Brobot off and on",
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		if (global.botStatus.isSleep) {
			global.botStatus.isSleep = false
		}
		else {
			global.botStatus.isSleep = true
		}

		interaction.editReply(`Done.`)
	},
});