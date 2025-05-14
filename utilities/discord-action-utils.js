const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

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

module.exports = {
	confirmInteractionWithButtons,
	addRoleToMember,
	removeRoleFromMember,
	deferInteraction,
};