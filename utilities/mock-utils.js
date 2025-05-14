const { Client, Guild } = require("discord.js");

const MOCK_GUILD_DATA = {
	id: "guild-id",
	name: "guild",
}

/**
 * Creates a mock Discord client with a single guild.
 *
 * The client is ready by default.
 *
 * @param {Object} [options] - Optional parameters
 * @param {boolean} [options.isReady=true] - Whether the client should start in the ready state
 * @returns {Client} The mock client
 */
const mockClient = ({ isReady = true } = {}) => {
	const client = new Client({ intents: [] });
	client.isReady = jest.fn().mockReturnValue(isReady);

	const guild = mockGuild({ client, guildData: MOCK_GUILD_DATA });
	client.guilds.cache.set(MOCK_GUILD_DATA.id, guild);

	/**
	 * Fetches a guild from Discord by ID.
	 * @param {string} guildID ID of the guild to fetch.
	 * @returns {Promise<Guild>} Promise with the fetched guild.
	 */
	client.guilds.fetch = jest.fn((guildID) => {
		const guild = client.guilds.cache.get(guildID);
		if (guild) return Promise.resolve(guild);
		return Promise.reject(new Error(`Guild with ID ${guildID} not found`));
	});

	return client;
}

/**
 * Creates a mock Guild instance with given data.
 * @param {Object} [options] - Options for the mock guild.
 * @param {Client} [options.client] - The client this guild belongs to.
 * @param {Object} [options.guildData] - Data for the guild.
 * @returns {Guild} - A mock Guild instance.
 */
const mockGuild = ({ client, guildData = {} } = {}) => {
	if (client === undefined) throw new Error("Client is not given.");

	const guild = new Guild(client, guildData);
	return guild;
}

module.exports = { MOCK_GUILD_DATA, mockClient };