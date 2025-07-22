const ids = require("../bot-config/discord-ids");

const onDmRecieved = (message) => {
	let brobotServer = global.client.guilds.cache.get(ids.servers.brobot_testing),
	dmChannel = brobotServer.channels.cache.get(ids.brobot_test_server.channels.dm_log),
	recipient_message;

	// From BroBot
	if (message.author.id === ids.users.Brobot) {
		recipient_message = `<@${ids.users.Brobot}> ➜ <@${message.channel.recipient ? message.channel.recipient.id : ""}>\n\`Brobot ➜ ${message.channel.recipient.username}\``;
	}
	// To Brobot
	else {
		recipient_message = `<@${message.channel.recipient.id}> ➜ <@${ids.users.Brobot}>\n\`${message.channel.recipient.username} ➜ Brobot\``;
	}

	dmChannel.send(
		`${recipient_message}\n` +
		`DM Channel ID: \`${message.channel.id}\`\n` +
		`Message ID: \`${message.id}\`\n` +
		`\n` +
		`\`\`\`${message.content}\`\`\``
	)
}

module.exports = { onDmRecieved }