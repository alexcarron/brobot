import {
	CategoryChannel,
	ChannelType,
	ChatInputCommandInteraction,
	Guild,
	GuildChannel,
	GuildChannelCreateOptions,
	OverwriteResolvable,
	TextChannel,
} from "discord.js";
import { discordCollectionToArray } from "../data-structure-utils";

/**
 * Fetches a category from Discord using the given guild.
 * @param guild The guild that the category belongs to.
 * @param categoryID The ID of the category to fetch.
 * @returns A Promise that resolves with the CategoryChannel object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchCategory(guild: Guild, categoryID: string): Promise<CategoryChannel> {
	const channel = await guild.channels.fetch(categoryID);

	if (!channel)
		throw new Error(`fetchCategory: channel is null, got ${channel}`);

	if (channel.type !== ChannelType.GuildCategory)
		throw new Error(`fetchCategory: channel is not a category, got ${channel}`);

	return channel;
}

/**
 * Gets the category channel of the interaction.
 * @param interaction - The interaction whose category channel is to be retrieved.
 * @returns The parent category channel of the interaction's channel.
 */
export function getCategoryOfInteraction(interaction: ChatInputCommandInteraction): CategoryChannel {
	if (!interaction.channel)
		throw new Error(`getCategoryOfInteraction: The channel of the interaction does not exist, got ${interaction.channel}`);

	if (!("parent" in interaction.channel) || !interaction.channel.parent)
		throw new Error(`getCategoryOfInteraction: The parent of the interaction's channel does not exist`);

	if (interaction.channel.parent.type !== ChannelType.GuildCategory)
		throw new Error(`getCategoryOfInteraction: The parent of the interaction's channel is not a category`);

	return interaction.channel.parent;
}

/**
 * Fetches all the categories of a given guild.
 * @param guild The guild whose categories you want to fetch.
 * @returns A Promise that resolves with an array of the categories of the guild.
 */
export async function fetchCategoriesOfGuild(guild: Guild): Promise<CategoryChannel[]> {
	const channels = await guild.channels.fetch();
	return discordCollectionToArray(channels).filter(
		(channel): channel is CategoryChannel => channel !== null && channel.type === ChannelType.GuildCategory
	);
}

/**
 * Fetches all the channels in a category.
 * @param guild The guild whose category you want to fetch the channels of.
 * @param categoryID The ID of the category whose channels you want to fetch.
 * @returns A Promise that resolves with an array of the channels in the category.
 */
export async function fetchChannelsInCategory(guild: Guild, categoryID: string): Promise<GuildChannel[]> {
	const allChannelsInGuild = await guild.channels.fetch();

	const channels = allChannelsInGuild.filter((channel) => {
		if (channel === null)
			return false;

		return channel.parentId === categoryID;
	});

	return discordCollectionToArray(channels) as GuildChannel[];
}

/**
 * Fetches all the text channels in a category.
 * @param guild The guild whose category you want to fetch the text channels of.
 * @param categoryID The ID of the category whose text channels you want to fetch.
 * @returns A Promise that resolves with an array of the text channels in the category.
 */
export async function fetchTextChannelsInCategory(guild: Guild, categoryID: string): Promise<TextChannel[]> {
	const allChannelsInGuild = await guild.channels.fetch();

	return Array.from(
		allChannelsInGuild.filter((channel): channel is TextChannel =>
			channel !== null &&
			channel.parentId === categoryID &&
			channel.type === ChannelType.GuildText &&
			channel instanceof TextChannel
		).values()
	);
}

/**
 * Creates a category in a guild.
 * @param options - Options for creating the category.
 * @param options.guild - The guild in which the category is to be created.
 * @param options.name - The name of the category.
 * @param [options.permissions] - Permission overwrites for the category.
 * @returns The created category.
 */
export async function createCategory({ guild, name, permissions = [] }: { guild: Guild; name: string; permissions?: readonly OverwriteResolvable[] }): Promise<CategoryChannel> {
	if (!guild)
		throw new Error("Guild is required");

	if (!(guild instanceof Guild))
		throw new Error("Guild object must be an instance of Guild");

	if (!name)
		throw new Error("Category name is required");

	if (typeof name !== "string")
		throw new Error("Category name must be a string");

	const options: GuildChannelCreateOptions = {
		name: name,
		type: ChannelType.GuildCategory,
	};
	if (permissions) {
		options.permissionOverwrites = permissions;
	}

	// @ts-ignore
	const category = await guild.channels.create(options);

	// @ts-ignore
	return category;
}
