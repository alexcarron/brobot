const { Client, Guild, TextChannel, VoiceChannel, Message, ChannelType, Snowflake, GuildMember, User, Role, Collection, ChatInputCommandInteraction } = require("discord.js");
const ids = require("../bot-config/discord-ids");

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
 * @returns {Promise<Collection<Snowflake, Role>>} A Promise that resolves with a Collection of all roles in the guild.
 */
const fetchRolesInGuild = async (guild) => {
	return await guild.roles.fetch();
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
 * @returns {Promise<Collection<string, GuildChannel>>} A Promise that resolves with a Collection of the categories of the guild.
 */
const fetchCategoriesOfGuild = async (guild) => {
	return await guild.channels.filter((channel) =>
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
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name - The name of the parameter
 * @returns {number | null}
 */
const getIntegerParamValue = (interaction, name) => {
	return interaction.options.getInteger(name);
}

/**
 * Gets a string parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name - The name of the parameter
 * @returns {string | null}
 */
const getStringParamValue = (interaction, name) => {
	return interaction.options.getString(name);
}

/**
 * Gets a user parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name - The name of the parameter
 * @returns {User | null}
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

module.exports = { assertClientSetup, fetchGuild, fetchChannel, fetchMessage, fetchCategoriesOfGuild, fetchChannelsInCategory, fetchRDMGuild, fetchGuildMember, fetchUser, fetchRole, fetchRoleByName, getStringParamValue, getUserParamValue, getEveryoneRole, getIntegerParamValue, getNicknameOfInteractionUser };