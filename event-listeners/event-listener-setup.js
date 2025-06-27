const { ChannelType, Events, InteractionType, Client } = require("discord.js");
const { onNormalMessageSent } = require("./on-normal-message-sent");

const { onDmRecieved } = require("./on-dm-recieved");
const { onSlashCommandExecuted } = require("./on-slash-command-executed");
const { onSlashCommandAutocomplete } = require("./on-slash-command-autocomplete");
const { onButtonPressed } = require("./on-button-pressed");
const { onUserJoinsServer } = require("./on-user-joins-server");
const { logInfo, logSuccess } = require("../utilities/logging-utils");
const { onMessageDeleted } = require("./on-message-deleted");

const isDM = (message) =>
	message.channel.type === ChannelType.DM ||
	message.channel.type === ChannelType.GroupDM;

const isSlashCommand = (interaction) =>
	interaction.isChatInputCommand();

const isSlashCommandAutoComplete = (interaction) =>
	interaction.isAutocomplete();

const isButtonPress = (interaction) =>
	interaction.type === InteractionType.MessageComponent &&
	interaction.isButton();

/**
 * Sets up an event listener for when a message is sent (either in a DM or in a server channel)
 * If the message is in a DM, the onDmRecieved function is called
 * If the message is in a server channel, the onNormalMessageSent function is called
 * @param {Client} client
 */
const setupMessageSentListener =
	(client) => {

		client.on(Events.MessageCreate,
			async (message) => {

				if (isDM(message)) {
					await onDmRecieved(message);
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

				if (isSlashCommandAutoComplete(interaction))
					await onSlashCommandAutocomplete(interaction);

				if (isButtonPress(interaction))
					await onButtonPressed(interaction);
			}
		)
	};

const setupGuildMemberAddListener =
	(client) => {
		client.on(Events.GuildMemberAdd,
			async (guildMember) => {
				onUserJoinsServer(guildMember);
			}
		);
	};

/**
 * Sets up an event listener for when a message is deleted.
 * When a message is deleted, the onMessageDeleted function is called.
 * @param {Client} client The Discord client instance.
 */
const setupMessageDeleteListener =
	(client) => {
		client.on(Events.MessageDelete,
			async (message) => {
				await onMessageDeleted(message);
			}
		);
	};

const setupEventListeners = (client) => {
	logInfo("Setting up event listeners...");

	setupMessageSentListener(client);
	setupInteractionCreateListener(client);
	setupGuildMemberAddListener(client);
	setupMessageDeleteListener(client);

	logSuccess("Event listeners set up");
}

module.exports = {setupEventListeners};