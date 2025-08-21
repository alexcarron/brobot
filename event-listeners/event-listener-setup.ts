import {
  ChannelType,
  Events,
  InteractionType,
  Client,
	ButtonInteraction,
	StringSelectMenuInteraction,
} from "discord.js";
import { onNormalMessageSent } from "./on-normal-message-sent";
import { onDmRecieved } from "./on-dm-recieved";
import { onSlashCommandExecuted } from "./on-slash-command-executed";
import { onSlashCommandAutocomplete } from "./on-slash-command-autocomplete";
import { isButtonPressedEvent, onButtonPressed } from "./on-button-pressed";
import { onUserJoinsServer } from "./on-user-joins-server";
import { logInfo, logSuccess } from "../utilities/logging-utils";
import { onMessageDeleted } from "./on-message-deleted";
import { isMenuOptionSelectedEvent } from "./on-menu-option-selected";

/**
 * Represents a function that handles an event.
 */
export type Handler<EventType> = (event: EventType) => Promise<void>;

/**
 * Represents an object that can handle events of a specific type.
 * Used to manage multiple handlers for the same event type.
 */
type EventHandler<EventType> = {
	handlers: {
		all: Handler<EventType>[];
		byID: { [id: string]: Handler<EventType> };
	};
	addHandler(handler: Handler<EventType>): void;
	addHandlerForID(id: string, handler: Handler<EventType>): void;
	runHandlers(event: EventType): Promise<void>;
};

/**
 * Creates an event handler instance that manages multiple handlers for a specific event type.
 * @returns An event handler instance.
 */
function createEventHandler<EventType>(): EventHandler<EventType> {
  const eventHandler: EventHandler<EventType> = {
    handlers: {
			all: [],
			byID: {},
		},
    addHandler(handler) {
			const handlers: Handler<EventType>[] = this.handlers.all;
      handlers.push(handler);
    },
		addHandlerForID(id, handler) {
			this.handlers.byID[id] = handler;
		},
    async runHandlers(event) {
			const handlers: Handler<EventType>[] = this.handlers.all;
      for (const handler of handlers) {
				await handler(event);
      }

			if (
				typeof event === "object" &&
				event !== null &&
				"customId" in event &&
				typeof event.customId === "string"
			) {
				const eventID = event.customId;
				const handler = this.handlers.byID[eventID];
				if (handler) await handler(event);
			}
    }
  };

  eventHandler.addHandler = eventHandler.addHandler.bind(eventHandler);
  eventHandler.runHandlers = eventHandler.runHandlers.bind(eventHandler);

	return eventHandler;
}

export const eventHandlers = {
	onButtonPressed: createEventHandler<ButtonInteraction>(),
	onMenuOptionSelected: createEventHandler<StringSelectMenuInteraction>(),
}

const isDM = (message) =>
	message.channel.type === ChannelType.DM ||
	message.channel.type === ChannelType.GroupDM;

const isSlashCommand = (interaction) =>
	interaction.isChatInputCommand();

const isSlashCommandAutoComplete = (interaction) =>
	interaction.isAutocomplete();

/**
 * Sets up an event listener for when a message is sent (either in a DM or in a server channel)
 * If the message is in a DM, the onDmRecieved function is called
 * If the message is in a server channel, the onNormalMessageSent function is called
 * @param {Client} client - The Discord client instance
 */
const setupMessageSentListener =
	(client) => {

		client.on(Events.MessageCreate,
			async (message) => {

				if (isDM(message)) {
					await onDmRecieved(message);
					return;
				}

				await onNormalMessageSent(message);
			}
		);
	};

const setupInteractionCreateListener =
	(client) => {
		client.on(Events.InteractionCreate,
			async (interaction) => {
				console.log(`Interaction type: ${interaction.type}`);
				console.log(`Interaction type: ${interaction.customId}`);

				if (isSlashCommand(interaction))
					await onSlashCommandExecuted(interaction);

				if (isSlashCommandAutoComplete(interaction))
					await onSlashCommandAutocomplete(interaction);

				if (isButtonPressedEvent(interaction))
					await eventHandlers.onButtonPressed.runHandlers(interaction);

				if (isMenuOptionSelectedEvent(interaction)) {
					console.log("Menu option selected");
					console.log(`eventHandlers: `, JSON.stringify(eventHandlers.onMenuOptionSelected.handlers.byID));
					await eventHandlers.onMenuOptionSelected.runHandlers(interaction);
				}
			}
		)
	};

const setupGuildMemberAddListener =
	(client) => {
		client.on(Events.GuildMemberAdd,
			(guildMember) => {
				onUserJoinsServer(guildMember);
			}
		);
	};

/**
 * Sets up an event listener for when a message is deleted.
 * When a message is deleted, the onMessageDeleted function is called.
 * @param {Client} client The Discord client instance.
 */
const setupMessageDeleteListener =
	(client) => {
		client.on(Events.MessageDelete,
			(message) => {
				if (message.partial) return;

				// @ts-ignore
				onMessageDeleted(message);
			}
		);
	};

export const setupEventListeners = (client) => {
	logInfo("Setting up event listeners...");

	setupMessageSentListener(client);
	setupInteractionCreateListener(client);
	setupGuildMemberAddListener(client);
	setupMessageDeleteListener(client);

	logSuccess("Event listeners set up");
}