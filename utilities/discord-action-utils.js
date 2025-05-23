const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, TextChannel } = require('discord.js');

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
		return await interaction.editReply(new_message);
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

module.exports = {
	confirmInteractionWithButtons,
	addRoleToMember,
	removeRoleFromMember,
	deferInteraction,
	editReplyToInteraction,
	getInputFromCreatedTextModal,
};