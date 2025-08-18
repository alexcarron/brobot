const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, TextChannel, ChannelType, PermissionOverwrites, PermissionFlagsBits, CategoryChannel, ChatInputCommandInteraction, Message, GuildChannel, ButtonInteraction, InteractionResponse, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction } = require('discord.js');
const { Role } = require('../services/rapid-discord-mafia/role');
const { fetchChannel, fetchChannelsInCategory, getEveryoneRole } = require('./discord-fetch-utils');
const { incrementEndNumber } = require('./string-manipulation-utils');
const { logInfo, logError, logWarning } = require('./logging-utils');
const { getShuffledArray } = require('./data-structure-utils');
const { InvalidArgumentTypeError } = require('./error-utils');



/**
 * Prompt the user to confirm or cancel an action by adding buttons to the deffered reply to an existing command interaction.
 * @param {object} options - Options for the confirmation prompt.
 * @param {ChatInputCommandInteraction} options.interaction - The command interaction whose reply is being updated.
 * @param {string} options.message - The message to include in the confirmation prompt.
 * @param {string} options.confirmText - The label for the confirm button.
 * @param {string} options.cancelText - The label for the cancel button.
 * @param {string} options.confirmUpdateText - The message to send if the user confirms.
 * @param {string} options.cancelUpdateText - The message to send if the user cancels.
 * @returns {Promise<boolean>} `true` if the user confirms, `false` if the user cancels.
 */
const confirmInteractionWithButtons = async ({
	interaction,
	message,
	confirmText,
	cancelText,
	confirmUpdateText,
	cancelUpdateText,
}) => {
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

	const filter = (otherInteraction) => otherInteraction.user.id === interaction.user.id;

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
};

/**
 * Adds a role to a guild member.
 * @param {GuildMember} guildMember The guild member we want to add the role to.
 * @param {import('discord.js').RoleResolvable} role The role we want to add to the guild member.
 * @returns {Promise<void>}
 */
const addRoleToMember = async (guildMember, role) => {
	await guildMember.roles.add(role);
}

/**
 * Removes a role from a guild member.
 * @param {GuildMember} guildMember The guild member we want to remove the role from.
 * @param {import('discord.js').RoleResolvable} role The role or role ID we want to remove from the guild member.
 * @returns {Promise<void>}
 */
const removeRoleFromMember = async (guildMember, role) => {
	await guildMember.roles.remove(role);
}

/**
 * Removes all roles from a guild member.
 * @param {GuildMember} guildMember The guild member we want to remove all roles from.
 * @returns {Promise<void>}
 */
const removeAllRolesFromMember = async (guildMember) => {
	for (const roleId of guildMember.roles.cache.keys()) {
		if (roleId === guildMember.guild.id) continue;
		await removeRoleFromMember(guildMember, roleId);
	}
}

/**
 * Defers an interaction, editing or replying to the interaction with the provided message content.
 * @param {ChatInputCommandInteraction} interaction The interaction to defer.
 * @param {string} [messageContent] The content of the message to edit or reply with.
 * @returns {Promise<void>}
 */
const deferInteraction = async (
  interaction,
  messageContent = "Running command..."
) => {
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
        await interaction.deferReply({ ephemeral: true });
      }
			catch (ephemeralErr) {
        // Failed to defer ephemerally, try to defer normally
        try {
          await interaction.deferReply();
        }
				catch (deferErr) {
          // Both defer attempts failed — try immediate reply as fallback
          try {
            await interaction.reply({ ...replyContent, ephemeral: true });
          }
					catch (replyErr) {
            // If ephemeral reply failed, try non-ephemeral reply as last resort
            try {
              await interaction.reply(replyContent);
            }
						catch (finalErr) {
              logWarning("Interaction already expired: unable to reply/follow-up");
            }
          }
        }
      }
    }
  } catch (error) {
    if (error.code === 10062) {
      logWarning("Interaction already expired: unable to reply/follow-up");
    }
		else {
      logError("Error responding to interaction:", error);
    }
  }
};

/**
 * Replies to an interaction with the provided message content.
 * @param {CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction} interaction - The interaction to reply to.
 * @param {string} messageContent - The content of the message to reply with.
 * @returns {Promise<InteractionResponse<boolean>>} A promise that resolves when the message is sent.
 */
