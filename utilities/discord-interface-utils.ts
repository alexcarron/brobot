import { createRandomUUID } from "./random-utils";
import { ActionRowBuilder, ButtonBuilder, ComponentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, Message, MessageCreateOptions, StringSelectMenuInteraction, TextBasedChannel } from "discord.js";
import { InvalidArgumentError } from "./error-utils";
import { onButtonPressed } from "../event-listeners/on-button-pressed";
import { onMenuOptionSelected } from "../event-listeners/on-menu-option-selected";
import { isStrings } from "./types/type-guards";
import { DiscordSelectMenuOption } from "./constants/discord-interface.constants";
import { setChannelMessage, toMessageEditFromCreateOptions } from "./discord-action-utils";
import { fetchChannelMessage } from "./discord-fetch-utils";

const OPTIONS_PER_SELECT_MENU = 25;

/**
 * Represents a Discord interface that can be created, sent to a channel, regenerated, and deleted.
 */
abstract class DiscordInterface {
	public readonly id: string;
	protected message?: Message;
	protected channel?: TextBasedChannel;

	constructor({id}: {
		id?: string
	}) {
		this.id = id ?? createRandomUUID();
	}

	/**
	 * Returns the components of the interface as a Record<string, ComponentBuilder>.
	 * @returns The components of the interface as a Record<string, ComponentBuilder>.
	 */
	abstract getComponents(): Record<string, ComponentBuilder>;

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
	async sendIn(channel: TextBasedChannel): Promise<Message> {
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
	async setIn(channel: TextBasedChannel): Promise<Message> {
		const messageContents = this.getMessageContents();
		this.channel = channel;
		this.message = await setChannelMessage(channel, messageContents);
		return this.message;
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

		const maybeMessage =
			message ??
			this.message ??
			(maybeChannel !== undefined
				? await fetchChannelMessage(maybeChannel)
				: null);


		if (!maybeMessage) {
			throw new InvalidArgumentError(
				`You must provide a message to regenerate the select menu.`
			)
		}

		return maybeMessage
	}

	/**
	 * Regenerates the components of the interface and updates the message or resets the channel for when the bot is restarted and the select menu is already in a channel.
	 * @param options - An object with the following properties:
	 * @param options.message - The message to regenerate.
	 * @param options.channel - The channel to regenerate the message in.
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

/**
 * Represents a Discord select menu that can be sent to a channel.
 */
export class DiscordSelectMenu extends DiscordInterface {
	private promptText: string;
	private placeholderText: string;
	private options: DiscordSelectMenuOption[];
	private onOptionSelected: (interaction: StringSelectMenuInteraction) => Promise<void>;

	constructor(
		{promptText, placeholderText, menuID, options, onOptionSelected}: {
			promptText: string,
			placeholderText?: string,
			menuID?: string,
			options:
				| string[]
				| {label: string; value: string}[],
			onOptionSelected: (interaction: StringSelectMenuInteraction) => Promise<void>,
		}
	) {
		super({
			id: menuID ?? `select-menu-${createRandomUUID()}`
		});

		this.promptText = promptText;
		this.placeholderText =
			placeholderText ?? 'Select an option...';

		if (options.length === 0)
			throw new InvalidArgumentError('createSelectMenu: options must not be empty.');

		if (isStrings(options))
			options = options.map((option) => ({
				label: option,
				value: option
			}));

		this.options = options;
		this.onOptionSelected = onOptionSelected;
	}

	get perviousPageButtonID(): string {
		return `${this.id}-previous-page`;
	}

	get nextPageButtonID(): string {
		return `${this.id}-next-page`;
	}

	/**
	 * The total number of pages in the select menu.
	 * @readonly
	 * @returns The total number of pages in the select menu.
	 */
	private get totalPages(): number {
		return Math.ceil(this.options.length / OPTIONS_PER_SELECT_MENU);
	}

	/**
	 * Gets the options for the given page.
	 * @param numPage The number of the page to get the options for.
	 * @returns An array of options for the given page.
	 * @throws {InvalidArgumentError} If numPage is not between 0 and totalPages - 1.
	 */
	private getOptionsForPage(numPage: number): Array<{
		label: string;
		value: string
	}> {
		if (numPage < 0 || numPage >= this.totalPages)
			throw new InvalidArgumentError(`getOptionsForPage: numPage must be between 0 and ${this.totalPages - 1}.`);

		return this.options.slice(
			numPage * OPTIONS_PER_SELECT_MENU,
			(numPage + 1) * OPTIONS_PER_SELECT_MENU
		)
	}

	getComponents({numPage = 0} : {numPage?: number} = {}): {
		selectMenu: StringSelectMenuBuilder,
		previousButton: ButtonBuilder,
		nextButton: ButtonBuilder
	} {
		const selectMenu = this.getSelectMenu({numPage});
		const previousButton = this.getPreviousButton({numPage});
		const nextButton = this.getNextButton({numPage});

		return {
			selectMenu,
			previousButton,
			nextButton
		};
	}

	/**
	 * Updates the components of a button interaction to reflect a new page number.
	 * If the new page number is out of range, the interaction is deferred instead.
	 * @param options - An object with the following properties:
	 * @param options.buttonInteraction - The button interaction that triggered this function.
	 * @param options.newPageNum - The number of the page to change to.
	 */
	async updateOnNewPage(
		{buttonInteraction, newPageNum}: {
			buttonInteraction: ButtonInteraction,
			newPageNum: number
		}
	) {
		if (newPageNum >= 0 && newPageNum < this.totalPages) {
			const newComponents = this.getComponents({
				numPage: newPageNum,
			});

			await buttonInteraction.update({
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newComponents.selectMenu),
					new ActionRowBuilder<ButtonBuilder>().addComponents(newComponents.previousButton, newComponents.nextButton)
				]
			});
		}
		else {
			await buttonInteraction.deferUpdate();
		}
	}

