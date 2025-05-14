const { Client, Guild, TextChannel, VoiceChannel, Message, ChannelType } = require("discord.js");

/**
 * Asserts that the Discord client is setup and ready.
 * This function will throw an Error if the client is not setup or not ready.
 * @throws {Error} If the client is not setup or not ready.
 */
const assertClientSetup = () => {
	const client = global.client;
	if (!client) throw new Error('Client is not defined.');
	if (!(client instanceof Client)) throw new Error('Client is not an instance of Client.');
	if (!client.isReady()) throw new Error('Client is not ready.');
}


/**
 * Fetches a guild from Discord using the client.
 * @param {string} guildID The ID of the guild to fetch.
 * @returns {Promise<Guild>} A Promise that resolves with the Guild object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchGuild = async (guildID) => {
	assertClientSetup();
	return await global.client.guilds.fetch(guildID);
}

/**
 * Fetches a channel from Discord using the given guild.
 * @param {Guild} guild The guild that the channel belongs to.
 * @param {string} channelID The ID of the channel to fetch.
 * @returns {Promise<TextChannel|VoiceChannel>} A Promise that resolves with the Channel object if successful, or rejects with an Error if not.
 */
const fetchChannel = async (guild, channelID) => {
	return await guild.channels.fetch(channelID);
}

/**
 * Fetches a message from Discord using the given channel.
 * @param {TextChannel|VoiceChannel} channel The channel that the message belongs to.
 * @param {string} messageID The ID of the message to fetch.
 * @returns {Promise<Message>} A Promise that resolves with the Message object if successful, or rejects with an Error if not.
 */
const fetchMessage = async (channel, messageID) => {
	return await channel.messages.fetch(messageID);
}

/**
 * Fetches all the categories of a guild.
 * @param {Guild} guild The guild whose categories you want to fetch.
 * @returns {Promise<Collection<string, GuildChannel>>} A Promise that resolves with a Collection of the categories of the guild.
 */
const fetchCategoriesOfGuild = async (guild) => {
	return await guild.channels.filter((channel) =>
		channel.type === ChannelType.GuildCategory
	);
}

module.exports = { assertClientSetup, fetchGuild, fetchChannel, fetchMessage };