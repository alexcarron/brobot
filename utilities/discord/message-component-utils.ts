import {
	ActionRowBuilder,
	Attachment,
	BitField,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	CommandInteraction,
	InteractionReplyOptions,
	Message,
	MessageComponentInteraction,
	MessageCreateOptions,
	MessageEditOptions,
	MessageFlags,
	ModalSubmitInteraction,
} from "discord.js";
import { logError } from "../logging-utils";
import { isBoolean, isUndefined } from "../types/type-guards";

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
		contents = { content: contents };

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
 * Removes all components (buttons, select menus, etc.) from the message a button interaction was triggered on, so a stale button can't be pressed again. This also acknowledges the interaction, so any further reply to it must be a follow-up rather than a reply.
 * @param buttonInteraction - The button interaction whose message is having its components removed.
 * @returns A promise that resolves once the message has been updated.
 */
export async function removeComponentsFromButtonInteractionMessage(buttonInteraction: ButtonInteraction): Promise<void> {
	await buttonInteraction.update({ components: [] });
}

/**
 * Removes all buttons and other components from a followed-up interaction message. Can be ephemeral or non-ephemeral.
 * - Ephemeral follow-up messages cannot be edited through Message.edit(), since that routes through the channel messages REST endpoint, which does not have access to ephemeral messages. This must go through the interaction's webhook instead.
 * @param interaction - The interaction whose webhook sent the message.
 * @param messageToRemoveButtonsFrom - The message to strip components from.
 * @returns A promise that resolves with the edited message.
 */
export async function removeComponentsFromInteractionMessage(interaction: ChatInputCommandInteraction | CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction, messageToRemoveButtonsFrom: Message): Promise<Message> {
	return await interaction.webhook.editMessage(messageToRemoveButtonsFrom.id, { components: [] });
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
 * Narrows a MessageCreateOptions object down to the fields accepted by ButtonInteraction.update(), whose flags type is a stricter subset than MessageCreateOptions.flags.
 * @param contents - The message contents to narrow.
 * @returns The content and components accepted by ButtonInteraction.update().
 */
export function toButtonUpdateFromMessageCreateOptions(
	contents: MessageCreateOptions
): { content: MessageCreateOptions['content']; components: MessageCreateOptions['components'] } {
	return { content: contents.content, components: contents.components };
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
