const { ChannelType, Client, Events, Message } = require("discord.js");
const { onNormalMessageSent } = require("./on-normal-message-sent");

const { prefix } = require('../bot-config/config.json');
const { onDmRecieved } = require("./on-dm-recieved");
const { onSlashCommandExecuted } = require("./on-slash-command-executed");

const isDM = (message) =>
	message.channel.type === ChannelType.DM ||
	message.channel.type === ChannelType.GroupDM;

const isTextCommand = (message) =>
		message.content.startsWith(prefix) &&
		!message.author.bot;

const isSlashCommand = (interaction) =>
	interaction.isChatInputCommand();

const setupMessageSentListener =
	(client) => {

		client.on(Events.MessageCreate,
			async (message) => {

				if (isDM(message)) {
					await onDmRecieved(message);
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

const setupInteractionCreateListener =
	(client) => {
		client.on(Events.InteractionCreate,
			async (interaction) => {
				if (isSlashCommand(interaction))
					await onSlashCommandExecuted(interaction);
			}
		)
	};

const setupEventListeners = (client) => {
	console.log("setupEventListeners");

	setupMessageSentListener(client);
	setupInteractionCreateListener(client);
}

module.exports = {setupEventListeners};