const { SlashCommand } = require('../../services/command-creation/slash-command');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const ids = require(`../../bot-config/discord-ids.js`);
const { COMMAND_EXPLANATIONS } = require('../../services/rapid-discord-mafia/constants/possible-messages.js');

module.exports = new SlashCommand({
	name: 'commands',
	description: 'See a list of all Rapid Discord Mafia commands and what they do',
	required_servers: [
		ids.servers.rapid_discord_mafia
	],
	execute: async function (interaction) {
		await deferInteraction(interaction);

		await interaction.editReply(
			`## Commands\n` +
			COMMAND_EXPLANATIONS.map(string => `> - ${string}`).join("\n")
		);
	},
});