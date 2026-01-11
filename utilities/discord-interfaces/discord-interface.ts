import { ComponentBuilder, Message, MessageCreateOptions, TextBasedChannel, TextChannel, ButtonInteraction, ButtonStyle, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { deleteAllMessagesInChannel, editReplyToInteraction, replyToInteraction, setChannelMessage, toMessageEditFromCreateOptions } from "../discord-action-utils";
import { fetchMessageWithComponent } from "../discord-fetch-utils";
import { InvalidArgumentError } from "../error-utils";
import { DiscordButtons } from './discord-buttons';
import { getRandomUUID } from '../random-utils';

export async function confirmInteraction(
	{interactionToConfirm, confirmPromptText, confirmButtonText, cancelButtonText, onConfirm, onCancel}: {
		interactionToConfirm: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ButtonInteraction;
		confirmPromptText: string;
		confirmButtonText: string;
		cancelButtonText: string;
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
				style: ButtonStyle.Success,
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
				style: ButtonStyle.Danger,
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

/**
 * Represents a Discord interface that can be created, sent to a channel, regenerated, and deleted.
 */
export abstract class DiscordInterface {
	public readonly id: string;
	protected message?: Message;
	protected channel?: TextChannel

	constructor({id}: {
		id: string
	}) {
		this.id = id;
	}

	/**
	 * Returns the components of the interface as a Record<string, ComponentBuilder>.
	 * @returns The components of the interface as a Record<string, ComponentBuilder>.
	 */
	abstract getComponents(): Record<string,
		| ComponentBuilder
		| Array<ComponentBuilder>
		| Record<string, ComponentBuilder>
	>;

	/**
	 * Returns the contents of the interface as a MessageCreateOptions object.
	 * @returns The contents of the interface as a MessageCreateOptions object.
	 */
	abstract getMessageContents(): MessageCreateOptions;

	/**
	 * Sends the interface in a channel.
	 * @param channel - The channel to send the interface in.
	 * @returns The message that is sent.
	 */
	async sendIn(channel: TextChannel): Promise<Message> {
		const messageContents = this.getMessageContents();
		this.channel = channel;
		this.message = await channel.send(messageContents);
		return this.message;
	}

	/**
	 * Sets the exclusive message in the given channel to the interface.
	 * - Clears all other messages in the channel.
	 * - Sends the interface in the channel.
	 * @param channel - The channel to set the message in.
	 * @returns The message that was set.
	 */
	async setIn(channel: TextChannel): Promise<Message> {
		const messageContents = this.getMessageContents();
		this.channel = channel;
		this.message = await setChannelMessage(channel, messageContents);
		return this.message;
	}

	async setNewMessageIn(channel: TextChannel): Promise<Message> {
		await deleteAllMessagesInChannel(channel);
		return await this.sendIn(channel);
	}

	/**
	 * Resolves a message given a message, this.message, or the message in the database
	 * associated with this.menuID. If none of them are provided, throws an InvalidArgumentError.
	 * @param options - An object with the following properties:
	 * @param options.message - The message to resolve.
	 * @param options.channel - The channel to resolve the message in.
	 * @returns The resolved message.
	 */
	private async resolveMessage({message, channel}: {
		message?: Message;
		channel?: TextBasedChannel
	}): Promise<Message> {
		const maybeChannel =
			channel ??
			this.channel;

		let maybeMessage =
			message ??
			this.message ??
			null;

		if (maybeChannel !== undefined) {
			const messageFound = await fetchMessageWithComponent({
				channel: maybeChannel,
				componentID: this.id
			});

			if (messageFound === null)
				throw new InvalidArgumentError(
					`No message found in channel ${maybeChannel.id} with component ID ${this.id}`
				)

			maybeMessage = messageFound
		}

		if (!maybeMessage) {
			throw new InvalidArgumentError(
				`You must provide a message to regenerate the select menu.`
			)
		}

		return maybeMessage
	}
	/**
	 * Regenerates the interface components and updates the message for when the bot restarts while the interface already exists in a channel.
	 *
	 * **⚠️ WARNING:** Only use this method if the constructor parameters are *guaranteed* to be identical to those used when the interface was originally created. Otherwise, regeneration may fail or cause inconsistent behavior.
	 * @param options - An object with the following properties:
	 * @param options.message - The message to regenerate.
	 * @param options.channel - The channel to regenerate the message in.
	 * @throws {Error} - If the message is not found or cannot be edited.
	 */
	async regenerate({message, channel}: {
		message?: Message;
		channel?: TextBasedChannel
	}) {
		message = await this.resolveMessage({message, channel})
		const messageContents = this.getMessageContents();
		await message.edit(
			toMessageEditFromCreateOptions(messageContents)
		);
	}

	/**
	 * Deletes the interface in a channel.
	 * @param options - An object with the following properties:
	 * @param options.message - The message to delete.
	 * @param options.channel - The channel to delete the message in.
	 */
	async delete({message, channel}: {
		message?: Message;
		channel?: TextBasedChannel
	}) {
		message = await this.resolveMessage({message, channel});
		await message.delete();
	}
}