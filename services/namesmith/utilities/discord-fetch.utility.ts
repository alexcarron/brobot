import { GuildMember, Guild, TextChannel } from "discord.js";
import ids from "../../../bot-config/discord-ids";
import { fetchGuild, fetchGuildMember, fetchAllGuildMembers, fetchTextChannel } from "../../../utilities/discord-fetch-utils";

/**
 * Fetches the Namesmith server from Discord.
 * @returns A promise that resolves to the Namesmith Guild object.
 */
export const fetchNamesmithServer = async (): Promise<Guild> => {
	return await fetchGuild(ids.servers.namesmith);
}


/**
 * Fetches the 'published names' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'published names' channel.
 */
export const fetchPublishedNamesChannel = async (): Promise<TextChannel> => {
	return await fetchTextChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.publishedNames
	);
}

/**
 * Fetches the 'names to vote on' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'names to vote on' channel.
 */
export const fetchNamesToVoteOnChannel = async (): Promise<TextChannel> => {
	return await fetchTextChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.namesToVoteOn
	);
}

/**
 * Fetches the 'the winner' channel from the Namesmith server.
 * @returns A promise that resolves to the TextChannel object for the 'the winner' channel.
 */
export const fetchTheWinnerChannel = async (): Promise<TextChannel> => {
	return await fetchTextChannel(
		await fetchNamesmithServer(),
		ids.namesmith.channels.theWinner
	);
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
