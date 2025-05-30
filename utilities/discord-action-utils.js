const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, TextChannel, ChannelType, PermissionOverwrites, PermissionFlagsBits, CategoryChannel } = require('discord.js');
const { Role } = require('../services/rapid-discord-mafia/role');
const { fetchChannel } = require('./discord-fetch-utils');
const { incrementEndNumber } = require('./text-formatting-utils');

/**
 * Prompt the user to confirm or cancel an action by adding buttons to the deffered reply to an existing command interaction.
 *
 * @param {Interaction} interaction - The command interaction whose reply is being updated.
 * @param {string} message - The message to include in the confirmation prompt.
 * @param {string} confirmText - The label for the confirm button.
 * @param {string} cancelText - The label for the cancel button.
 * @param {string} confirmUpdateText - The message to send if the user confirms.
 * @param {string} cancelUpdateText - The message to send if the user cancels.
 *
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
				content: `\`${confirmUpdateText}\``,
				components: [],
			});
			return true;
		}
		else if (confirmation.customId === 'cancel') {
			await confirmation.update({
				content: `\`${cancelUpdateText}\``,
				components: [],
			});
			return false;
		}
	}
	catch {
		await interaction.editReply({
			content: `\`Response not recieved in time\``,
			components: [],
		});
	}
};

/**
 * Adds a role to a guild member.
 * @param {GuildMember} guildMember The guild member we want to add the role to.
 * @param {Role} role The role we want to add to the guild member.
 * @returns {Promise<void>}
 */
const addRoleToMember = async (guildMember, role) => {
	await guildMember.roles.add(role);
}

/**
 * Removes a role from a guild member.
 * @param {GuildMember} guildMember The guild member we want to remove the role from.
 * @param {Role} role The role we want to remove from the guild member.
 * @returns {Promise<void>}
 */
const removeRoleFromMember = async (guildMember, role) => {
	await guildMember.roles.remove(role);
}

/**
 * Defers an interaction, editing or replying to the interaction with the provided message content.
 * @param {Interaction} interaction The interaction to defer.
 * @param {string} [messageContent="Running command..."] The content of the message to edit or reply with.
 * @returns {Promise<void>}
 */
const deferInteraction = async (
	interaction,
	messageContent = "Running command..."
) => {
	if (!interaction) return;

	const content = { content: messageContent, ephemeral: true };

	if (interaction.replied) {
		await interaction.followUp(content);
	}
	else if (interaction.deferred) {
		await interaction.editReply(content);
	}
	else {
		await interaction.deferReply(content);
	}
};

/**
 * Edits the reply to an interaction with new message contents.
 *
 * @param {Interaction} interaction - The interaction whose reply is being updated.
 * @param {string | object} newMessageContents - The new contents for the message.
 * @returns {Promise<void>} A promise that resolves when the message is edited.
 */
const editReplyToInteraction = async (interaction, newMessageContents) => {
	if (interaction && (interaction.replied || interaction.deferred)) {
		return await interaction.editReply(newMessageContents);
	}
}

/**
 * Shows a modal to a user, prompting them for text input. Returns the text entered by the user.
 *
 * @param {Object} options
 * @param {TextChannel} options.channelToSendIn The channel to send the message to.
 * @param {string} [options.modalTitle=""] The title of the modal.
 * @param {string} [options.showModalButtonText=""] The text of the button which shows the modal.
 * @param {string} [options.initialMessageText=""] The text to send to the user when prompting them to press the button.
 * @param {string} [options.placeholder=""] The placeholder text for the text input field in the modal.
 * @returns {Promise<string>} The text entered by the user.
 */
