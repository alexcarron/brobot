import { getRandomUUID } from "../random-utils";
import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { throwIfNotError } from "../error-utils";
import { InteractionWithModalSupport } from "../constants/discord-interface.constants";
import { logError } from "../logging-utils";
import { mapToObject } from "../data-structure-utils";


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