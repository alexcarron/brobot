const { Message, ChannelType } = require("discord.js");
const { ids } = require("../bot-config/discord-ids");
const { fetchGuild, fetchTextChannel } = require("../utilities/discord-fetch-utils");
const { InvalidArgumentError } = require("../utilities/error-utils");

/**
 * Logs a direct message in the DM log channel on the Brobot testing server
 * @param {Message<false>} message The direct message to log
 * @returns {Promise<void>}
 */
const onDmRecieved = async (message) => {
	let brobotServer = await fetchGuild(ids.servers.brobot_testing);
	let dmChannel = await fetchTextChannel(brobotServer, ids.brobot_test_server.channels.dm_log);
	let recipient_message;
	const channelSentIn = message.channel;

	if (channelSentIn.type !== ChannelType.DM)
		throw new InvalidArgumentError(`Message ${message.id} is not a DM`);

	const recipient = channelSentIn.recipient;

	if (recipient === null)
		throw new InvalidArgumentError(`Recipient of message ${message.id} is null in channel ${channelSentIn.id}`);

	// From BroBot
	if (message.author.id === ids.users.BROBOT) {
		recipient_message = `<@${ids.users.BROBOT}> ➜ <@${recipient.id}>\n\`Brobot ➜ ${recipient.username}\``;
	}
	// To Brobot
	else {
		recipient_message = `<@${recipient.id}> ➜ <@${ids.users.BROBOT}>\n\`${recipient.username} ➜ Brobot\``;
	}

	await dmChannel.send(
		`${recipient_message}\n` +
		`DM Channel ID: \`${message.channel.id}\`\n` +
		`Message ID: \`${message.id}\`\n` +
		`\n` +
		`\`\`\`${message.content}\`\`\``
	)
}

module.exports = { onDmRecieved }