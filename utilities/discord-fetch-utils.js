const { Client, Guild, TextChannel, Message, ChannelType, GuildMember, User, Role, ChatInputCommandInteraction, GuildChannel, CategoryChannel, AutocompleteInteraction } = require("discord.js");
const { ids } = require("../bot-config/discord-ids");
const { discordCollectionToArray } = require("./data-structure-utils");
const { InvalidArgumentError } = require("./error-utils");
const { Parameter } = require("../services/command-creation/parameter");

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
 * Gets the guild of the interaction.
 * @param {ChatInputCommandInteraction | AutocompleteInteraction} interaction The interaction object of the slash command.
 * @returns {Guild} A Promise that resolves with the Guild object if successful, or rejects with an Error if not.
 * @throws {Error} If the interaction is not in a guild.
 */
const getGuildOfInteraction = (interaction) => {
	const guild = interaction.guild;

	if (guild === null) {
		throw new Error(`getGuildOfInteraction: Interaction is not in a guild, got ${guild}`);
	}

	return guild;
}

/**
 * Fetches all channels in a given guild.
 * @param {Guild} guild The guild whose channels to fetch.
 * @returns {Promise<GuildChannel[]>} A Promise that resolves with an array of all channels in the guild.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchChannelsOfGuild = async (guild) => {
	const channels = await guild.channels.fetch();
	// @ts-ignore
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
 * @returns {Promise<import("discord.js").GuildBasedChannel | null>} A Promise that resolves with the Channel object if successful, or rejects with an Error if not.
 */
const fetchChannel = async (guild, channelID) => {
	return await guild.channels.fetch(channelID);
}

/**
 * Fetches a category from Discord using the given guild.
 * @param {Guild} guild The guild that the category belongs to.
 * @param {string} categoryID The ID of the category to fetch.
 * @returns {Promise<CategoryChannel>} A Promise that resolves with the CategoryChannel object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchCategory = async (guild, categoryID) => {
	const channel = await fetchChannel(guild, categoryID);

	if (!channel)
		throw new Error(`fetchCategory: channel is null, got ${channel}`);

	if (channel.type !== ChannelType.GuildCategory)
		throw new Error(`fetchCategory: channel is not a category, got ${channel}`);

	return channel;
}

/**
 * Gets the category channel of the interaction.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose category channel is to be retrieved.
 * @returns {CategoryChannel} The parent category channel of the interaction's channel, or null if there is no parent.
 */
const getCategoryOfInteraction = (interaction) => {
	if (!interaction.channel)
		throw new Error(`getCategoryOfInteraction: The channel of the interaction does not exist, got ${interaction.channel}`);

	if (!("parent" in interaction.channel) || !interaction.channel.parent)
		throw new Error(`getCategoryOfInteraction: The parent of the interaction's channel does not exist`);

	if (interaction.channel.parent.type !== ChannelType.GuildCategory)
		throw new Error(`getCategoryOfInteraction: The parent of the interaction's channel is not a category`);

	return interaction.channel.parent;
}

/**
 * Fetches a TextChannel from Discord using the given guild.
 * @param {Guild} guild The guild that the channel belongs to.
 * @param {string} channelID The ID of the channel to fetch.
 * @returns {Promise<TextChannel>} A Promise that resolves with the TextChannel object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
const fetchTextChannel = async (guild, channelID) => {
	const channel = await fetchChannel(guild, channelID);

	if (!(channel instanceof TextChannel))
		throw new Error(`fetchTextChannel: channel is not an instance of TextChannel, got ${channel}`);

	return channel;
}

/**
 * Gets the text channel of the interaction.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose text channel is to be retrieved.
 * @returns {TextChannel} The text channel of the interaction.
 * @throws {Error} If the client is not setup or not ready, or if the interaction does not have a channel, or if the channel of the interaction is not a text channel.
 */
const getTextChannelOfInteraction = (interaction) => {
	if (!interaction.channel)
		throw new Error(`getTextChannelOfInteraction: The channel of the interaction does not exist, got ${interaction.channel}`);

	if (interaction.channel.type !== ChannelType.GuildText)
		throw new Error(`getTextChannelOfInteraction: The channel of the interaction is not a text channel, got ${interaction.channel}`);

	return interaction.channel;
}

/**
 * Fetches a message from Discord using the given channel.
 * @param {TextChannel} channel The channel that the message belongs to.
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
	const role = await guild.roles.fetch(roleID);

	if (!role)
		throw new Error(`fetchRole: role is null, got ${role}`);

	return role;
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
	const role = rolesInGuild.find((role) => role.name === roleName);

	if (!role)
		throw new Error(`fetchRoleByName: Could not find role with name ${roleName}, got ${role}`);

	return role;
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

	const channels = allChannelsInGuild.filter((channel) => {
		if (channel === null)
			return false;

		return channel.parentId === categoryID
	});

	// @ts-ignore
	return discordCollectionToArray(channels);
}

/**
 * Fetches all the text channels in a category.
 * @param {Guild} guild The guild whose category you want to fetch the text channels of.
 * @param {string} categoryID The ID of the category whose text channels you want to fetch.
 * @returns {Promise<TextChannel[]>} A Promise that resolves with an array of the text channels in the category.
 */