const getInputFromCreatedTextModal = async ({
		channelToSendIn,
		modalTitle="",
		initialMessageText="",
		showModalButtonText="",
		placeholder="",
}) => {
	if (!channelToSendIn) return;

	const showModalButtonID = showModalButtonText.replace(" ", "");
	const modalID = `${modalTitle.replace(" ", "")}Modal`;
	const textInputID = `${modalTitle.replace(" ", "")}TextInput`;

	// Create the button to show the modal
	const showModalButton = new ButtonBuilder()
		.setCustomId(showModalButtonID)
		.setLabel(showModalButtonText)
		.setStyle(ButtonStyle.Primary);

	// Create the action row with the button
	const showModalButtonActionRow = new ActionRowBuilder()
		.addComponents(showModalButton);

	// Send the message with the button
	const messageWithShowModalButton = await channelToSendIn.send({
		content: initialMessageText,
		components: [showModalButtonActionRow],
	});

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
	modal.addComponents(textInputActionRow);

	let interaction;

	try {
		// Wait for user to press the button
		interaction = await messageWithShowModalButton.awaitMessageComponent({
			filter: (interaction) => interaction.customId === showModalButtonID,
			time: 1_000_000,
		});

		// Show the modal
		await interaction.showModal(modal);

		// Wait for user to submit the modal
		interaction = await messageWithShowModalButton.awaitMessageComponent({
			filter: (interaction) => interaction.customId === modalID,
			time: 1_000_000,
		});
	}
	catch {
		// If the user doesn't respond in time, delete the message and return undefined
		await messageWithShowModalButton.edit({
			content: `\`Response not recieved in time\``,
			components: [],
		});
		return undefined;
	}

	// Get the data entered by the user
	const textEntered = interaction.fields.getTextInputValue(textInputID);

	// Confirm the user's input
	const reply = await interaction.reply("Confirmed");
	reply.delete();
	messageWithShowModalButton.delete();

	return textEntered;
}

/**
 * Creates a Discord channel in a guild.
 * If the parent category has reached its maximum number of channels, it will create a new category and place the channel within it.
 * @param {Object} options - Options for creating the channel.
 * @param {Guild} options.guild - The guild in which the channel is to be created.
 * @param {string} options.name - The name of the channel.
 * @param {PermissionOverwrites[]} [options.permissions] - Permission overwrites for the channel. If not provided, the default permissions will be used.
 * @param {CategoryChannelResolvable} [options.parentCategory] - The parent category of the channel. If not provided, the channel will not have a parent category.
 * @returns {Promise<TextChannel>} The created channel.
 */
