import { ButtonInteraction, ButtonStyle, MessageCreateOptions, StringSelectMenuInteraction } from "discord.js";
import { DiscordSelectMenuOption } from "../constants/discord-interface.constants";
import { DiscordInterface } from "./discord-interface";
import { InvalidArgumentError } from "../error-utils";
import { isStrings } from "../types/type-guards";
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { doOnMenuOptionSelected } from "../../event-listeners/on-menu-option-selected";
import { doOnButtonPressed } from "../../event-listeners/on-button-pressed";

export const NUM_OPTIONS_PER_SELECT_MENU = 25;

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
			menuID: string,
			options:
				| string[]
				| {label: string; value: string}[],
			onOptionSelected: (interaction: StringSelectMenuInteraction) => Promise<void>,
		}
	) {
		super({
			id: menuID
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
		return Math.ceil(this.options.length / NUM_OPTIONS_PER_SELECT_MENU);
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
			numPage * NUM_OPTIONS_PER_SELECT_MENU,
			(numPage + 1) * NUM_OPTIONS_PER_SELECT_MENU
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
		doOnMenuOptionSelected(this.id, this.onOptionSelected);
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

		doOnButtonPressed(this.perviousPageButtonID, async (buttonInteraction) => {
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

		doOnButtonPressed(this.nextPageButtonID, async (buttonInteraction) => {
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