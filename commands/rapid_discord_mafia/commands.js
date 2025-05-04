const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');
const ids = require(`../../bot-config/discord-ids.js`);
const { Announcements } = require('../../modules/enums');

const command = new SlashCommand({
	name: 'commands',
	description: 'See a list of all Rapid Discord Mafia commands and what they do'
});

command.required_servers = [
	ids.servers.rapid_discord_mafia
]

command.execute = async function (interaction) {
	await deferInteraction(interaction);

	await interaction.editReply(
		`## Commands\n` +
		Announcements.Commands.map(string => `> - ${string}`).join("\n")
	);
}

module.exports = command;