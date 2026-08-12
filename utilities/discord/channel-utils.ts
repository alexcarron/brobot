import {
	CategoryChannelResolvable,
	ChannelType,
	ChatInputCommandInteraction,
	Guild,
	GuildBasedChannel,
	GuildChannel,
	GuildChannelCreateOptions,
	OverwriteResolvable,
	TextChannel,
} from "discord.js";
import { discordCollectionToArray, getShuffledArray } from "../data-structure-utils";
import { InvalidArgumentTypeError } from "../error-utils";
import { logInfo } from "../logging-utils";
import { incrementEndNumber } from "../string-manipulation-utils";
import { CategoryChannel } from "discord.js";
import { createCategory, fetchCategory, fetchChannelsInCategory } from "./category-utils";
import { createEveryoneDenyViewPermission } from "./permission-utils";

/**
 * Fetches a channel from Discord using the given guild.
 * @param guild The guild that the channel belongs to.
 * @param channelID The ID of the channel to fetch.
 * @returns A Promise that resolves with the Channel object if successful, or rejects with an Error if not.
 */
export async function fetchChannel(guild: Guild, channelID: string): Promise<GuildBasedChannel | null> {
	return await guild.channels.fetch(channelID);
}

/**
 * Fetches a TextChannel from Discord using the given guild.
 * @param guild The guild that the channel belongs to.
 * @param channelID The ID of the channel to fetch.
 * @returns A Promise that resolves with the TextChannel object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchTextChannel(guild: Guild, channelID: string): Promise<TextChannel> {
	const channel = await fetchChannel(guild, channelID);

	if (!(channel instanceof TextChannel))
		throw new Error(`fetchTextChannel: channel is not an instance of TextChannel, got ${channel}`);

	return channel;
}

/**
 * Fetches a GuildChannel from Discord using the given guild.
 * @param guild The guild that the channel belongs to.
 * @param channelID The ID of the channel to fetch.
 * @returns A Promise that resolves with the GuildChannel object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchGuildChannel(guild: Guild, channelID: string): Promise<GuildChannel> {
	const channel = await fetchChannel(guild, channelID);

	if (!(channel instanceof GuildChannel))
		throw new Error(`fetchGuildChannel: channel is not an instance of GuildChannel, got ${channel}`);

	return channel;
}

/**
 * Gets the text channel of the interaction.
 * @param interaction - The interaction whose text channel is to be retrieved.
 * @returns The text channel of the interaction.
 * @throws {Error} If the client is not setup or not ready, or if the interaction does not have a channel, or if the channel of the interaction is not a text channel.
 */
export function getTextChannelOfInteraction(interaction: ChatInputCommandInteraction): TextChannel {
	if (!interaction.channel)
		throw new Error(`getTextChannelOfInteraction: The channel of the interaction does not exist, got ${interaction.channel}`);

	if (interaction.channel.type !== ChannelType.GuildText)
		throw new Error(`getTextChannelOfInteraction: The channel of the interaction is not a text channel, got ${interaction.channel}`);

	return interaction.channel;
}

/**
 * Fetches all channels in a given guild.
 * @param guild The guild whose channels to fetch.
 * @returns A Promise that resolves with an array of all channels in the guild.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchChannelsOfGuild(guild: Guild): Promise<GuildBasedChannel[]> {
	const channels = await guild.channels.fetch();
	return discordCollectionToArray(channels) as GuildBasedChannel[];
}

/**
 * Creates a Discord channel in a guild.
 * If the parent category has reached its maximum number of channels, it will create a new category and place the channel within it.
 * @param options - Options for creating the channel.
 * @param options.guild - The guild in which the channel is to be created.
 * @param options.name - The name of the channel.
 * @param [options.permissions] - Permission overwrites for the channel.
 * @param [options.parentCategory] - The parent category of the channel.
 * @returns The created channel.
 */
