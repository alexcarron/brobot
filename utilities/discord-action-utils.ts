import {
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	Guild,
	GuildMember,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	TextChannel,
	ChannelType,
	PermissionFlagsBits,
	CategoryChannel,
	ChatInputCommandInteraction,
	Message,
	GuildChannel,
	ButtonInteraction,
	InteractionResponse,
	CommandInteraction,
	MessageComponentInteraction,
	ModalSubmitInteraction,
	Attachment,
	MessageFlags,
	BitField, OverwriteData,
	// explicit types used below
	MessageCreateOptions,
	MessageEditOptions,
	InteractionReplyOptions, CategoryChannelResolvable,
	OverwriteResolvable,
	GuildChannelCreateOptions,
	PermissionOverwriteOptions,
	User,
	OverwriteType
} from 'discord.js';

import { Role } from '../services/rapid-discord-mafia/role';
import {
	fetchChannel,
	fetchChannelsInCategory,
	getEveryoneRole,
	fetchAllMessagesInChannel,
	fetchCategory,
	fetchUser
} from './discord-fetch-utils';
import {
	incrementEndNumber,
	joinLines,
	wrapTextByLineWidth
} from './string-manipulation-utils';
import {
	logInfo,
	logError,
	logWarning
} from './logging-utils';
import { getShuffledArray } from './data-structure-utils';
import { InvalidArgumentTypeError } from './error-utils';
import { ids } from '../bot-config/discord-ids';
import { isArrayOfOneObject, isBoolean, isUndefined } from './types/type-guards';

const MAX_DM_MESSAGE_LENGTH = 4000;
const MAX_CHANNEL_MESSAGE_LENGTH = 2000;

/**
 * Prompt the user to confirm or cancel an action by adding buttons to the deffered reply to an existing command interaction.
 * @param options - Options for the confirmation prompt.
 * @param options.interaction - The command interaction whose reply is being updated.
 * @param options.message - The message to include in the confirmation prompt.
 * @param options.confirmText - The label for the confirm button.
 * @param options.cancelText - The label for the cancel button.
 * @param options.confirmUpdateText - The message to send if the user confirms.
 * @param options.cancelUpdateText - The message to send if the user cancels.
 * @returns `true` if the user confirms, `false` if the user cancels.
 */
export async function confirmInteractionWithButtons({
	interaction,
	message,
	confirmText,
	cancelText,
	confirmUpdateText,
	cancelUpdateText,
}: {
	interaction: ChatInputCommandInteraction;
	message: string;
	confirmText: string;
	cancelText: string;
	confirmUpdateText: string;
	cancelUpdateText: string;
}): Promise<boolean> {
	const confirmButton = new ButtonBuilder()
		.setCustomId('confirm')
		.setLabel(confirmText)
		.setStyle(ButtonStyle.Success);

	const cancelButton = new ButtonBuilder()
		.setCustomId('cancel')
		.setLabel(cancelText)
		.setStyle(ButtonStyle.Secondary);

	const actionRow = new ActionRowBuilder()
		.addComponents(cancelButton, confirmButton);

	const confirmationMessage = await interaction.editReply({
		content: message,
		// @ts-ignore
		components: [actionRow],
	});

	/**
	 * Filters the interaction to only allow the user who triggered the interaction
	 * @param otherInteraction - The interaction to filter
	 * @returns Whether the interaction is from the same user
	 */
	const filter = (otherInteraction: MessageComponentInteraction): boolean =>
		otherInteraction.user.id === interaction.user.id;

	try {
		const confirmation = await confirmationMessage.awaitMessageComponent({
			filter,
			time: 120_000,
		});

		if (confirmation.customId === 'confirm') {
			await confirmation.update({
				content: `${confirmUpdateText}`,
				components: [],
			});
			return true;
		}
		else if (confirmation.customId === 'cancel') {
			await confirmation.update({
				content: `${cancelUpdateText}`,
				components: [],
			});
			return false;
		}
	}
	catch {
		await interaction.editReply({
			content: `Response not recieved in time`,
			components: [],
		});
	}
	return false;
}

/**
 * Adds a role to a guild member.
 * @param guildMember The guild member we want to add the role to.
 * @param role The role we want to add to the guild member.
 * @returns A promise that resolves when the role is added.
 */
export async function addRoleToMember(guildMember: GuildMember, role: import('discord.js').RoleResolvable): Promise<void> {
	await guildMember.roles.add(role);
}

/**
 * Removes a role from a guild member.
 * @param guildMember The guild member we want to remove the role from.
 * @param role The role or role ID we want to remove from the guild member.
 * @returns A promise that resolves when the role is removed.
 */
