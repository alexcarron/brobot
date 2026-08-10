import { CategoryChannel, ChannelType, Guild, GuildBasedChannel } from "discord.js";
import { discordCollectionToArray } from "./data-structure-utils";

/**
 * Gets all channels of a guild that are already cached locally, without making a Discord API request.
 * @param guild - The guild whose cached channels to get.
 * @returns An array of the guild's cached channels.
 */
export function getCachedChannelsOfGuild(guild: Guild): GuildBasedChannel[] {
	return discordCollectionToArray(guild.channels.cache);
}

/**
 * Gets all category channels of a guild that are already cached locally, without making a Discord API request.
 * @param guild - The guild whose cached category channels to get.
 * @returns An array of the guild's cached category channels.
 */
export function getCachedCategoryChannelsOfGuild(guild: Guild): CategoryChannel[] {
	return getCachedChannelsOfGuild(guild).filter(
		(channel): channel is CategoryChannel => channel.type === ChannelType.GuildCategory
	);
}
