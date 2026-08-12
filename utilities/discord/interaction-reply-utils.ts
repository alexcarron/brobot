import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	CommandInteraction,
	InteractionReplyOptions,
	InteractionResponse,
	Message,
	MessageComponentInteraction,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { InvalidArgumentTypeError } from "../error-utils";
import { logError, logWarning } from "../logging-utils";
import { joinLines } from "../string-manipulation-utils";
import { isArrayOfOneObject } from "../types/type-guards";
import { toInteractionReplyFromMessageCreateOptions } from "./message-component-utils";

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

/**
 * Adds a reply to an interaction with the provided message content.
 * Alternatively, edits the reply if the interaction has already been replied to.
 * If the interaction has not been replied to or deferred, it will attempt to reply ephemerally first, then normally, and finally as a follow-up if all else fails.
 * @param interaction - The interaction to reply to.
 * @param lines - The content of the message to reply with.
 * @returns A promise that resolves when the message is sent.
 */
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
	modalTitle = "",
	placeholder = "",
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

	return textEntered;
}
