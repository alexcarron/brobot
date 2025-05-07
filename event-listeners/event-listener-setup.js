const { ChannelType, Client, Events, Message } = require("discord.js");
const { onNormalMessageSent } = require("./on-normal-message-sent");

const { prefix } = require('../bot-config/config.json');

const isDM = (message) =>
	message.channel.type === ChannelType.DM ||
	message.channel.type === ChannelType.GroupDM;

const isTextCommand = (message) =>
		message.content.startsWith(prefix) &&
		!message.author.bot;

const setupMessageSentListener =
	(client) => {
		console.log("setupMessageSentListener");

		client.on(Events.MessageCreate,
			async (message) => {
				console.log("onEventMessageSent", message.content);

				if (isDM(message)) {
					console.log("onDM")
					return;
				}

				if (isTextCommand(message)) {
					console.log("onTextCommand")
					return;
				}

				await onNormalMessageSent(message);
			}
		);
	};

const setupEventListeners = (client) => {
	console.log("setupEventListeners");

	setupMessageSentListener(client);
}

module.exports = {setupEventListeners};