export async function removeRoleFromMember(guildMember: GuildMember, role: import('discord.js').RoleResolvable): Promise<void> {
	// If member does not have role, do nothing
	if (!guildMember.roles.cache.some((memberRole) => memberRole.id === role)) return;
	
	await guildMember.roles.remove(role);
}

/**
 * Removes all roles from a guild member.
 * @param guildMember The guild member we want to remove all roles from.
 * @returns A promise that resolves when all roles have been removed.
 */
export async function removeAllRolesFromMember(guildMember: GuildMember): Promise<void> {
	for (const roleId of guildMember.roles.cache.keys()) {
		if (roleId === guildMember.guild.id) continue;
		await removeRoleFromMember(guildMember, roleId);
	}
}

/**
 * Defers an interaction, editing or replying to the interaction with the provided message content.
 * @param interaction The interaction to defer.
 * @param [messageContent] The content of the message to edit or reply with.
 * @returns A promise that resolves when the interaction has been deferred or replied to.
 */
export async function deferInteraction(
	interaction: ChatInputCommandInteraction | CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction,
	messageContent = "Running command..."
): Promise<void> {
  if (!interaction || typeof interaction.reply !== 'function') return;

  const replyContent = { content: messageContent };

  try {
		// Already replied, just follow up
    if (interaction.replied) {
      await interaction.followUp(replyContent);
    }
		// Deferred but no reply content yet, edit reply
		else if (interaction.deferred) {
      await interaction.editReply(replyContent);
    }
		// Not replied or deferred yet — try to defer ephemerally first
		else {
      try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
			catch {
        // Failed to defer ephemerally, try to defer normally
        try {
          await interaction.deferReply();
        }
				catch {
          // Both defer attempts failed — try immediate reply as fallback
          try {
            await interaction.reply({
							...replyContent,
							flags: MessageFlags.Ephemeral
						});
          }
					catch {
            // If ephemeral reply failed, try non-ephemeral reply as last resort
            try {
              await interaction.reply(replyContent);
            }
						catch {
              logWarning("Interaction already expired: unable to reply/follow-up");
            }
          }
        }
      }
    }
  } catch (error) {
		if (error instanceof Error === false)
			throw error;

    if (
			'code' in error &&
			error.code === 10062
		) {
      logWarning("Interaction already expired: unable to reply/follow-up");
    }
		else {
      logError("Error responding to interaction:", error);
    }
  }
}

/**
 * Replies to an interaction with the provided message content or edits the reply with the provided message content if the interaction has already been replied to.
 * @param interaction - The interaction to reply to.
 * @param lines - The content of the message to reply with.
 * @returns A promise that resolves when the message is sent.
 */
export async function replyToInteraction(interaction: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction, ...lines: any[]): Promise<InteractionResponse | Message<boolean> | Message> {
	/**
	 * @type {import('discord.js').InteractionReplyOptions}
	 */
	let interactionReplyOptions;
	if (isArrayOfOneObject(lines)) {
		interactionReplyOptions = toInteractionReplyFromMessageCreateOptions(lines[0]);
	}
	else {
		interactionReplyOptions = { content: joinLines(...lines) };
	}

	try {
		if (
			interaction &&
			"reply" in interaction &&
			typeof interaction.reply === "function"
		) {
			return await interaction.reply({
				...interactionReplyOptions,
				flags: MessageFlags.Ephemeral,
			});
		}

		throw new InvalidArgumentTypeError({
			functionName: "replyToInteraction",
			argumentName: "interaction",
			expectedType: "ReplyableInteraction",
			actualValue: interaction
		});
	}
	catch {
		return editReplyToInteraction(interaction, interactionReplyOptions);
	}
}

/**
 * Edits the reply to an interaction with new message contents.
 * @param interaction - The interaction whose reply is being updated.
 * @param lines - The content of the message to reply with.
 * @returns A promise that resolves when the message is edited.
 */
export async function editReplyToInteraction(interaction: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction, ...lines: any[]): Promise<Message<boolean>> {
	let newMessageContents;
	if (isArrayOfOneObject(lines)) {
		newMessageContents = lines[0];
	}
	else {
		newMessageContents = joinLines(...lines);
	}

	if (interaction && (interaction.replied || interaction.deferred)) {
		if (typeof newMessageContents === "string")
			newMessageContents = {
				content: newMessageContents,
				components: [],
			};

		return await interaction.editReply(newMessageContents);
	}

	throw new Error('Interaction is not deferred or replied');
}

