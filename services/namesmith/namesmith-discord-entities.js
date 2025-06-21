const ids = require("../../bot-config/discord-ids");
const { fetchGuild, fetchChannel, fetchGuildMember } = require("../../utilities/discord-fetch-utils");

/**
 * Fetches the Namesmith server from Discord.
 * @returns {Promise<Guild>} A promise that resolves to the Namesmith Guild object.
 */
const fetchNamesmithServer = async () => {
	return await fetchGuild(ids.servers.namesmith);
}


/**
 * Fetches the 'published names' channel from the Namesmith server.
 * @returns {Promise<TextChannel>} A promise that resolves to the TextChannel object for the 'published names' channel.
 */
const fetchPublishedNamesChannel = async () => {
	return await fetchChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.publishedNames
	);
}

/**
 * Fetches a guild member from the Namesmith server by player ID.
 * @param {string} playerID The ID of the player to fetch a guild member for.
 * @returns {Promise<GuildMember>} A promise that resolves to the GuildMember object for the given player ID.
 */
const fetchNamesmithGuildMember = async (playerID) => {
	return await fetchGuildMember(
		await fetchNamesmithServer(),
		playerID
	);
}

module.exports = { fetchNamesmithServer, fetchPublishedNamesChannel, fetchNamesmithGuildMember };