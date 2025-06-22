const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const { fetchChannel, fetchMessagesInChannel } = require("../../utilities/discord-fetch-utils");

const command = new SlashCommand({
	name: "read-all-messages",
	description: "DESCRIPTION OF COMMAND HERE",
});
command.required_servers = [ids.servers.brobot_testing];

// Indicate that this command is in development
command.isInDevelopment = true;

command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const evolutionsChannel = await fetchChannel(interaction.guild,
		ids.evolutionGame.channels.evolutions
	);

	const allMessages = await fetchMessagesInChannel(evolutionsChannel);

	const textOfAllMessages = allMessages.map(message => message.content);

	await editReplyToInteraction(interaction,
		textOfAllMessages.join("\n")
	)
}

module.exports = command;