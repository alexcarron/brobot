import { ChannelType, Client, Events, Message } from "discord.js"
import { onNormalMessageSent } from "./on-normal-message-sent";

const { prefix } = require('../bot-config/config.json');

const isDM = (message) =>
	message.channel.type === ChannelType.DM ||
	message.channel.type === ChannelType.GroupDM;

const isTextCommand = (message) =>
		message.content.startsWith(prefix) &&
		!message.author.bot;

export const setupMessageSentListener =
	(client) => {
		client.once(Events.MessageCreate,
			async (message) => {
				if (isDM(message))
					return;

				if (isTextCommand(message))
					return;

				await onNormalMessageSent(message);
			}
		);
	};