const fetchTextChannelsInCategory = async (guild, categoryID) => {
	const allChannelsInGuild = await guild.channels.fetch();

	// @ts-ignore
	return Array.from(
		allChannelsInGuild.filter((channel) =>
			// @ts-ignore
			channel.parentId === categoryID &&
			// @ts-ignore
			channel.type === ChannelType.GuildText &&
			channel instanceof TextChannel
		).values()
	);
}

/**
 * Fetches the Rapid Discord Mafia guild.
 * @returns {Promise<Guild>} A Promise that resolves with the Rapid Discord Mafia guild.
 */
const fetchRDMGuild = async () => {
	return await fetchGuild(ids.servers.rapid_discord_mafia);
}

/**
 * Resolves a parameter name given either a string or a Parameter object.
 * @param {string | Parameter} parameter - The parameter to resolve the name of.
 * @returns {string} The resolved name of the parameter.
 */
const resolveParameterName = (parameter) => {
	return typeof parameter === "string"
		? parameter
		: parameter.name;
}

/**
 * Gets a number parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the number parameter or the parameter itself
 * @returns {number | null} The value of the number parameter
 */
const getNumberParamValue = (interaction, nameOrParameter) => {
	let name = resolveParameterName(nameOrParameter);
	return interaction.options.getNumber(name);
}

/**
 * Gets a number parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the number parameter or the parameter itself
 * @returns {number} The value of the number parameter
 * @throws {Error} If the parameter is not provided
 */
const getRequiredNumberParam = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const value = getNumberParamValue(interaction, nameOrParameter);
	if (value === null || value === undefined)
		throw new Error(`getRequiredNumberParamValue: ${name} is required`);
	return value;
}

/**
 * Gets an integer parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the integer parameter or the parameter itself
 * @returns {number | null} The value of the integer parameter
 */
const getIntegerParamValue = (interaction, nameOrParameter) => {
	let name = resolveParameterName(nameOrParameter);
	return interaction.options.getInteger(name);
}

/**
 * Gets an integer parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the integer parameter or the parameter itself
 * @returns {number} The value of the integer parameter
 * @throws {Error} If the parameter is not provided
 */
const getRequiredIntegerParam = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const value = getIntegerParamValue(interaction, nameOrParameter);
	if (value === null || value === undefined)
		throw new Error(`getRequiredIntegerParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a string parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the string parameter or the parameter itself
 * @returns {string | null} The value of the string parameter
 */
const getStringParamValue = (interaction, nameOrParameter) => {
	let name = resolveParameterName(nameOrParameter);
	return interaction.options.getString(name);
}

/**
 * Gets a string parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the string parameter or the parameter itself
 * @returns {string} The value of the string parameter
 * @throws {Error} If the parameter is not provided
 */
const getRequiredStringParam = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const value = getStringParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredStringParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a user parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the user parameter or the parameter itself
 * @returns {User | null} The value of the user parameter
 */
const getUserParamValue = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	return interaction.options.getUser(name);
}

/**
 * Gets a user parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the user parameter or the parameter itself
 * @returns {User} The value of the user parameter
 * @throws {Error} If the parameter is not provided
 */
const getRequiredUserParam = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const value = getUserParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredUserParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a channel parameter value of a slash command by name.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the channel parameter
 * @returns {import("discord.js").TextBasedChannel | undefined} The value of the channel parameter. If the parameter is not provided, or if the channel is not a valid channel, then null is returned.
 */
const getChannelParamValue = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const channel = interaction.options.getChannel(name);

  if (
		channel && 'send' in channel &&
		typeof channel.send === 'function'
	) {
    return channel;
  }

  return undefined;
}

/**
 * Gets a channel parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | Parameter} nameOrParameter - The name of the channel parameter
 * @returns {import("discord.js").TextBasedChannel} The value of the channel parameter
 * @throws {Error} If the parameter is not provided
 */
const getRequiredChannelParam = (interaction, nameOrParameter) => {
	const name = resolveParameterName(nameOrParameter);
	const value = getChannelParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredChannelParamValue: ${name} is required`);
	return value;
}

/**
 * Retrieves the subcommand or subcommand group used in a slash command interaction.
 * @param {ChatInputCommandInteraction} interaction - The interaction object from which to get the subcommand.
 * @returns {string} The name of the subcommand or subcommand group used.
 * @throws {Error} If neither a subcommand nor a subcommand group is provided.
 */
const getSubcommandUsed = (interaction) => {
	const subcommand = interaction.options.getSubcommandGroup() || interaction.options.getSubcommand();

	if (subcommand === null || subcommand === undefined)
		throw new Error("getSubcommandUsed: subcommand is required");

	return subcommand;
}