const replyToInteraction = async (interaction, messageContent) => {
	if (
		interaction &&
		"reply" in interaction &&
		typeof interaction.reply === "function"
	) {
		return await interaction.reply({
			content: messageContent,
			ephemeral: true,
		});
	}

	throw new InvalidArgumentTypeError({
		functionName: "replyToInteraction",
		argumentName: "interaction",
		expectedType: "ReplyableInteraction",
		actualValue: interaction
	});
}

/**
 * Edits the reply to an interaction with new message contents.
 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
 * @param {string | object} newMessageContents - The new contents for the message.
 * @returns {Promise<Message<boolean>>} A promise that resolves when the message is edited.
 */
const editReplyToInteraction = async (interaction, newMessageContents) => {
	if (interaction && (interaction.replied || interaction.deferred)) {
		return await interaction.editReply(newMessageContents);
	}

	throw new Error('Interaction is not deferred or replied');
}

/**
 * Shows a modal to a user, prompting them for text input. Returns the text entered by the user.
 * @param {object} options - Options for showing the modal.
 * @param {ChatInputCommandInteraction | ButtonInteraction} options.interaction The interaction that triggered the modal.
 * @param {string} [options.modalTitle] The title of the modal.
 * @param {string} [options.showModalButtonText] The text of the button which shows the modal.
 * @param {string} [options.initialMessageText] The text to send to the user when prompting them to press the button.
 * @param {string} [options.placeholder] The placeholder text for the text input field in the modal.
 * @returns {Promise<string | undefined>} The text entered by the user.
 */
const getInputFromCreatedTextModal = async ({
		interaction,
		modalTitle="",
		placeholder="",
}) => {
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
		.setRequired(true)
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
		logError(`Error in getInputFromCreatedTextModal`, error);
		return undefined;
	}

	// Get the data entered by the user
	const textEntered = submittedInteraction.fields.getTextInputValue(textInputID);

	// Acknowledge the interaction but don't update the message
	await submittedInteraction.deferUpdate();
	// await submittedInteraction.deferReply({ ephemeral: true });

	return textEntered;
}

/**
 * Creates a Discord channel in a guild.
 * If the parent category has reached its maximum number of channels, it will create a new category and place the channel within it.
 * @param {object} options - Options for creating the channel.
 * @param {Guild} options.guild - The guild in which the channel is to be created.
 * @param {string} options.name - The name of the channel.
 * @param {PermissionOverwrites[]} [options.permissions] - Permission overwrites for the channel. If not provided, the default permissions will be used.
 * @param {import('discord.js').CategoryChannelResolvable | null} [options.parentCategory] - The parent category of the channel. If not provided, the channel will not have a parent category.
 * @returns {Promise<TextChannel>} The created channel.
 */
const createChannel = async ({guild, name, permissions = [], parentCategory: parentCategoryResolvable = null}) => {
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

	if (parentCategoryResolvable !== null) {
		if (!(parentCategoryResolvable instanceof CategoryChannel)) {
			const fetchedChannel = await fetchChannel(guild, parentCategoryResolvable);

			if (!fetchedChannel) {
				throw new Error('Parent category must exist');
			}

			if (!(fetchedChannel instanceof CategoryChannel)) {
				throw new Error('Parent category must be an instance of CategoryChannel');
			}

			if (fetchedChannel.type !== ChannelType.GuildCategory) {
				throw new Error('Parent category must be a GuildCategory');
			}

			parentCategoryResolvable = fetchedChannel;
		}
	}
	else {
		parentCategoryResolvable = null;
	}

	/**
	 * @type {CategoryChannel | null}
	 */
	// @ts-ignore
	const parentCategory = parentCategoryResolvable;

	let haveSpaceForNewChannel = false;

	while (parentCategory && !haveSpaceForNewChannel) {
		const childChannelCount = parentCategory.children.cache.size;
		if (childChannelCount >= MAX_CHANNELS_PER_CATEGORY) {
			// @ts-ignore
			const newCategoryName = incrementEndNumber(parentCategoryResolvable.name);
			const existingNewCategory = guild.channels.cache.find((channel) => channel.name === newCategoryName);

			if (existingNewCategory) {
				// @ts-ignore
				parentCategoryResolvable = existingNewCategory;
				continue;
			}

			parentCategoryResolvable = await createCategory({
				guild,
				name: newCategoryName,
				permissions: [createEveryoneDenyViewPermission(guild)],
			});
		}
		else {
			haveSpaceForNewChannel = true;
			break;
		}
	}

	const options = {
		name: name,
		type: ChannelType.GuildText,
	};

	if (parentCategoryResolvable) {
		options.parent = parentCategoryResolvable;
	}

	if (permissions) {
		options.permissionOverwrites = permissions;
	}

	// @ts-ignore
	const channel = await guild.channels.create(options);

	// @ts-ignore
	return channel;
};

