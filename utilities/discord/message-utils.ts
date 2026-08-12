import { Channel, Collection, Message, MessageCreateOptions, TextBasedChannel, TextChannel, User } from "discord.js";
import { ids } from "../../bot-config/discord-ids";
import { InvalidArgumentError } from "../error-utils";
import { joinLines } from "../string-manipulation-utils";
import { fetchUser } from "./guild-member-utils";
import { toMessageEditFromCreateOptions } from "./message-component-utils";

const MAX_DM_MESSAGE_LENGTH = 4000;
const MAX_CHANNEL_MESSAGE_LENGTH = 2000;

/**
 * Fetches a message from Discord using the given channel.
 * @param channel The channel that the message belongs to.
 * @param messageID The ID of the message to fetch.
 * @returns A Promise that resolves with the Message object if successful, or rejects with an Error if not.
 */
export async function fetchMessage(channel: TextBasedChannel, messageID: string): Promise<Message> {
	return await channel.messages.fetch(messageID);
}

/**
 * Fetches all messages in a channel
 * @param channel The channel whose messages you want to fetch
 * @returns A Promise that resolves with an array of all messages in the channel
 */
export async function fetchAllMessagesInChannel(channel: Channel): Promise<Message[]> {
	if (!channel || !(channel instanceof TextChannel)) {
		throw new InvalidArgumentError("Channel is required and must be an instance of TextChannel");
	}

	const allMessages: Message[] = [];
	let oldestMessageID: string | undefined = undefined;
	let keepFetching = true;

	while (keepFetching) {
		const fetched: Collection<string, Message> = await channel.messages.fetch({
			limit: 100,
			before: oldestMessageID
		});
		if (fetched.size === 0)
			keepFetching = false;

		allMessages.push(...fetched.values());
		oldestMessageID = fetched.last()?.id;
	}

	// Ensure messages are in chronological order
	allMessages.reverse();

	return allMessages;
}

/**
 * Fetches the most recent message in a channel.
 * @param channel The channel to fetch the message from.
 * @returns A Promise that resolves with the most recent Message object in the channel.
 * @throws {Error} If the channel is not an instance of TextChannel.
 */
export async function fetchChannelMessage(channel: TextChannel): Promise<Message> {
	channel = await channel.fetch();
	const messageID = channel.lastMessageId;

	if (messageID === null)
		throw new Error(`fetchChannelMessage: No message found in channel ${channel.id}`);

	return fetchMessage(channel, messageID);
}

/**
 * Fetch a message from a channel that contains a specific component ID
 * @param options - The options object
 * @param options.channel - The Discord channel to search in
 * @param options.componentID - The customId of the component (button, select menu, etc.)
 * @returns The message containing the component, or null if not found
 */
export async function fetchMessageWithComponent({ channel, componentID }: { channel: TextBasedChannel; componentID: string }): Promise<Message | null> {
	const messages = await fetchAllMessagesInChannel(channel);

	for (const message of messages) {
		if (!message.components || message.components.length === 0) continue;

		// Loop through action rows and components
		for (const row of message.components) {
			if ('components' in row === false) continue;

			for (const component of row.components) {
				if ('customId' in component === false) continue;

				if (component.customId === componentID) {
					return message; // Found the message
				}
			}
		}
	}

	return null; // Not found
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
 * Splits a string into chunks that never exceed maxLength, always breaking on newline boundaries so that no individual line is ever cut mid-character. If a single line is longer than maxLength it is placed in its own chunk and left intact — truncating a table row would produce worse output than a slightly oversized message.
 * @param content - The string to split into chunks.
 * @param maxLength - The maximum length of a chunk.
 * @returns An array of chunks.
 */
function splitOnNewlines(content: string, maxLength: number): string[] {
	const lines = content.split("\n");
	const chunks: string[] = [];
	let current = "";

	for (const line of lines) {
		const appended = current.length === 0 ? line : `${current}\n${line}`;

		if (appended.length <= maxLength) {
			current = appended;
		} else {
			if (current.length > 0) {
				chunks.push(current);
			}
			// A single line that is already too long gets its own chunk untouched
			// rather than being cut mid-character and producing broken output.
			if (line.length > maxLength) {
				chunks.push(line);
				current = "";
			} else {
				current = line;
			}
		}
	}

	if (current.length > 0) {
		chunks.push(current);
	}

	return chunks;
}

/**
 * Extracts the opening code block fence from a string, if present
 * @param content - The string to extract the fence from.
 * @returns The opening code block fence, or null if none is present.
 */
function extractOpeningCodeFence(content: string): string | null {
	const match = content.match(/^(```[^\n]*)\n/);
	return match ? match[1] : null;
}

/**
 * Splits a MessageCreateOptions object into multiple MessageCreateOptions objects if the content exceeds the maximum length
 * @param messageOptions - The MessageCreateOptions object to split.
 * @param maxMessageLength - The maximum length of a message.
 * @returns An array of MessageCreateOptions objects.
 */
function chunkMessageOptions(
	messageOptions: MessageCreateOptions,
	maxMessageLength: number = MAX_CHANNEL_MESSAGE_LENGTH,
): MessageCreateOptions[] {
	const content = messageOptions.content ?? "";

	if (typeof content !== "string" || content.length <= maxMessageLength) {
		return [messageOptions];
	}

	const fence = extractOpeningCodeFence(content);

	if (!fence) {
		return splitOnNewlines(content, maxMessageLength).map((chunk) => ({
			...messageOptions,
			content: chunk,
		}));
	}

	// Strip the opening fence line and the closing ``` to get the raw inner content.
	// Input format is: "```md\n<inner content>\n```"
	const afterFence = content.slice(fence.length + 1); // remove "```md\n"
	const innerContent = afterFence.endsWith("\n```")
		? afterFence.slice(0, -4) // remove trailing "\n```"
		: afterFence;

	// Budget: maxMessageLength minus "```md\n" (fence + 1) and "\n```" (4)
	const fenceOverhead = fence.length + 1 + 4;
	const innerMaxLength = maxMessageLength - fenceOverhead;

	return splitOnNewlines(innerContent, innerMaxLength).map((chunk) => ({
		...messageOptions,
		content: `${fence}\n${chunk}\n\`\`\``,
	}));
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
		message = { content: message };

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
