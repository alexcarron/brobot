const ids = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { getCreaturesText, getChildCreaturesText } = require("../../services/evolution-game/creature-formatting-utils");
const { parseCreaturesFromMessages } = require("../../services/evolution-game/creature-parser");
const { getEvolutionRoots, getCreatureWithName, getChildCreaturesOf, } = require("../../services/evolution-game/creature-utils");
const { deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const { fetchChannel, fetchMessagesInChannel } = require("../../utilities/discord-fetch-utils");

module.exports = new SlashCommand({
	name: "list-creatures",
	description: "Have Brobot send a list of all creatures in the evolution game with links to their messages",
	required_servers: [ids.servers.evolutionGame],
	isInDevelopment: true,
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const evolutionsChannel = await fetchChannel(interaction.guild,
			ids.evolutionGame.channels.evolutions
		);

		const allMessages = await fetchMessagesInChannel(evolutionsChannel);

		const creatures = parseCreaturesFromMessages(allMessages);
		console.log(creatures);

		const evolutionRoots = getEvolutionRoots(creatures);

		let fullMessage = '';
		for (const headingCreatureNames of evolutionRoots) {
			console.log({headingCreatureNames});
			const headingCreatures = headingCreatureNames.map(name =>
				getCreatureWithName(name, creatures)
			);
			console.log({headingCreatures});
			const rootMessage = `## ${getCreaturesText(headingCreatures)}\n`;

			const children = getChildCreaturesOf(headingCreatureNames, creatures);
			if (children.length === 0) continue;

			const childrenMessage = getChildCreaturesText(children, creatures);

			fullMessage += rootMessage + childrenMessage;
		}

		// Seperate fullMessage into multiple messages that start with ##
		const sections = fullMessage.split('##').map(message => '##' + message);

		// Remove first empty section
		sections.shift();

		for (const section of sections) {
			// If fullMessage > 2000 characters split into multiple messages
			const lines = section.split('\n');
			if (section.length > 2000) {
				let numCharacters = 0;
				let linesToSend = [];

				while (lines.length > 0) {
					const line = lines.shift();
					numCharacters += line.length;
					if (numCharacters > 2000) {
						interaction.channel.send(linesToSend.join('\n'));
						linesToSend = [];
						numCharacters = line.length;
					}
					linesToSend.push(line);
				}

				interaction.channel.send(linesToSend.join('\n'));
			}
			else {
				interaction.channel.send(section);
			}
		}

		await editReplyToInteraction(interaction,
			'Done'
		)
	}
});