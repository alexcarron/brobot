const { Parameter } = require('../../services/command-creation/parameter');
const SlashCommand = require('../../services/command-creation/slash-command');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const ids = require(`../../bot-config/discord-ids.js`);
const { COMMAND_EXPLANATIONS } = require('../../services/rapid-discord-mafia/constants/possible-messages.js');

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
		COMMAND_EXPLANATIONS.map(string => `> - ${string}`).join("\n")
	);
}

module.exports = command;