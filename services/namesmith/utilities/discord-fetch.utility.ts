import { GuildMember, Guild, TextChannel } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { fetchGuild, fetchGuildMember, fetchAllGuildMembers, fetchTextChannel } from "../../../utilities/discord-fetch-utils";
import { InvalidArgumentError } from "../../../utilities/error-utils";

/**
 * Checks if the given channel ID is a valid channel ID in the Namesmith Discord server.
 * @param channelID - The ID of the channel to check.
 * @returns True if the channel ID is a valid Namesmith channel ID, false otherwise.
 */
export const isNamesmithChannelID = (channelID: string): boolean =>
	Object.values(ids.namesmith.channels).includes(channelID as any);

/**
 * Fetches the Namesmith server from Discord.
 * @returns A promise that resolves to the Namesmith Guild object.
 */
export const fetchNamesmithServer = async (): Promise<Guild> => {
	return await fetchGuild(ids.servers.NAMESMITH);
}

/**
 * Fetches a specific channel from the Namesmith server using the provided channel ID.
 * @param channelID The ID of the channel to fetch.
 * @returns A promise that resolves to the TextChannel object for the specified channel.
 */
export const fetchNamesmithChannel = async (
	channelID: string
): Promise<TextChannel> => {
	if (!isNamesmithChannelID(channelID))
		throw new InvalidArgumentError(`fetchNamesmithChannel: channelID '${channelID}' is not a Namesmith channel ID.`);

	return await fetchTextChannel(
		await fetchNamesmithServer(),
		channelID
	);
}

/**
 * Fetches the 'published names' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'published names' channel.
 */
export const fetchPublishedNamesChannel = async (): Promise<TextChannel> => {
	return await fetchNamesmithChannel(ids.namesmith.channels.PUBLISHED_NAMES);
}

/**
 * Fetches the 'names to vote on' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'names to vote on' channel.
 */
export const fetchNamesToVoteOnChannel = async (): Promise<TextChannel> => {
	return await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
}

/**
 * Fetches the 'the winner' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'the winner' channel.
 */
export const fetchTheWinnerChannel = async (): Promise<TextChannel> => {
	return await fetchNamesmithChannel(ids.namesmith.channels.THE_RESULTS);
}

/**
 * Fetches a guild member from the Namesmith server by player ID.
 * @param playerID The ID of the player to fetch a guild member for.
 * @returns A promise that resolves to the GuildMember object for the given player ID.
 */
export const fetchNamesmithGuildMember = async (playerID: string): Promise<GuildMember> => {
	return await fetchGuildMember(
		await fetchNamesmithServer(),
		playerID
	);
}

/**
 * Fetches all guild members from the Namesmith server.
 * @returns A promise that resolves to an array of all guild members in the Namesmith server.
 */
export const fetchNamesmithGuildMembers = async (): Promise<GuildMember[]> => {
	const namesmithGuild = await fetchNamesmithServer();
	const guildMembers = await fetchAllGuildMembers(namesmithGuild);
	return guildMembers;
}