export async function createChannel({
	guild,
	name,
	permissions = [],
	parentCategory: parentCategoryResolvable = null
}: {
	guild: Guild;
	name: string;
	permissions?: OverwriteResolvable[];
	parentCategory?: CategoryChannelResolvable | null;
}): Promise<TextChannel> {
	const MAX_CHANNELS_PER_CATEGORY = 50;

	if (!guild)
		throw new Error("Guild is required");

	if (!(guild instanceof Guild))
		throw new Error("Guild object must be an instance of Guild");

	if (!name)
		throw new Error("Channel name is required");

	if (typeof name !== "string")
		throw new Error("Channel name must be a string");

	if (permissions && !Array.isArray(permissions))
		throw new Error("Permissions must be an array");

	let parentCategory: CategoryChannel | null = null;
	if (parentCategoryResolvable !== null) {
		if (!(parentCategoryResolvable instanceof CategoryChannel)) {
			parentCategory = await fetchCategory(guild, parentCategoryResolvable);
		}
	}

	let categoryHasSpaceForChannel = false;

	while (
		parentCategory !== null &&
		!categoryHasSpaceForChannel
	) {
		const childChannelCount = parentCategory.children.cache.size;
		if (childChannelCount >= MAX_CHANNELS_PER_CATEGORY) {
			const newCategoryName = incrementEndNumber(parentCategory.name);

			const newCategory =
				guild.channels.cache.find((channel) =>
					channel.name === newCategoryName &&
					channel.type === ChannelType.GuildCategory
				);

			if (newCategory !== undefined) {
				parentCategory = newCategory as CategoryChannel;
			}
			else {
				parentCategory = await createCategory({
					guild,
					name: newCategoryName,
					permissions: [createEveryoneDenyViewPermission(guild)],
				});
			}
		}
		else {
			categoryHasSpaceForChannel = true;
			break;
		}
	}

	const options: GuildChannelCreateOptions = {
		name: name,
		type: ChannelType.GuildText,
	};

	if (parentCategory !== null) {
		options.parent = parentCategory;
	}

	if (permissions) {
		options.permissionOverwrites = permissions;
	}

	const channel = await guild.channels.create(options);

	return channel as TextChannel;
}

/**
 * Renames a Discord channel.
 * @param channel - The channel to rename.
 * @param newName - The new name for the channel.
 * @returns A promise that resolves when the channel has been renamed.
 */
export async function renameChannel(channel: TextChannel, newName: string): Promise<void> {
	await channel.setName(newName);
}

/**
 * Moves a channel into a category or uncategorizes it.
 * @param channel - The channel to move.
 * @param [category] - The category to move the channel into, or null for no category.
 * @param [inheritPermissions] - Whether to inherit permissions from the category.
 * @returns The updated channel.
 */
export async function moveChannelToCategory(channel: GuildChannel, category: CategoryChannel | null, inheritPermissions = false): Promise<GuildChannel> {
	if (channel instanceof GuildChannel === false)
		throw new InvalidArgumentTypeError({
			functionName: "moveChannelToCategory",
			argumentName: "channel",
			expectedType: "GuildChannel",
			actualValue: channel
		});

	if (
		category !== null && category !== undefined &&
		category instanceof CategoryChannel === false
	)
		throw new InvalidArgumentTypeError({
			functionName: "moveChannelToCategory",
			argumentName: "category",
			expectedType: "CategoryChannel",
			actualValue: category
		});

	if (category === null || category === undefined)
		return await channel.setParent(null, { lockPermissions: inheritPermissions });
	else
		return await channel.setParent(category, { lockPermissions: inheritPermissions });
}

/**
 * Shuffles all the channels in a category in a random order, keeping the other channels in the same position.
 * @param guild - The guild whose category's channels are to be shuffled.
 * @param category - The category whose channels are to be shuffled, or the ID of the category as a string.
 * @returns A promise that resolves when the channels have been shuffled.
 */
export async function shuffleCategoryChannels(guild: Guild, category: CategoryChannel | string): Promise<void> {
	// Resolve category
	if (typeof category === "string") {
		category = await fetchCategory(guild, category);
	}

	// Check types
	if (!(category instanceof GuildChannel))
		throw new Error("shuffleCategoryChannels: Category must be an instance of GuildChannel");

	if (category.type !== ChannelType.GuildCategory)
		throw new Error("shuffleCategoryChannels: Category must be an instance of GuildCategoryChannel");

	const channelsToShuffle = await fetchChannelsInCategory(guild, category.id);
	const shuffledChannels = getShuffledArray(channelsToShuffle);
	logInfo(`Shuffled Order: ${shuffledChannels.map(channel => channel.name).join(", ")}`);

	for (let i = 0; i < shuffledChannels.length; i++) {
		try {
			await shuffledChannels[i].setPosition(category.position + i + 1);
			// The +1 is arbitrary: sometimes Discord expects category itself to be position 0
		} catch (error) {
			console.error(`Failed to set position for ${shuffledChannels[i].name}`, error);
		}
	}
	await guild.channels.setPositions(
		shuffledChannels.map((channel, position) => ({
			channel: channel.id,
			position: category.position + position + 1
		}))
	);

	console.log("Channels reordered inside category.");
}
