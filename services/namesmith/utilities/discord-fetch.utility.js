/**
 * @fileoverview Utility functions for working with Discord entities related to the Namesmith server.
 */

const { GuildMember } = require("discord.js");
const ids = require("../../../bot-config/discord-ids");
const { fetchGuild, fetchChannel, fetchGuildMember, fetchAllGuildMembers } = require("../../../utilities/discord-fetch-utils");

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
 * Fetches the 'names to vote on' channel from the Namesmith server.
 * @returns {Promise<TextChannel>} A promise that resolves to the TextChannel object for the 'names to vote on' channel.
 */
const fetchNamesToVoteOnChannel = async () => {
	return await fetchChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.namesToVoteOn
	);
}

/**
 * Fetches the 'the winner' channel from the Namesmith server.
 * @returns {Promise<TextChannel>} A promise that resolves to the TextChannel object for the 'the winner' channel.
 */
const fetchTheWinnerChannel = async () => {
	return await fetchChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.theWinner
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

/**
 * Fetches all guild members from the Namesmith server.
 * @returns {Promise<GuildMember[]>} A promise that resolves to an array of all guild members in the Namesmith server.
 */
const fetchNamesmithGuildMembers = async () => {
	const namesmithGuild = await fetchNamesmithServer();
	const guildMembers = await fetchAllGuildMembers(namesmithGuild);
	return guildMembers;
}

module.exports = { fetchNamesmithServer, fetchPublishedNamesChannel, fetchNamesToVoteOnChannel, fetchNamesmithGuildMember, fetchTheWinnerChannel, fetchNamesmithGuildMembers };