export async function addReplyToInteraction(interaction: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction, ...lines: any[]) {
	let interactionReplyOptions: InteractionReplyOptions;
	if (isArrayOfOneObject(lines)) {
		interactionReplyOptions = toInteractionReplyFromMessageCreateOptions(lines[0]);
	}
	else {
		interactionReplyOptions = { content: joinLines(...lines) };
	}

	try {
		if (
			interaction &&
			"reply" in interaction &&
			typeof interaction.reply === "function" &&
			!interaction.replied && 
			!interaction.deferred
		) {
			return await interaction.reply({
				...interactionReplyOptions,
				flags: MessageFlags.Ephemeral,
			});
		}

		throw new InvalidArgumentTypeError({
			functionName: "replyToInteraction",
			argumentName: "interaction",
			expectedType: "ReplyableInteraction",
			actualValue: interaction
		});
	}
	catch {
		return interaction.followUp({
			...interactionReplyOptions,
			flags: MessageFlags.Ephemeral,
		});
	}
}

/**
 * Shows a modal to a user, prompting them for text input. Returns the text entered by the user.
 * @param options - Options for showing the modal.
 * @param options.interaction The interaction that triggered the modal.
 * @param options.modalTitle The title of the modal.
 * @param options.placeholder The placeholder text for the text input field in the modal.
 * @returns The text entered by the user, or undefined on error.
 */
export async function getInputFromCreatedTextModal({
	interaction,
	modalTitle="",
	placeholder="",
}: {
	interaction: ChatInputCommandInteraction | ButtonInteraction;
	modalTitle?: string;
	placeholder?: string;
}): Promise<string | undefined> {
	if (!interaction) throw new Error("Interaction is required");

	const modalID = `${modalTitle.replace(" ", "")}Modal`;
	const textInputID = `${modalTitle.replace(" ", "")}TextInput`;

	// Create the modal
	const modal = new ModalBuilder()
		.setCustomId(modalID)
		.setTitle(modalTitle);

	// Create the text input field
	const textInput = new TextInputBuilder()
		.setCustomId(textInputID)
		.setLabel(modalTitle)
		.setMaxLength(1_900)
		.setPlaceholder(placeholder)
		.setValue(placeholder)
		.setRequired(false)
		.setStyle(TextInputStyle.Paragraph);

	// Create the action row with the text input field
	const textInputActionRow = new ActionRowBuilder().addComponents(textInput);

	// Add the action row to the modal
	// @ts-ignore
	modal.addComponents(textInputActionRow);

	let submittedInteraction;
	try {
		await interaction.showModal(modal);

		// Wait for user to submit the modal
		submittedInteraction = await interaction.awaitModalSubmit({
			filter: (interaction) => interaction.customId === modalID,
			time: 1_000_000,
		});
	}
	catch (error) {
		if (error instanceof Error === false)
			throw error;

		logError(`Error in getInputFromCreatedTextModal`, error);
		return undefined;
	}

	// Get the data entered by the user
	const textEntered = submittedInteraction.fields.getTextInputValue(textInputID);

	// Acknowledge the interaction but don't update the message
	await submittedInteraction.deferUpdate();
	// await submittedInteraction.deferReply({ flags: MessageFlags.Ephemeral });

	return textEntered;
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

	// @ts-ignore
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
				// @ts-ignore
				parentCategory = newCategory;
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

	// @ts-ignore
	const channel = await guild.channels.create(options);

	// @ts-ignore
	return channel;
}

/**
 * Creates a category in a guild.
 * @param options - Options for creating the category.
 * @param options.guild - The guild in which the category is to be created.
 * @param options.name - The name of the category.
 * @param [options.permissions] - Permission overwrites for the category.
 * @returns The created category.
 */
