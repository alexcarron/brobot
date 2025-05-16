const fs = require('node:fs/promises');
const { PermissionFlagsBits } = require('discord.js');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const { botStatus } = require('../../../bot-config/bot-status');
const SlashCommand = require('../../../services/command-creation/slash-command');

const command = new SlashCommand({
	name: "toggle-status",
	description: "Turn Brobot off and on",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	if (botStatus.isSleep) {
		botStatus.isSleep = false
	}
	else {
		botStatus.isSleep = true
	}

	interaction.editReply(`Done.`)
},
module.exports = command;