	/**
	 * Gets a select menu that displays the options for a given page.
	 * @param options - An object with the following properties:
	 * @param options.numPage - The number of the page to start on.
	 * @returns The select menu that was created.
	 */
	getSelectMenu({numPage = 0} : {numPage?: number} = {}): StringSelectMenuBuilder {
		const paginatedOptions = this.getOptionsForPage(numPage);
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(this.id)
			.setPlaceholder(this.placeholderText)
			.addOptions(
				paginatedOptions.map((option) =>
					new StringSelectMenuOptionBuilder(option)
				)
			);
		onMenuOptionSelected(this.id, this.onOptionSelected);
		return selectMenu;
	}

	/**
	 * Gets a button that, when clicked, will update the select menu to the previous page.
	 * @param options - An object with the following properties:
	 * @param options.numPage - The number of the page to start on.
	 * @returns The button that was created.
	 */
	getPreviousButton({numPage = 0} : {numPage?: number} = {}): ButtonBuilder {
		const previousButton = new ButtonBuilder()
			.setCustomId(this.perviousPageButtonID)
			.setLabel('◀ Previous')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(numPage === 0);

		onButtonPressed(this.perviousPageButtonID, async (buttonInteraction) => {
			await this.updateOnNewPage({
				buttonInteraction,
				newPageNum: numPage - 1
			});
		});

		return previousButton;
	}

	/**
	 * Creates a button that, when clicked, will update the select menu to the next page.
	 * @param options - The options for the button.
	 * @param options.numPage - The number of the page to start on.
	 * @returns The button that was created.
	 */
	getNextButton({numPage = 0} : {numPage?: number} = {}): ButtonBuilder {
		const nextButton = new ButtonBuilder()
			.setCustomId(this.nextPageButtonID)
			.setLabel('Next ▶')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(numPage >= this.totalPages - 1);

		onButtonPressed(this.nextPageButtonID, async (buttonInteraction) => {
			await this.updateOnNewPage({
				buttonInteraction,
				newPageNum: numPage + 1
			});
		});

		return nextButton;
	}

	/**
	 * Gets the message contents for the select menu.
	 * @returns The message contents for the select menu.
	 */
	getMessageContents(): MessageCreateOptions {
		const {
			selectMenu,
			previousButton,
			nextButton,
		} = this.getComponents();

		const selectMenuContents = {
			content: this.promptText,
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
				new ActionRowBuilder<ButtonBuilder>().addComponents(previousButton, nextButton)
			]
		}

		return selectMenuContents;
	}
}

/**
 * Represents a Discord button interface that can be created, sent to a channel, regenerated, and deleted.
 */
export class DiscordButton extends DiscordInterface {
	private promptText: string;
	private buttonLabel: string;
	private buttonStyle: ButtonStyle;

  constructor({
    promptText,
    buttonLabel,
    buttonStyle = ButtonStyle.Primary,
    buttonID,
  }: {
    promptText: string;
    buttonLabel: string;
    buttonStyle?: ButtonStyle; // optional
    buttonID: string;
  }) {
		super({
			id: buttonID ?? `button-${createRandomUUID()}`,
		});

    this.promptText = promptText;
    this.buttonLabel = buttonLabel;
    this.buttonStyle = buttonStyle;
  }

	getComponents(): {button: ButtonBuilder} {
		const button = new ButtonBuilder()
			.setCustomId(this.id)
			.setLabel(this.buttonLabel)
			.setStyle(this.buttonStyle);

		return {
			button,
		};
	}

	getMessageContents(): MessageCreateOptions {
		const {button} = this.getComponents();

		return {
			content: this.promptText,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(button)
			]
		};
	}
}