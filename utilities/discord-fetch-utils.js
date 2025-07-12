const { Client, Guild, TextChannel, VoiceChannel, Message, ChannelType, GuildMember, User, Role, ChatInputCommandInteraction } = require("discord.js");
const ids = require("../bot-config/discord-ids");
const { discordCollectionToArray } = require("./data-structure-utils");

/**
 * Asserts that the Discord client is setup and ready.
 * This function will throw an Error if the client is not setup or not ready.
 * @throws {Error} If the client is not setup or not ready.
 */
const assertClientSetup = () => {
	const client = global.client;
	if (!client)
		throw new Error(`assertClientSetup: client is not setup, got ${client}`);

	if (!(client instanceof Client))
		throw new Error(`assertClientSetup: client is not an instance of Client, got ${client}`);

	if (!client.isReady())
		throw new Error(`assertClientSetup: client is not ready, got ${client}`);
}


/**
 * Fetches a guild from Discord using the global client.
 * @param {string} guildID The ID of the guild to fetch.
 * @returns {Promise<Guild>} A Promise that resolves with the Guild object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchGuild = async (guildID) => {
	assertClientSetup();
	return await global.client.guilds.fetch(guildID);
}

/**
 * Fetches all channels in a given guild.
 * @param {Guild} guild The guild whose channels to fetch.
 * @returns {Promise<GuildChannel[]>} A Promise that resolves with an array of all channels in the guild.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchChannelsOfGuild = async (guild) => {
	const channels = await guild.channels.fetch();
	return discordCollectionToArray(channels);
}

/**
 * Fetches a user from Discord using the global client.
 * @param {string} userID The ID of the user to fetch.
 * @returns {Promise<User>} A Promise that resolves with the User object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchUser = async (userID) => {
	assertClientSetup();
	return await global.client.users.fetch(userID);
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
 * Fetches a guild member from a given guild using a given guild member ID.
 * @param {Guild} guild The guild that the guild member belongs to.
 * @param {string} guildMemberID The ID of the guild member to fetch.
 * @returns {Promise<GuildMember>} A Promise that resolves with the GuildMember object if successful, or rejects with an Error if not.
 */
const fetchGuildMember = async (guild, guildMemberID) => {
	return await guild.members.fetch(guildMemberID);
}

/**
 * Fetches all members from a given guild.
 * @param {Guild} guild The guild whose members you want to fetch.
 * @returns {Promise<GuildMember[]>} A Promise that resolves with an array of all guild members.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchAllGuildMembers = async (guild) => {
	const members = await guild.members.fetch();
	return discordCollectionToArray(members);
}

/**
 * Fetches a role from a given guild using a given role ID.
 * @param {Guild} guild The guild that the role belongs to.
 * @param {string} roleID The ID of the role to fetch.
 * @returns {Promise<Role>} A Promise that resolves with the Role object if successful, or rejects with an Error if not.
 */
const fetchRole = async (guild, roleID) => {
	return await guild.roles.fetch(roleID);
}

/**
 * Fetches all roles in a given guild.
 * @param {Guild} guild The guild whose roles we want to fetch.
 * @returns {Promise<Role[]>} A Promise that resolves with a array of all roles in the guild.
 */
const fetchRolesInGuild = async (guild) => {
	const roles = await guild.roles.fetch();
	return discordCollectionToArray(roles);
}

/**
 * Fetches a role from a given guild using a given role name.
 * @param {Guild} guild The guild that the role belongs to.
 * @param {string} roleName The name of the role to fetch.
 * @returns {Promise<Role>} A Promise that resolves with the Role object if successful, or rejects with an Error if not.
 */
const fetchRoleByName = async (guild, roleName) => {
	const rolesInGuild = await fetchRolesInGuild(guild);
	return rolesInGuild.find((role) => role.name === roleName);
}

/**
 * Fetches all the categories of a given guild.
 * @param {Guild} guild The guild whose categories you want to fetch.
 * @returns {Promise<GuildChannel[]>} A Promise that resolves with a Collection of the categories of the guild.
 */
const fetchCategoriesOfGuild = async (guild) => {
	const channels = await fetchChannelsOfGuild(guild);
	return channels.filter((channel) =>
		channel.type === ChannelType.GuildCategory
	);
}

/**
 * Fetches all the channels in a category.
 * @param {Guild} guild The guild whose category you want to fetch the channels of.
 * @param {string} categoryID The ID of the category whose channels you want to fetch.
 * @returns {Promise<GuildChannel[]>} A Promise that resolves with an array of the channels in the category.
 */
const fetchChannelsInCategory = async (guild, categoryID) => {
	const allChannelsInGuild = await guild.channels.fetch();

	return Array.from(allChannelsInGuild.filter((channel) =>
		channel.parentId === categoryID
	).values());
}

/**
 * Fetches the Rapid Discord Mafia guild.
 * @returns {Promise<Guild>} A Promise that resolves with the Rapid Discord Mafia guild.
 */
const fetchRDMGuild = async () => {
	return await fetchGuild(ids.servers.rapid_discord_mafia);
}

/**
 * Gets an integer parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string} name - The name of the integer parameter
 * @returns {number | null} The value of the integer parameter
 */
const getIntegerParamValue = (interaction, name) => {
	return interaction.options.getInteger(name);
}

/**
 * Gets a string parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string} name - The name of the string parameter
 * @returns {string | null} The value of the string parameter
 */
const getStringParamValue = (interaction, name) => {
	return interaction.options.getString(name);
}

/**
 * Gets a user parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string} name - The name of the parameter
 * @returns {User | null} The value of the user parameter
 */
const getUserParamValue = (interaction, name) => {
	return interaction.options.getUser(name);
}

/**
 * Gets the everyone role of a given guild.
 * @param {Guild} guild The guild whose everyone role you want to fetch.
 * @returns {Role} The everyone role of the guild.
 */
const getEveryoneRole = (guild) => guild.roles.everyone;

/**
 * Gets the nickname of the user who invoked a slash command.
 * @param {ChatInputCommandInteraction} interaction The interaction object of the slash command.
 * @returns {string} A Promise that resolves with the nickname of the user who invoked the slash command.
 */
const getNicknameOfInteractionUser = (interaction) => {
	return interaction.member.nickname
}

/**
 * Fetches all messages in a channel
 * @param {TextChannel} channel The channel whose messages you want to fetch
 * @returns {Promise<Message[]>} A Promise that resolves with an array of all messages in the channel
 */
const fetchMessagesInChannel = async (channel) => {
  if (!channel || !(channel instanceof TextChannel)) {
    console.error('Channel is not a text channel or not found.');
    return;
  }

  const allMessages = [];
  let oldestMessageID = undefined;
	let keepFetching = true;

  while (keepFetching) {
    const fetched = await channel.messages.fetch({
			limit: 100,
			before: oldestMessageID
		});
    if (fetched.size === 0)
			keepFetching = false;

    allMessages.push(...fetched.values());
    oldestMessageID = fetched.last()?.id;
  }

	// Ensure messages are in chronological order
	allMessages.reverse();

	return allMessages;
}

module.exports = { assertClientSetup, fetchGuild, fetchChannel, fetchChannelsOfGuild, fetchMessage, fetchCategoriesOfGuild, fetchChannelsInCategory, fetchRDMGuild, fetchGuildMember, fetchAllGuildMembers, fetchUser, fetchRole, fetchRoleByName, getStringParamValue, getUserParamValue, getEveryoneRole, getIntegerParamValue, getNicknameOfInteractionUser, fetchMessagesInChannel };