export async function createCategory({guild, name, permissions = []}: {guild: Guild; name: string; permissions?: readonly import('discord.js').OverwriteResolvable[]}): Promise<CategoryChannel> {
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

/**
 * Creates a permission overwrite object for a Discord channel.
 * @param options - Options for creating the permission overwrite.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are being set.
 * @param [options.allowedPermissions] - An array of permissions that are allowed for the user or role.
 * @param [options.deniedPermissions] - An array of permissions that are denied for the user or role.
 * @returns The permission overwrite object.
 */
export function createPermission({userOrRoleID, allowedPermissions, deniedPermissions}: {userOrRoleID: string; allowedPermissions?: import('discord.js').PermissionResolvable[]; deniedPermissions?: import('discord.js').PermissionResolvable[]}): OverwriteData {
	if (!userOrRoleID)
		throw new Error("User or role ID is required");

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	const overwrite: OverwriteData = {
		id: userOrRoleID,
	};

	if (allowedPermissions)
		overwrite.allow = allowedPermissions;

	if (deniedPermissions)
		overwrite.deny = deniedPermissions;

	return overwrite;
}

/**
 * Creates a permission overwrite that denies everyone the ability to view a channel.
 * @param guild - The guild in which the permission overwrite is to be created.
 * @returns The permission overwrite object.
 */
export function createEveryoneDenyViewPermission(guild: Guild): OverwriteData {
	return createPermission({
		// guild.roles.everyone is a Role object — use its id
		userOrRoleID: (guild.roles && 'everyone' in guild.roles) ? (guild.roles.everyone as any).id : guild.id,
		deniedPermissions: [PermissionFlagsBits.ViewChannel],
	});
}

/**
 * Adds permission overwrites to a Discord channel for a specific user or role.
 * @param options - Options for setting permissions.
 * @param options.channel - The channel to which the permissions are applied.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are set.
 * @param [options.allowedPermissions] - An array of permissions to allow.
 * @param [options.deniedPermissions] - An array of permissions to deny.
 * @throws {Error} If neither allowedPermissions nor deniedPermissions are provided, or if they are not arrays.
 * @returns A promise that resolves when the permissions have been set.
 */
export async function addPermissionToChannel(
	{channel, userOrRoleID, allowedPermissions, deniedPermissions}: {
		channel: TextChannel;
		userOrRoleID: string;
		allowedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		deniedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[]
	}
): Promise<void> {
	const permissions: PermissionOverwriteOptions = {}

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	if (allowedPermissions) {
		for (const permission of allowedPermissions) {
			// @ts-ignore
			permissions[permission] = true;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
			// @ts-ignore
			permissions[permission] = false;
		}
	}

	await channel.permissionOverwrites.create(
		userOrRoleID,
		permissions,
	);
}

/**
 * Removes all permission overwrites from a Discord channel for a specific user or role.
 * @param options - Options for removing permissions.
 * @param options.channel - The channel from which the permissions are removed.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are removed.
 * @returns A promise that resolves when the permissions have been removed.
 */
export async function removePermissionFromChannel({channel, userOrRoleID}: {channel: TextChannel; userOrRoleID: string}): Promise<void> {
	await channel.permissionOverwrites.delete(userOrRoleID);
}

/**
 * Updates the permission overwrites for a Discord channel for a specific user or role.
 * @param options - Options for updating the permissions.
 * @param options.channel - The channel for which the permissions are being updated.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are being updated.
 * @param [options.allowedPermissions] - An array of permissions that should be allowed for the user or role.
 * @param [options.unsetPermissions] - An array of permissions that should be unset for the user or role.
 * @param [options.deniedPermissions] - An array of permissions that should be denied for the user or role.
 * @throws Will throw an error if none of allowedPermissions, deniedPermissions, or unsetPermissions are provided, or if any of them are not arrays.
 */
export async function changePermissionOnChannel(
	{channel, userOrRoleID, allowedPermissions, unsetPermissions, deniedPermissions}: {
		channel: TextChannel;
		userOrRoleID: string;
		allowedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		unsetPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		deniedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[]
	}
): Promise<void> {
	/**
	 * @type {import('discord.js').PermissionOverwriteOptions}
	 */
	const permissions = {}

	if (!allowedPermissions && !deniedPermissions && !unsetPermissions)
		throw new Error("allowedPermissions, deniedPermissions, or unsetPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	if (unsetPermissions && !Array.isArray(unsetPermissions))
		throw new Error("Unset permissions must be an array");

	if (allowedPermissions) {
		for (const permission of allowedPermissions) {
			// @ts-ignore
			permissions[permission] = true;
		}
	}

	if (unsetPermissions) {
		for (const permission of unsetPermissions) {
			// @ts-ignore
			permissions[permission] = null;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
			// @ts-ignore
			permissions[permission] = false;
		}
	}

	await channel.permissionOverwrites.edit(
		userOrRoleID,
		permissions,
	);
}

/**
 * Opens a Discord channel to allow everyone to view it but not send messages.
 * @param channel - The channel to be opened for viewing.
 */
export async function openChannel(channel: TextChannel): Promise<void> {
	const everyoneRole = getEveryoneRole(channel.guild);

	await changePermissionOnChannel({
		channel: channel,
		userOrRoleID: everyoneRole.id,
		// @ts-ignore
		unsetPermissions: [PermissionFlagsBits.ViewChannel],
		// @ts-ignore
		deniedPermissions: [PermissionFlagsBits.SendMessages],
	});
}

/**
 * Removes all permission overwrites from a Discord channel.
 * @param {TextChannel} channel - The channel from which all permission overwrites are to be removed.
 * @returns A promise that resolves when all permission overwrites have been removed.
 */
export async function removeAllPermissionsFromChannel(channel: TextChannel): Promise<void> {
	await channel.permissionOverwrites.set([]);
}

/**
 * Closes a Discord channel to deny everyone the ability to view it.
 * @param channel - The channel to be closed from viewing.
 */
export async function closeChannel(channel: TextChannel): Promise<void> {
	const everyoneRole = getEveryoneRole(channel.guild);

  const existingOverwrites = channel.permissionOverwrites.cache.map(overwrite => ({
    id: overwrite.id,
    type: overwrite.type,
    allow: overwrite.allow.bitfield,
    deny: overwrite.deny.bitfield,
  }));

  const hasEveryone = existingOverwrites.some(overwrite => overwrite.id === everyoneRole.id);

  const newOverwrites = hasEveryone
    ? existingOverwrites.map(overwrite =>
        overwrite.id === everyoneRole.id
          ? { ...overwrite, deny: BigInt(overwrite.deny) | PermissionFlagsBits.ViewChannel }
          : overwrite
      )
    : [
        ...existingOverwrites,
        {
          id: everyoneRole,
          type: OverwriteType.Role,
          allow: BigInt(0),
          deny: PermissionFlagsBits.ViewChannel,
        },
      ];

  await channel.edit({
    permissionOverwrites: newOverwrites,
  });
}


/**
 * Checks if a guild member has a given role.
 * @param {GuildMember} guildMember - The guild member to check.
 * @param {Role | string} roleID - The role to check for.
 * @param {boolean} useCache - Whether to use the guild member's cache.
 * @returns {Promise<boolean>} True if the guild member has the given role, false otherwise.
 */
export async function memberHasRole(guildMember: GuildMember, roleID: Role | string, useCache = false): Promise<boolean> {
	if (!(guildMember instanceof GuildMember))
		throw new Error("Guild member object must be an instance of GuildMember");

	if (roleID instanceof Role)
		// @ts-ignore
		roleID = roleID.id;

	if (typeof roleID !== "string")
		throw new Error("Role ID must be a string");

	if (!useCache)
		await guildMember.fetch();

	return guildMember.roles.cache.some(role => role.id === roleID);
}

/**
 * Renames a Discord channel.
 * @param {TextChannel} channel - The channel to rename.
 * @param {string} newName - The new name for the channel.
 * @returns {Promise<void>} A promise that resolves when the channel has been renamed.
 */
export async function renameChannel(channel: TextChannel, newName: string): Promise<void> {
	await channel.setName(newName);
}

/**
 * Sets the nickname of a guild member.
 * @param {GuildMember} guildMember - The guild member whose nickname is to be set.
 * @param {string} newNickname - The new nickname for the guild member.
 * @returns {Promise<void>} A promise that resolves when the nickname has been set.
 */
export async function setNicknameOfMember(guildMember: GuildMember, newNickname: string): Promise<void> {
	await guildMember.setNickname(newNickname);
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
		// @ts-ignore
		category = await fetchChannel(guild, category);
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

export function addButtonToMessageContents({
	contents,
	buttonID,
	buttonLabel,
	buttonStyle,
}: {
	contents: InteractionReplyOptions;
	buttonID: string;
	buttonLabel: string;
	buttonStyle?: ButtonStyle;
}): InteractionReplyOptions;

export function addButtonToMessageContents({
	contents,
	buttonID,
	buttonLabel,
	buttonStyle,
}: {
	contents: MessageCreateOptions;
	buttonID: string;
	buttonLabel: string;
	buttonStyle?: ButtonStyle;
}): MessageCreateOptions;

export function addButtonToMessageContents({
	contents,
	buttonID,
	buttonLabel,
	buttonStyle,
}: {
	contents: string;
	buttonID: string;
	buttonLabel: string;
	buttonStyle?: ButtonStyle;
}): MessageCreateOptions | InteractionReplyOptions;

/**
 * Adds a button to the components array of an object representing the contents of a Discord message.
 * @param options - Options for adding the button.
 * @param options.contents - The contents of the message. Can be a string or an object with a "content" property.
 * @param options.buttonID - The custom ID of the button.
 * @param options.buttonLabel - The label of the button.
 * @param [options.buttonStyle] - The style of the button. Optional, defaults to ButtonStyle.Primary.
 * @returns The modified contents object with the button added.
 */
export function addButtonToMessageContents({
	contents,
	buttonID,
	buttonLabel,
	buttonStyle = ButtonStyle.Primary,
}: {
	contents: string | MessageCreateOptions | InteractionReplyOptions;
	buttonID: string;
	buttonLabel: string;
	buttonStyle?: ButtonStyle;
}): MessageCreateOptions | InteractionReplyOptions {
	if (typeof contents === "string")
		contents = {content: contents};

	if (typeof contents !== "object")
		throw new Error("Contents must be a string or an object");

	if (typeof buttonID !== "string")
		throw new Error("Button ID must be a string");

	if (typeof buttonLabel !== "string")
		throw new Error("Button label must be a string");

	if (!Object.values(ButtonStyle).includes(buttonStyle))
		throw new Error("Button style must be a valid ButtonStyle");

	const button = new ButtonBuilder()
		.setCustomId(buttonID)
		.setLabel(buttonLabel)
		.setStyle(buttonStyle);

	const actionRow = new ActionRowBuilder()
		.addComponents(button);

	if ('components' in contents) {
		contents.components = contents.components || [];
		// @ts-ignore
		contents.components.push(actionRow);
	}
	else {
		// @ts-ignore
		contents.components = [actionRow];
	}

	return contents;
}

/**
 * Waits for a user to click on a button on a message with a component.
 * @param messsageWithButton - The message with the button.
 * @param buttonID - The custom ID of the button.
 * @param onButtonPressed - The function to run when the button is pressed.
 * @returns A promise that resolves when the user has clicked a button.
 */
export async function waitForButtonPressThen(messsageWithButton: Message, buttonID: string, onButtonPressed: (buttonInteraction: ButtonInteraction) => Promise<void>): Promise<void> {
	if (!(messsageWithButton instanceof Message))
		throw new Error("Message must be an instance of Message");

	if (typeof buttonID !== "string")
		throw new Error("Button ID must be a string");

	if (typeof onButtonPressed !== "function")
		throw new Error("onButtonPressed must be a function");

	try {
		const buttonInteraction = await messsageWithButton.awaitMessageComponent({ time: 10_000_000 });

		if (buttonInteraction.customId === buttonID) {
			// @ts-ignore
			await onButtonPressed(buttonInteraction);
		}
	}
	catch (error) {
		if (error instanceof Error === false)
			throw error;

		logError(
			`Error while waiting for user to click button with ID ${buttonID}`,
			error
		)
	}
}

/**
 * Converts a MessageCreateOptions object into a MessageEditOptions object.
 * @param createOptions - The object to convert.
 * @returns The converted object.
 */
export function toMessageEditFromCreateOptions(createOptions: MessageCreateOptions): MessageEditOptions {
	const editOptions: MessageEditOptions = {};

  if (createOptions.content !== undefined)
		editOptions.content = createOptions.content;

  if (createOptions.embeds)
		editOptions.embeds = createOptions.embeds;

  if (createOptions.allowedMentions)
		editOptions.allowedMentions = createOptions.allowedMentions;

  if (createOptions.components)
		editOptions.components = createOptions.components;

  if (createOptions.files) {
    editOptions.attachments = createOptions.files
			.filter(file =>
				file instanceof Attachment ||
				(
					typeof file === 'object' &&
					'id' in file
				)
			)
  }

  if ('allowedMentions' in createOptions)
		editOptions.allowedMentions = createOptions.allowedMentions;

  return editOptions;
}

/**
 * Converts a MessageCreateOptions object into an InteractionReplyOptions object.
 * @param createOptions - The object to convert.
 * @returns The converted object.
 */
export function toInteractionReplyFromMessageCreateOptions(createOptions: MessageCreateOptions): InteractionReplyOptions {
	const reply: InteractionReplyOptions = {} as InteractionReplyOptions;

  if ('content' in createOptions && createOptions.content !== undefined) {
    reply.content = createOptions.content;
  }

  if ('embeds' in createOptions && createOptions.embeds) {
    reply.embeds = createOptions.embeds;
  }

  if ('allowedMentions' in createOptions && createOptions.allowedMentions) {
    reply.allowedMentions = createOptions.allowedMentions;
  }

  if ('components' in createOptions && createOptions.components) {
    reply.components = createOptions.components;
  }

  if ('files' in createOptions && createOptions.files) {
    // InteractionReplyOptions uses the same "files" shape as BaseMessageOptions, so pass through
    reply.files = createOptions.files;
  }

  if ('poll' in createOptions && createOptions.poll) {
    reply.poll = createOptions.poll;
  }

  // Directly copy tts if present
  if ('tts' in createOptions && createOptions.tts !== undefined) {
    reply.tts = createOptions.tts;
  }

  // Normalize response flags:
  // - prefer explicit withResponse if given
  // - otherwise map deprecated fetchReply into withResponse
  if (
		'withResponse' in createOptions && (
			isUndefined(createOptions.withResponse) ||
			isBoolean(createOptions.withResponse)
		)
	) {
    reply.withResponse = createOptions.withResponse;
  }
	else if ('fetchReply' in createOptions && (
		isUndefined(createOptions.fetchReply) ||
		isBoolean(createOptions.fetchReply)
	)) {
    // fetchReply is deprecated -> withResponse
    reply.withResponse = createOptions.fetchReply;
  }

  // Handle flags and deprecated ephemeral boolean.
  // If createOptions.flags exists, pass-through and merge ephemeral bit if ephemeral === true.
  // Otherwise, if ephemeral === true, set flags to Ephemeral.
  const srcFlags = createOptions.flags;
  // @ts-ignore
  const ephemeralFlagRequested = !!createOptions.ephemeral;

  if (srcFlags !== undefined) {
    // If the caller supplied flags, preserve them. If they also set ephemeral boolean,
    // try to merge ephemeral into the supplied flags when possible.
    if (ephemeralFlagRequested) {
      try {
        // Use BitField to merge in a robust way if available
        // (the BitField constructor accepts BitFieldResolvable).
        const merged = new BitField(srcFlags);
        // @ts-ignore
        merged.add(MessageFlags.Ephemeral);
        // Keep the same type that InteractionReplyOptions accepts (BitFieldResolvable)
				// @ts-ignore
        reply.flags = merged.freeze();
      }
			catch {
        // If BitField is not usable for some reason, fall back to ORing numbers.
        // Attempt numeric resolution
        try {
          const resolved = BitField.resolve(srcFlags);
          // numeric OR with ephemeral
          // prefer bigint if resolved is bigint
          if (typeof resolved === 'bigint') {
						// @ts-ignore
            reply.flags = (
							resolved | BigInt(MessageFlags.Ephemeral)
						).toString();
          }
					else {
            reply.flags = (resolved | MessageFlags.Ephemeral);
          }
        }
				catch {
          // Last-resort: set flags to Ephemeral only (best-effort)
          reply.flags = MessageFlags.Ephemeral;
        }
      }
    }
		else {
      // No ephemeral requested, just pass through the provided flags
			// @ts-ignore
      reply.flags = srcFlags;
    }
  }
	else if (ephemeralFlagRequested) {
    // No flags given, but ephemeral boolean requested: set flags to Ephemeral
    reply.flags = MessageFlags.Ephemeral;
  }

  // Also preserve deprecated ephemeral boolean in the reply for compatibility.
  // Some consumers may still read `ephemeral` property on InteractionReplyOptions.
  // @ts-ignore
  if (createOptions.ephemeral !== undefined) {
    // @ts-ignore
    reply.ephemeral = Boolean(createOptions.ephemeral);
  }

  // @ts-ignore
  return reply;
}

/**
 * Deletes all messages in a channel.
 * @param channel - The channel to delete all messages from.
 * @returns A promise that resolves when all messages have been deleted.
 */
export async function deleteAllMessagesInChannel(channel: TextChannel): Promise<void> {
	const allMessagesInChannel = await fetchAllMessagesInChannel(channel);

	if (allMessagesInChannel.length >= 50)
		throw new Error(`Too risky to delete ${allMessagesInChannel.length} messages in channel #${channel.id}`);

	await Promise.all(allMessagesInChannel.map((message) => message.delete()));
}

/**
 * Deletes all messages in a channel and sends a new message.
 * @param channel - The channel to delete all messages from and send the new message in.
 * @param args - The message to send, either as a MessageCreateOptions object or as strings representing the content of the message.
 * @returns A promise that resolves with the message that was sent.
 */
export async function setNewMessageInChannel(
	channel: TextChannel, 
	...args:
		| [MessageCreateOptions]
		| (string | string[] | null | undefined)[]
): Promise<Message<boolean>> {
	await deleteAllMessagesInChannel(channel);

	const messageOptions = parseMessageArgs(args);
	return await channel.send(messageOptions) as Message<boolean>;
}

/**
 * Sets the exclusive message in the given channel to the given message.
 * - Clears all other messages in the channel.
 * - Sends the given message.
 * @param channel - The channel to set the message in.
 * @param message - The message to set.
 * @returns The message that was set.
 */
export async function setChannelMessage(channel: TextChannel, message: string | MessageCreateOptions): Promise<Message<boolean>> {
	if (typeof message === "string")
		message = {content: message};

	const allMessagesInChannel = await fetchAllMessagesInChannel(channel);

	const isTheSetMessage =
		allMessagesInChannel.length === 1 &&
		allMessagesInChannel[0].author.id === ids.users.BROBOT;

	if (isTheSetMessage) {
		const theSetMessage = allMessagesInChannel[0];
		const editMessageOptions = toMessageEditFromCreateOptions(message);
		return await theSetMessage.edit(editMessageOptions);
	}
	else {
		await deleteAllMessagesInChannel(channel);
		return await channel.send(message);
	}
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
 * Parses the given arguments into a MessageCreateOptions object.
 * If the arguments are an array of one object, it is expected to be a MessageCreateOptions object.
 * If the arguments are an array of strings, null, or undefined, it is interpreted as the content of a message.
 * @param args - The arguments to parse.
 * @returns A MessageCreateOptions object.
 */
function parseMessageArgs(
	args:
		| [MessageCreateOptions]
		| (string | string[] | null | undefined)[]
): MessageCreateOptions {
	let messageOptions: MessageCreateOptions;

	if (
		args.length === 1 &&
		typeof args[0] === "object" &&
		args[0] !== null &&
		!Array.isArray(args[0])
	) {
		messageOptions = args[0];
	}
	else {
		const textLines = args as (string | string[] | null | undefined)[];
		messageOptions = { content: joinLines(...textLines) };
	}

	return messageOptions;
}

/**
 * Splits a MessageCreateOptions object into multiple MessageCreateOptions objects if the content exceeds the maximum length.
 * @param messageOptions - The MessageCreateOptions object to split.
 * @param maxMessageLength - The maximum length of a message.
 * @returns An array of MessageCreateOptions objects.
 */
function chunkMessageOptions(
	messageOptions: MessageCreateOptions,
	maxMessageLength: number = MAX_CHANNEL_MESSAGE_LENGTH,
): MessageCreateOptions[] {
	const content = messageOptions.content ?? "";
	const chunks =
		typeof content === "string" && content.length > maxMessageLength
			? wrapTextByLineWidth(content, maxMessageLength)
			: [content];

	const messageCreateOptions: MessageCreateOptions[] =  [];

	for (const chunk of chunks) {
		messageCreateOptions.push({
			...messageOptions,
			content: chunk,
		});
	}

	return messageCreateOptions;
}

/**
 * Parses the given arguments into one or more MessageCreateOptions objects, splitting them into chunks if they exceed the maximum length.
 * @param maxMessageLength - The maximum length of a message. 
 * @param args - The arguments to parse.
 * @returns An array of MessageCreateOptions objects.
 */
function parseMessageArgsIntoChunks(
	maxMessageLength: number,
	args:
		| [MessageCreateOptions]
		| (string | string[] | null | undefined)[]
): MessageCreateOptions[] {
	const messageOptions = parseMessageArgs(args);
	return chunkMessageOptions(messageOptions, maxMessageLength);
}

export async function dmUser(
	userID: User["id"],
	options: MessageCreateOptions
): Promise<Message<boolean>[]>;

export async function dmUser(
	userID: User["id"],
	...lines: (string | string[] | null | undefined)[]
): Promise<Message<boolean>[]>;

/**
 * DMs a given user the given message or lines of text.
 * Splits messages that exceed Discord's maximum message length into multiple messages.
 * @param userID - The ID of the user to DM.
 * @param args - The message or lines of text to send. Can be a single MessageCreateOptions object or one-or-more strings (or arrays of strings).
 * @returns A promise that resolves with the message that was sent.
 */
export async function dmUser(
	userID: User["id"],
	...args:
		| [MessageCreateOptions]
		| (string | string[] | null | undefined)[]
): Promise<Message<boolean>[]> {
	const messageOptions = parseMessageArgsIntoChunks(MAX_DM_MESSAGE_LENGTH, args);
	const user = await fetchUser(userID);
	const sentMessages: Message<boolean>[] = [];

	for (const messageOption of messageOptions) {
		const sent = await user.send(messageOption);
		sentMessages.push(sent);
	}

	return sentMessages;
}

/**
 * Sends one or more messages to a channel.
 * Splits messages that exceed Discord's maximum message length into multiple messages.
 * @param channel - The channel to send the message in.
 * @param args - The message or lines of text to send. Can be a single MessageCreateOptions object or one-or-more strings (or arrays of strings).
 * @returns A promise that resolves with an array of the messages that were sent.
 */
export async function sendMessageInChannel(
	channel: TextChannel,
	...args:
		| [MessageCreateOptions]
		| (string | string[] | null | undefined)[]
): Promise<Message<boolean>[]> {
	const messageOptions = parseMessageArgsIntoChunks(MAX_CHANNEL_MESSAGE_LENGTH, args);
	const sentMessages: Message<boolean>[] = [];

	for (const messageOption of messageOptions) {
		const sent = await channel.send(messageOption);
		sentMessages.push(sent);
	}

	return sentMessages;
}