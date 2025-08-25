import { createRandomUUID } from "./random-utils";
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, Message, StringSelectMenuInteraction, TextChannel } from "discord.js";
import { InvalidArgumentError } from "./error-utils";
import { onButtonPressed } from "../event-listeners/on-button-pressed";
import { onMenuOptionSelected } from "../event-listeners/on-menu-option-selected";
import { logWarning } from "./logging-utils";

const OPTIONS_PER_SELECT_MENU = 25;

const createSelectMenuPageComponents = (
	{
		options,
		onOptionSelected = undefined,
		placeholderText = 'Choose an option',
		menuID = undefined,
		numPage = 0,
	} : {
		options:
			| string[]
			| {label: string, value: string}[],
		onOptionSelected?: (interaction: StringSelectMenuInteraction) => Promise<void>,
		placeholderText?: string,
		menuID?: string
		numPage?: number,
	}
): {
	selectMenu: StringSelectMenuBuilder,
	previousButton: ButtonBuilder,
	nextButton: ButtonBuilder,
} => {
	if (menuID === undefined)
		menuID = `select-menu-${createRandomUUID()}`;

	if (options.length === 0)
		throw new InvalidArgumentError('createSelectMenu: options must not be empty.');

	/**
	 * Checks if an options array is an array of strings or an array of option objects.
	 * @param option - The options array to check.
	 * @returns Whether the options array is an array of strings.
	 */
	function isStringOption(option:
		| string[]
		| {label: string, value: string}[]
	): option is string[] {
		return typeof option[0] === 'string';
	}

	if (isStringOption(options))
		options = options.map((option) => ({
			label: option,
			value: option
		}));

	const totalPages = Math.ceil(options.length / OPTIONS_PER_SELECT_MENU);

  const paginatedOptions = options.slice(
    numPage * OPTIONS_PER_SELECT_MENU,
    (numPage + 1) * OPTIONS_PER_SELECT_MENU
  );

	const selectMenuID = `${menuID}-${numPage}`
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(selectMenuID)
    .setPlaceholder(placeholderText)
    .addOptions(
      paginatedOptions.map((option) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(option.label)
          .setValue(option.value)
      )
    );

	if (onOptionSelected !== undefined) {
		onMenuOptionSelected(selectMenuID, onOptionSelected);
	}
	else {
		logWarning(`Select menu ${selectMenuID} has no onOptionSelected function.`);
	}

	/**
	 * Changes the page of a select menu to the page number specified by newPageNum.
	 * If newPageNum is out of range, the interaction is deferred instead.
	 * @param {ButtonInteraction} buttonInteraction - The button interaction that triggered this function.
	 * @param {number} newPageNum - The number of the page to change to.
	 */
	const changePage = async (buttonInteraction: ButtonInteraction, newPageNum: number) => {
    if (newPageNum >= 0 && newPageNum < totalPages) {
      const newComponents = createSelectMenuPageComponents({
        options,
        onOptionSelected,
        numPage: newPageNum,
        placeholderText,
        menuID,
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

	const previousButtonID = `${menuID}-prev-page`
  const previousButton = new ButtonBuilder()
      .setCustomId(previousButtonID)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(numPage === 0);
	onButtonPressed(previousButtonID, async (buttonInteraction) => {
		await changePage(buttonInteraction, numPage - 1);
	});

	const nextButtonID = `${menuID}-next-page`
	const nextButton = new ButtonBuilder()
      .setCustomId(nextButtonID)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(numPage >= totalPages - 1);
	onButtonPressed(nextButtonID, async (buttonInteraction) => {
		await changePage(buttonInteraction, numPage + 1);
	});

	return {
		selectMenu,
		previousButton,
		nextButton
	};
};

/**
 * Sends a select menu to a channel with a button to change the page.
 * @param options - The options for the select menu.
 * @param options.options - The options for the select menu.
 * @param options.inChannel - The channel to send the select menu to.
 * @param options.promptText - The prompt text to send with the select menu.
 * @param options.content - The message content to send with the select menu.
 * @param options.onOptionSelected - The function to call when an option is selected.
 * @param options.placeholderText - The text to display in the placeholder of the select menu.
 * @param options.menuID - The ID of the select menu.
 * @returns The message that is sent.
 * @example
 * const message = await sendSelectMenu({
 *   inChannel: message.channel,
 *   promptText: 'Select an option:',
 *   placeholderText: 'Select an option',
 *   menuID: 'my-select-menu',
 *   options: ['Option 1', 'Option 2', 'Option 3'],
 *   onOptionSelected: async (interaction) => {
 *     await interaction.reply(
 * 			 `You selected: ${interaction.values[0]}`
 * 		 );
 *   },
 * });
 */
export const sendSelectMenu = async (
	{inChannel, promptText, placeholderText, menuID, options, onOptionSelected}: {
		inChannel: TextChannel,
		promptText: string,
		placeholderText?: string,
		menuID?: string,
		options:
			| string[]
			| {label: string; value: string}[],
		onOptionSelected: (interaction: StringSelectMenuInteraction) => Promise<void>,
	}
): Promise<Message> => {
	const {
		selectMenu,
		previousButton,
		nextButton,
	} = createSelectMenuPageComponents({
		options,
		onOptionSelected,
		placeholderText,
		menuID
	});

	const selectMenuMessage = await inChannel.send({
		content: promptText,
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
			new ActionRowBuilder<ButtonBuilder>().addComponents(previousButton, nextButton)
		]
	});

	return selectMenuMessage;
};