/**
 * Gets the everyone role of a given guild.
 * @param {Guild} guild The guild whose everyone role you want to fetch.
 * @returns {Role} The everyone role of the guild.
 */
const getEveryoneRole = (guild) => guild.roles.everyone;

/**
 * Retrieves the guild member object from a slash command interaction.
 * @param {ChatInputCommandInteraction} interaction - The interaction object from which to get the guild member.
 * @returns {GuildMember} The guild member who initiated the interaction.
 * @throws {Error} If the member object is not an instance of GuildMember.
 */

const getMemberOfInteraction = (interaction) => {
	if (!(interaction.member instanceof GuildMember))
		throw new Error("Guild member object must be an instance of GuildMember");

	return interaction.member
};

/**
 * Gets the nickname of the user who invoked a slash command.
 * @param {ChatInputCommandInteraction} interaction The interaction object of the slash command.
 * @returns {string} A Promise that resolves with the nickname of the user who invoked the slash command.
 */
const getNicknameOfInteractionUser = (interaction) => {
	const member = getMemberOfInteraction(interaction);
	// @ts-ignore
	return member.nickname;
}

/**
 * Fetches all messages in a channel
 * @param {import("discord.js").Channel} channel The channel whose messages you want to fetch
 * @returns {Promise<Message[]>} A Promise that resolves with an array of all messages in the channel
 */
const fetchMessagesInChannel = async (channel) => {
  if (!channel || !(channel instanceof TextChannel)) {
		throw new InvalidArgumentError("Channel is required and must be an instance of TextChannel");
  }

  const allMessages = [];
  let oldestMessageID = undefined;
	let keepFetching = true;

  while (keepFetching) {
		/**
		 * @type {import("discord.js").Collection<string, Message>}
		 */
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

/**
 * Fetches the voice channel that a guild member is currently in.
 * @param {GuildMember | import("discord.js").APIInteractionGuildMember} guildMember The guild member whose voice channel you want to fetch.
 * @returns {import("discord.js").VoiceBasedChannel | null} The VoiceChannel object the member is in, or null if the member is not in a voice channel or if an error occurs.
 */
const fetchVoiceChannelMemberIsIn = (guildMember) => {
	if (!(guildMember instanceof GuildMember)) {
		return null;
	}

	return guildMember.voice.channel
}


/**
 * Gets the voice channel that the user who invoked the interaction is currently in.
 * @param {ChatInputCommandInteraction} interaction The interaction object of the slash command.
 * @returns {import("discord.js").VoiceBasedChannel | null} The VoiceChannel object of the channel the user is in, or null if the user is not in a voice channel.
 * @throws {Error} If the member object is not an instance of GuildMember.
 */
const getVoiceChannelOfInteraction = (interaction) => {
	return fetchVoiceChannelMemberIsIn(
		getMemberOfInteraction(interaction)
	);
}

/**
 * Attempts to fetch a user by username.
 * - Checks cache
 * - Checks all guild members (if available)
 * - Optionally fetches uncached members from Discord API
 * @param {string} username The username or tag (e.g. "SomeUser" or "SomeUser#1234")
 * @returns {Promise<User|null>} The User object or null if not found
 */
async function fetchUserByUsername(username) {
	assertClientSetup();
	const client = global.client;
  let user = client.users.cache.find(
    user => user.username === username || user.tag === username
  );
  if (user) return user;

  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.find(
      m => m.user.username === username || m.user.tag === username
    );
    if (member) return member.user;
  }

  for (const guild of client.guilds.cache.values()) {
    try {
      const fetched = await guild.members.fetch({ query: username, limit: 1 });
      if (fetched.size > 0) {
				const member = fetched.first();
				if (member) return member.user;
      }
    }
		catch (err) {
			// Do nothing
    }
  }

  return null;
}


module.exports = { assertClientSetup, fetchGuild, getGuildOfInteraction, fetchChannel, fetchCategory, getCategoryOfInteraction, fetchTextChannel, getTextChannelOfInteraction, fetchChannelsOfGuild, fetchMessage, fetchCategoriesOfGuild, fetchChannelsInCategory, fetchRDMGuild, fetchGuildMember, fetchAllGuildMembers, fetchUser, fetchRole, fetchRoleByName, getStringParamValue, getUserParamValue, getEveryoneRole, getNumberParamValue, getRequiredNumberParam, getIntegerParamValue, getNicknameOfInteractionUser, fetchMessagesInChannel, getChannelParamValue, getRequiredIntegerParam, getRequiredStringParam, getRequiredUserParam, getRequiredChannelParam, getSubcommandUsed, fetchVoiceChannelMemberIsIn, fetchTextChannelsInCategory, getVoiceChannelOfInteraction, getMemberOfInteraction, fetchUserByUsername };