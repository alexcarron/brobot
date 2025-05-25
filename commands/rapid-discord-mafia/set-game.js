
const fs = require('fs');
const SlashCommand = require('../../services/command-creation/slash-command');
const ids = require(`../../bot-config/discord-ids.js`);
const { Parameter } = require('../../services/command-creation/parameter');
const { PermissionFlagsBits } = require('discord.js');

const command = new SlashCommand({
	name: "set-game",
	description: "Set a property of the game data to a certain value",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	new Parameter({
		type: "string",
		name: "property",
		description: "The property of the game data you want to change"
	}),
	new Parameter({
		type: "string",
		name: "value",
		description: "The value you want to change the property of the game data to"
	}),
];
command.execute = async function execute(interaction) {
	await interaction.deferReply({ephemeral: true});

	const property = interaction.options.getString(command.parameters[0].name);
	const value = interaction.options.getString(command.parameters[1].name);

	global.game_manager[property] = value;

	interaction.editReply(`Changed **${property}** to \`${value}\``);
}

module.exports = command;