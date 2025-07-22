const { Message, TextChannel } = require("discord.js");
const ids = require("../../bot-config/discord-ids.js");
const cron = require("cron"); // Used to have scheduled functions execute
const { getRandomElement } = require("../../utilities/data-structure-utils.js");
const { fetchGuild, fetchChannel } = require("../../utilities/discord-fetch-utils.js");
const { saveObjectToJsonInGitHub } = require("../../utilities/github-json-storage-utils.js");
const { logWarning, logInfo } = require("../../utilities/logging-utils.js");

/**
 * Handles the sending of daily messages
 */
class DailyMessageHandler {
	/**
	 * A map of channels to the list of possible messages to send to them
	 * @type {{[channelName: string]: string[]}}
	 */
	channelsToMessages;

	static GUILD_ID = ids.ll_game_shows.server_id;
	static HOUR = "12";
	static MINUTE = "00";

	/**
	 * @param {{[channelName: string]: string[]}} channelsToMessages A map of channels to the list of possible messages to send to them
	 */
	constructor(channelsToMessages) {
		this.channelsToMessages = channelsToMessages;
		this.removeEmptyChannelsFromMap();
	}

	/**
	 * Saves the currently stored channelsToMessages map to the brobot persistance database
	 */
	saveMessagesDatabase() {
		saveObjectToJsonInGitHub(this.channelsToMessages, "messages");
	}

	/**
	 * Removes channel entries with no messages from channelsToMessage map
	 */
	removeEmptyChannelsFromMap() {
    for (let [channelName, messages] of Object.entries(this.channelsToMessages)) {
      if (messages.length === 0) {
				delete this.channelsToMessages[channelName];
      }
    }
	}

	/**
	 * Removes a message you already sent from the channelsToMessages map
	 * @param {string} channelName The channel the message belongs to
	 * @param {string} message The message being removed
	 */
  removeMessage(channelName, message) {
    if (Object.keys(this.channelsToMessages).includes(channelName)) {
      const messages = this.channelsToMessages[channelName];
      const messageIndex = messages.indexOf(message);

      if (messageIndex !== -1) {
        messages.splice(messageIndex, 1);
        this.removeEmptyChannelsFromMap(); // Clean up any empty channels
      }
    }
  }

	/**
	 * Get the TextChannel object from a channel name
	 * @param {string} channelName Name of a channel
	 * @returns {Promise<import("discord.js").GuildBasedChannel>} The TextChannel object
	 */
	async convertChannelNameToChannel(channelName) {
		const channelId = ids.ll_game_shows.channels[channelName];

		if (channelId === undefined)
			throw new Error("Channel identifier not found: Property, channelName, nount found on object './bot-config/discord-ids.js/ll_game_shows/channels");

		const guild = await fetchGuild(DailyMessageHandler.GUILD_ID);
		const channel = await fetchChannel(guild, channelId);

		return channel;
	}

	/**
	 * Returns a random channel name out the available ones in the map
	 * @returns {string | null} The randomly selected text channel name, null if no channels left
	 */
	getRandomChannel() {
		const channelNames = Object.keys(this.channelsToMessages);
		const randomChannelName = getRandomElement(channelNames);

		return randomChannelName;
	}

	/**
	 * Returns a random message associated with the passed channel
	 * @param {string} channelName The name of a text channel in the map
	 * @returns {string} A random message associated with that channel
	 */
	getRandomMessage(channelName) {
		const possibleMessages = this.channelsToMessages[channelName];
		const randomMessage = getRandomElement(possibleMessages);

		return randomMessage;
	}

	/**
	 * Sends a random message to a random channel
	 * @returns {Promise<Message>} The message sent
	 */
	async sendDailyMessage() {
		const channelName = this.getRandomChannel();

		if (channelName === null || channelName === undefined) {
			logWarning("No channels with messages left to send");
			return;
		}

		const messageContents = this.getRandomMessage(channelName);
		const channel = await this.convertChannelNameToChannel(channelName);

		this.removeMessage(channelName, messageContents);

		if (!(channel instanceof TextChannel))
			throw new Error("Channel is not a TextChannel");

		return await channel.send(`<@&${ids.ll_game_shows.roles.daily_questions}>\n${messageContents}`);
	}

	startDailyMessages() {
		const cronJob = new cron.CronJob(
			`00 ${DailyMessageHandler.MINUTE} ${DailyMessageHandler.HOUR} * * *`,
			async () => {
				logInfo("Sending Daily Message...");
				await this.sendDailyMessage();
				await this.saveMessagesDatabase();
			},
			null,
			true,
			"America/Chicago"
		);

		logInfo('Starting daily message sending job...');
		cronJob.start();
	}
}

module.exports = DailyMessageHandler;