/**
 * Creates a category in a guild.
 * @param {object} options - Options for creating the category.
 * @param {Guild} options.guild - The guild in which the category is to be created.
 * @param {string} options.name - The name of the category.
 * @param {PermissionOverwrites[]} [options.permissions] - Permission overwrites for the category. If not provided, the default permissions will be used.
 * @returns {Promise<CategoryChannel>} The created category.
 */
const createCategory = async ({guild, name, permissions = []}) => {
	if (!guild)
		throw new Error("Guild is required");

	if (!(guild instanceof Guild))
		throw new Error("Guild object must be an instance of Guild");

	if (!name)
		throw new Error("Category name is required");

	if (typeof name !== "string")
		throw new Error("Category name must be a string");

	const options = {
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
};

/**
 * Creates a permission overwrite object for a Discord channel.
 * @param {object} options - Options for creating the permission overwrite.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are being set.
 * @param {PermissionFlagsBits[]} [options.allowedPermissions] - An array of permissions that are allowed for the user or role.
 * @param {PermissionFlagsBits[]} [options.deniedPermissions] - An array of permissions that are denied for the user or role.array.
 * @returns {object} The permission overwrite object.
 */
const createPermission = ({userOrRoleID, allowedPermissions, deniedPermissions}) => {
	if (!userOrRoleID)
		throw new Error("User or role ID is required");

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	const overwrite = {
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
 * @param {Guild} guild - The guild in which the permission overwrite is to be created.
 * @returns {object} The permission overwrite object.
 */
const createEveryoneDenyViewPermission = (guild) =>
	createPermission({
		// @ts-ignore
		userOrRoleID: guild.roles.everyone,
		// @ts-ignore
		deniedPermissions: [PermissionFlagsBits.ViewChannel],
	});

/**
 * Adds permission overwrites to a Discord channel for a specific user or role.
 * @param {object} options - Options for setting permissions.
 * @param {TextChannel} options.channel - The channel to which the permissions are applied.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are set.
 * @param {bigint[]} [options.allowedPermissions] - An array of permissions to allow.
 * @param {bigint[]} [options.deniedPermissions] - An array of permissions to deny.
 * @throws {Error} If neither allowedPermissions nor deniedPermissions are provided, or if they are not arrays.
 * @returns {Promise<void>} A promise that resolves when the permissions have been set.
 */
const addPermissionToChannel = async ({channel, userOrRoleID, allowedPermissions, deniedPermissions}) => {
	const permissions = {}

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	if (allowedPermissions) {
		for (const permission of allowedPermissions) {
			permissions[permission] = true;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
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
 * @param {object} options - Options for removing permissions.
 * @param {TextChannel} options.channel - The channel from which the permissions are removed.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are removed.
 * @returns {Promise<void>} A promise that resolves when the permissions have been removed.
 */
const removePermissionFromChannel = async ({channel, userOrRoleID}) => {
	await channel.permissionOverwrites.delete(userOrRoleID);
}

/**
 * Updates the permission overwrites for a Discord channel for a specific user or role.
 * @param {object} options - Options for updating the permissions.
 * @param {TextChannel} options.channel - The channel for which the permissions are being updated.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are being updated.
 * @param {PermissionFlagsBits[]} [options.allowedPermissions] - An array of permissions that should be allowed for the user or role.
 * @param {PermissionFlagsBits[]} [options.unsetPermissions] - An array of permissions that should be unset for the user or role.
 * @param {PermissionFlagsBits[]} [options.deniedPermissions] - An array of permissions that should be denied for the user or role.
 * @throws Will throw an error if none of allowedPermissions, deniedPermissions, or unsetPermissions are provided, or if any of them are not arrays.
 */
const changePermissionOnChannel = async ({channel, userOrRoleID, allowedPermissions, unsetPermissions, deniedPermissions}) => {
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
			permissions[permission] = true;
		}
	}

	if (unsetPermissions) {
		for (const permission of unsetPermissions) {
			permissions[permission] = null;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
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
 * @param {TextChannel} channel - The channel to be opened for viewing.
 */
const openChannel = async (channel) => {
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
 * Closes a Discord channel to deny everyone the ability to view it.
 * @param {TextChannel} channel - The channel to be closed from viewing.
 */
const closeChannel = async (channel) => {
	const everyoneRole = getEveryoneRole(channel.guild);

	await changePermissionOnChannel({
		channel: channel,
		userOrRoleID: everyoneRole.id,
		// @ts-ignore
		unsetPermissions: [PermissionFlagsBits.SendMessages],
		// @ts-ignore
		deniedPermissions: [PermissionFlagsBits.ViewChannel],
	});
}


/**
 * Checks if a guild member has a given role.
 * @param {GuildMember} guildMember - The guild member to check.
 * @param {Role | string} roleID - The role to check for.
 * @param {boolean} useCache - Whether to use the guild member's cache.
 * @returns {Promise<boolean>} True if the guild member has the given role, false otherwise.
 */
const memberHasRole = async (guildMember, roleID, useCache = false) => {
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
const renameChannel = async (channel, newName) => {
	await channel.setName(newName);
}

/**
 * Sets the nickname of a guild member.
 * @param {GuildMember} guildMember - The guild member whose nickname is to be set.
 * @param {string} newNickname - The new nickname for the guild member.
 * @returns {Promise<void>} A promise that resolves when the nickname has been set.
 */
const setNicknameOfMember = async (guildMember, newNickname) => {
	await guildMember.setNickname(newNickname);
}

/**
 * Shuffles all the channels in a category in a random order, keeping the other channels in the same position.
 * @param {Guild} guild - The guild whose category's channels are to be shuffled.
 * @param {CategoryChannel|string} category - The category whose channels are to be shuffled, or the ID of the category as a string.
 * @returns {Promise<void>} A promise that resolves when the channels have been shuffled.
 */
async function shuffleCategoryChannels(guild, category) {
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

	let channelsToShuffle = await fetchChannelsInCategory(guild, category.id);
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

/**
 * Adds a button to the components array of an object representing the contents of a Discord message.
 * @param {object} options - Options for adding the button.
 * @param {string | object} options.contents - The contents of the message. Can be a string or an object with a "content" property.
 * @param {string} options.buttonID - The custom ID of the button.
 * @param {string} options.buttonLabel - The label of the button.
 * @param {ButtonStyle} [options.buttonStyle] - The style of the button. Optional, defaults to ButtonStyle.Primary.
 * @returns {object} The modified contents object with the button added.
 */
const addButtonToMessageContents = ({
	contents,
	buttonID,
	buttonLabel,
	buttonStyle = ButtonStyle.Primary,
}) => {
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

	contents.components = contents.components || [];
	contents.components.push(actionRow);

	return contents;
}

/**
 * Waits for a user to click on a button on a message with a component.
 * @param {Message} messsageWithButton - The message with the button.
 * @param {string} buttonID - The custom ID of the button.
 * @param {(buttonInteraction: ButtonInteraction) => Promise<void>} onButtonPressed - The function to run when the button is pressed.
 * @returns {Promise<void>} A promise that resolves when the user has clicked a button.
 */
const doWhenButtonPressed = async (messsageWithButton, buttonID, onButtonPressed) => {
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
		logError(
			`Error while waiting for user to click button with ID ${buttonID}`,
			error
		)
	}
};

module.exports = {
	confirmInteractionWithButtons,
	addRoleToMember,
	removeRoleFromMember,
	removeAllRolesFromMember,
	deferInteraction,
	replyToInteraction,
	editReplyToInteraction,
	getInputFromCreatedTextModal,
	createChannel,
	createPermission,
	createEveryoneDenyViewPermission,
	addPermissionToChannel,
	removePermissionFromChannel,
	changePermissionOnChannel,
	openChannel,
	closeChannel,
	memberHasRole,
	createCategory,
	renameChannel,
	setNicknameOfMember,
	addButtonToMessageContents,
	doWhenButtonPressed,
	shuffleCategoryChannels,
};