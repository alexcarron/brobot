import { getRandomUUID } from "../random-utils";
import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { throwIfNotError } from "../error-utils";
import { InteractionWithModalSupport } from "../constants/discord-interface.constants";
import { logError } from "../logging-utils";
import { mapToObject } from "../data-structure-utils";
import { editReplyToInteraction, replyToInteraction } from "../discord-action-utils";
import { DiscordButtons } from "./discord-buttons";


/**
 * Shows a modal to a user, prompting them for text input. Returns the text entered by the user.
 * @param options - Options for showing the modal.
 * @param options.interaction - The interaction that triggered the modal.
 * @param options.id - The custom ID of the modal.
 * @param options.title - The title of the modal. Must be less than or equal to 45 characters.
 * @param options.textInputs - The text inputs to show in the modal. The label must be less than or equal to 45 characters.
 * @param options.onModalSubmitted - The function to call when the user submits the modal.
 * @param options.timeout - The amount of time to wait for the user to submit the modal.
 */
export async function showModalWithTextInputs<
	TextInputs extends readonly {
		id: string;
		label: string;
		initialValue: string;
		maxLength?: number;
	}[]
> (
	{interaction, id, title, textInputs, onModalSubmitted, timeout = 600_000}: {
		interaction: InteractionWithModalSupport;
		id?: string;
		title: string;
		textInputs: TextInputs;
		onModalSubmitted: (args:
			& {interaction: ModalSubmitInteraction}
			& {[TextInput in TextInputs[number] as `${TextInput['id']}Value`]: string;}
		) => Promise<unknown>;
		timeout?: number;
	}
) {
	const modalID = id ?? `modal-${getRandomUUID()}`;
	if (title.length > 45)
		title = title.substring(0, 45);

	// Create the modal
	const modal = new ModalBuilder()
		.setCustomId(modalID)
		.setTitle(title);

	const modalTextInputs = textInputs.map(
		({id, label, initialValue, maxLength}) => {
			if (label.length > 45)
				label = label.substring(0, 45);

			// Create the text input field
			const textInput = new TextInputBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setPlaceholder(initialValue)
				.setValue(initialValue)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph);

			if (maxLength) textInput.setMaxLength(maxLength);

			return textInput;
		}
	);

	const textInputsActionRows = modalTextInputs.map(modalTextInput =>
		new ActionRowBuilder<TextInputBuilder>().addComponents(modalTextInput)
	)

	modal.addComponents(textInputsActionRows);

	let submittedInteraction: ModalSubmitInteraction;
	try {
		await interaction.showModal(modal);

		// Wait for user to submit the modal
		submittedInteraction = await interaction.awaitModalSubmit({
			filter: (submitInteraction) =>
				submitInteraction.customId === modalID &&
				submitInteraction.user.id === interaction.user.id,
			time: timeout,
		});

		if (submittedInteraction instanceof ModalSubmitInteraction) {
			textInputs.forEach(({id}) =>
				submittedInteraction.fields.getTextInputValue(id)
			);

			const textInputsValues = mapToObject(textInputs, ({id}) => ({
				[`${id}Value`]: submittedInteraction.fields.getTextInputValue(id),
			}))

			await onModalSubmitted({
				interaction: submittedInteraction,
				...textInputsValues as {
					[TextInput in TextInputs[number] as `${TextInput['id']}Value`]: string;
				},
			});
		}
	}
	catch (error) {
		throwIfNotError(error);
		logError(`Error while waiting for user to submit modal`, error);
	}
}

/**
 * Confirms an interaction by sending a prompt with a confirm and cancel button.
 * When the user presses the confirm button, the function will call the onConfirm callback with the button interaction.
 * When the user presses the cancel button, the function will call the onCancel callback with the button interaction.
 * @param options - The options for the confirmation prompt
 * @param options.interactionToConfirm - The interaction to confirm
 * @param options.confirmPromptText - The text to display in the confirmation prompt
 * @param options.confirmButtonText - The text to display on the confirm button
 * @param options.cancelButtonText - The text to display on the cancel button
 * @param options.confirmButtonStyle - The style of the confirm button
 * @param options.cancelButtonStyle - The style of the cancel button
 * @param options.onConfirm - The callback to call when the user presses the confirm button or a string to reply with when the user presses the confirm button
 * @param options.onCancel - The callback to call when the user presses the cancel button or a string to reply with when the user presses the cancel button
 * @returns {Promise<void>}
 */
export async function confirmInteraction(
	{interactionToConfirm, confirmPromptText, confirmButtonText, cancelButtonText, confirmButtonStyle, cancelButtonStyle, onConfirm, onCancel}: {
		interactionToConfirm: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction;
		confirmPromptText: string;
		confirmButtonText: string;
		cancelButtonText: string;
		confirmButtonStyle?: ButtonStyle;
		cancelButtonStyle?: ButtonStyle;
		onConfirm: string | ((buttonInteraction: ButtonInteraction) => any);
		onCancel: string | ((buttonInteraction: ButtonInteraction) => any);
	}
) {
	const buttons = new DiscordButtons({
		promptText: confirmPromptText,
		buttons: [
			{
				id: `confirm-${getRandomUUID()}`,
				label: confirmButtonText,
				style: confirmButtonStyle ?? ButtonStyle.Success,
				onButtonPressed: async (buttonInteraction: ButtonInteraction) => {
					if (typeof onConfirm === 'string') {
						return await editReplyToInteraction(interactionToConfirm, {
							content: onConfirm,
							components: [],
						});
					}
					else {
						return await onConfirm(buttonInteraction);
					}
				}
			},
			{
				id: `cancel-${getRandomUUID()}`,
				label: cancelButtonText,
				style: cancelButtonStyle ?? ButtonStyle.Danger,
				onButtonPressed: async (buttonInteraction: ButtonInteraction) => {
					if (typeof onCancel === 'string') {
						return await editReplyToInteraction(interactionToConfirm, {
							content: onCancel,
							components: [],
						});
					}
					else {
						return await onCancel(buttonInteraction);
					}
				}
			}
		]
	});

	await replyToInteraction(interactionToConfirm, buttons.getMessageContents());
}