const createChannel = async ({guild, name, permissions = null, parentCategory = null}) => {
	const MAX_CHANNELS_PER_CATEGORY = 50;

	if (!guild)
		throw new Error("Guild is required");

	if (!guild instanceof Guild)
		throw new Error("Guild object must be an instance of Guild");

	if (!name)
		throw new Error("Channel name is required");

	if (typeof name !== "string")
		throw new Error("Channel name must be a string");

	if (permissions && !Array.isArray(permissions))
		throw new Error("Permissions must be an array");

	if (parentCategory) {
		if (!(parentCategory instanceof CategoryChannel))
			parentCategory = await fetchChannel(guild, parentCategory);

	  if (!parentCategory)
			throw new Error("Parent category must exist");

		if (parentCategory.type !== ChannelType.GuildCategory)
			throw new Error("Parent category must be a GuildCategory");
	}

	let haveSpaceForNewChannel = false;

	while (parentCategory && !haveSpaceForNewChannel) {
		const childChannelCount = parentCategory.children.cache.size;
		if (childChannelCount >= MAX_CHANNELS_PER_CATEGORY) {
			const newCategoryName = incrementEndNumber(parentCategory.name);
			const existingNewCategory = guild.channels.cache.find((channel) => channel.name === newCategoryName);

			if (existingNewCategory) {
        parentCategory = existingNewCategory;
        continue;
      }

			parentCategory = await createCategory({
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

	if (parentCategory) {
		options.parent = parentCategory;
	}

	if (permissions) {
    options.permissionOverwrites = permissions;
  }

	const channel = await guild.channels.create(options);

	return channel;
};

/**
 * Creates a category in a guild.
 * @param {Object} options - Options for creating the category.
 * @param {Guild} options.guild - The guild in which the category is to be created.
 * @param {string} options.name - The name of the category.
 * @param {PermissionOverwrite[]} [options.permissions] - Permission overwrites for the category. If not provided, the default permissions will be used.
 * @returns {Promise<CategoryChannel>} The created category.
 */
const createCategory = async ({guild, name, permissions = null}) => {
	if (!guild)
		throw new Error("Guild is required");

	if (!guild instanceof Guild)
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

	const category = await guild.channels.create(options);

	return category;
};

/**
 * Creates a permission overwrite object for a Discord channel.
 * @param {Object} options - Options for creating the permission overwrite.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are being set.
 * @param {PermissionFlagsBits[]} [options.allowedPermissions] - An array of permissions that are allowed for the user or role.
 * @param {PermissionFlagsBits[]} [options.deniedPermissions] - An array of permissions that are denied for the user or role.array.
 * @returns {Object} The permission overwrite object.
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
 * @returns {Object} The permission overwrite object.
 */
const createEveryoneDenyViewPermission = (guild) =>
	createPermission({
		userOrRoleID: guild.roles.everyone,
		deniedPermissions: [PermissionFlagsBits.ViewChannel],
	});

/**
 * Adds permission overwrites to a Discord channel for a specific user or role.
 *
 * @param {Object} options - Options for setting permissions.
 * @param {TextChannel} options.channel - The channel to which the permissions are applied.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are set.
 * @param {PermissionFlagsBits[]} [options.allowedPermissions] - An array of permissions to allow.
 * @param {PermissionFlagsBits[]} [options.deniedPermissions] - An array of permissions to deny.
 * @throws {Error} If neither allowedPermissions nor deniedPermissions are provided, or if they are not arrays.
 */
const addPermissionToChannel = ({channel, userOrRoleID, allowedPermissions, deniedPermissions}) => {
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

	channel.permissionOverwrites.create(
		userOrRoleID,
		permissions,
	);
}

/**
 * Removes all permission overwrites from a Discord channel for a specific user or role.
 *
 * @param {Object} options - Options for removing permissions.
 * @param {TextChannel} options.channel - The channel from which the permissions are removed.
 * @param {string} options.userOrRoleID - The ID of the user or role for which the permissions are removed.
 * @returns {Promise<void>} A promise that resolves when the permissions have been removed.
 */
const removePermissionFromChannel = async ({channel, userOrRoleID}) => {
	await channel.permissionOverwrites.delete(userOrRoleID);
}


/**
 * Checks if a guild member has a given role.
 * @param {GuildMember} guildMember - The guild member to check.
 * @param {Role} roleID - The role to check for.
 * @returns {Promise<boolean>} True if the guild member has the given role, false otherwise.
 */
const memberHasRole = async (guildMember, roleID, useCache = false) => {
	if (!(guildMember instanceof GuildMember))
		throw new Error("Guild member object must be an instance of GuildMember");

	if (roleID instanceof Role)
		roleID = roleID.id;

	if (typeof roleID !== "string")
		throw new Error("Role ID must be a string");

	if (!useCache)
		await guildMember.fetch();

	return guildMember.roles.cache.some(role => role.id === roleID);
}

/**
 * Renames a Discord channel.
 *
 * @param {TextChannel} channel - The channel to rename.
 * @param {string} newName - The new name for the channel.
 * @returns {Promise<void>} A promise that resolves when the channel has been renamed.
 */
const renameChannel = async (channel, newName) => {
	await channel.setName(newName);
}


module.exports = {
	confirmInteractionWithButtons,
	addRoleToMember,
	removeRoleFromMember,
	deferInteraction,
	editReplyToInteraction,
	getInputFromCreatedTextModal,
	createChannel,
	createPermission,
	createEveryoneDenyViewPermission,
	addPermissionToChannel,
	removePermissionFromChannel,
	memberHasRole,
	createCategory,
	renameChannel,
};