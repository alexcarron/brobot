const { SlashCommand } = require('../../services/command-creation/slash-command');
const ids = require(`../../bot-config/discord-ids.js`);
const { Parameter } = require('../../services/command-creation/parameter');
const { PermissionFlagsBits } = require('discord.js');

const Parameters = {
	Property: new Parameter({
		type: "string",
		name: "property",
		description: "The property of the game data you want to change"
	}),
	Value: new Parameter({
		type: "string",
		name: "value",
		description: "The value you want to change the property of the game data to"
	}),
}

module.exports = new SlashCommand({
	name: "set-game",
	description: "Set a property of the game data to a certain value",
	required_servers: [ids.servers.rapid_discord_mafia],
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Property,
		Parameters.Value,
	],
	execute: async function execute(interaction) {
		await interaction.deferReply({ephemeral: true});

		const property = interaction.options.getString(Parameters.Property.name);
		const value = interaction.options.getString(Parameters.Value.name);

		global.game_manager[property] = value;

		interaction.editReply(`Changed **${property}** to \`${value}\``);
	}
})

