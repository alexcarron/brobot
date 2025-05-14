const fs = require('node:fs/promises');
const SlashCommand = require('../../../modules/commands/SlashCommand');
const { PermissionFlagsBits } = require('discord.js');
const { deferInteraction } = require('../../../utilities/discord-action-utils');

const command = new SlashCommand({
	name: "toggle-status",
	description: "Turn Brobot off and on",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	let config = JSON.parse(await fs.readFile("bot-config/config.json"));
	console.log({config});

	if (config.isSleep) {
			config.isSleep = false
	} else {
			config.isSleep = true
	}

	await fs.writeFile(`bot-config/config.json`, JSON.stringify(config))

	interaction.editReply(`Done.`)
},
module.exports = command;