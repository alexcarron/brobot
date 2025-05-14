const { Client, Guild } = require("discord.js");

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

module.exports = { assertClientSetup, fetchGuild };