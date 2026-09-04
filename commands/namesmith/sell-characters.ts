import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { sellCharacters } from "../../services/namesmith/workflows/sell-characters.workflow";
import { EMPTY_INVENTORY_FEEDBACK, getSellCharactersConfirmationDiscordButton, INVALID_USAGE_OF_AMOUNT_PARAMETER_FEEDBACK, MISSING_CHARACTERS_FEEDBACK, NOT_A_PLAYER_FEEDBACK } from "../../services/namesmith/interfaces/sell-characters/sell-characters-message";
import { getSetOfCharacters } from "../../utilities/string-checks-utils";
import { sortCharactersForDisplay, toDisplayedDollars } from "../../services/namesmith/utilities/player-message.utility";
import { replyToInteraction } from "../../utilities/discord/interaction-reply-utils";

const Parameters = Object.freeze({
	CHARACTERS_SELLING: new Parameter({
		type: ParameterTypes.STRING,
		name: "characters-selling",
		description: "The characters to sell.",
		autocomplete: ({ enteredValue, user }) => {
			const { playerService, characterService } = getNamesmithServices();

			if (!playerService.isPlayer(user.id)) {
				return [{
					name: NOT_A_PLAYER_FEEDBACK,
					value: "",
				}];
			}

			const inventory = playerService.getInventory(user.id);
			const distinctInventoryCharacters = Array.from(getSetOfCharacters(inventory));

			if (distinctInventoryCharacters.length === 0) {
				return [{
					name: EMPTY_INVENTORY_FEEDBACK,
					value: "",
				}];
			}

			const distinctInventoryCharactersSortedBySellValue = sortCharactersForDisplay(distinctInventoryCharacters)
				.sort((character1, character2) =>
					characterService.getSellValue(character2) - characterService.getSellValue(character1)
				);

			const matchingInventoryCharacters = enteredValue === ''
				? distinctInventoryCharactersSortedBySellValue
				: distinctInventoryCharactersSortedBySellValue.filter(character => character.includes(enteredValue));

			const matchingInventoryCharacterOptions = matchingInventoryCharacters.map(character => ({
				name: `${character} - ${toDisplayedDollars(characterService.getSellValue(character))}`,
				value: character,
			}));

			const hasTypedComboNotAlreadySuggested =
				enteredValue !== '' &&
				!distinctInventoryCharacters.includes(enteredValue);

			if (!hasTypedComboNotAlreadySuggested)
				return matchingInventoryCharacterOptions;

			const typedComboOption = {
				name: `Sell "${enteredValue}" exactly as typed`,
				value: enteredValue,
			};

			return [typedComboOption, ...matchingInventoryCharacterOptions];
		},
	}),
	AMOUNT: new Parameter({
		type: ParameterTypes.NUMBER,
		name: "amount",
		description: "Sell this many of a single character enetered",
		isRequired: false,
		min_value: 1,
	}),
});

export const command = new SlashCommand({
	name: "sell-characters",
	description: "Sell characters from your inventory for tokens",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.SELL_CHARACTERS],
	parameters: [
		Parameters.CHARACTERS_SELLING,
		Parameters.AMOUNT,
	],
	execute: async function execute(interaction, { charactersSelling, amount }) {
		const playerID = interaction.user.id;

		const result = sellCharacters({
			player: interaction.user.id,
			charactersSelling,
			amount: amount === null || amount === undefined ? undefined : amount,
		});

		if (result.isNotAPlayer())
			return NOT_A_PLAYER_FEEDBACK;

		if (result.isInvalidUsageOfAmountParameter())
			return INVALID_USAGE_OF_AMOUNT_PARAMETER_FEEDBACK;

		if (result.isMissingCharacters()) {
			const { missingCharacters } = result;
			return MISSING_CHARACTERS_FEEDBACK(missingCharacters);
		}

		const { charactersSold, tokensEarned, newTokenCount } = result;

		const confirmationMessage = getSellCharactersConfirmationDiscordButton({
			charactersSold, tokensEarned, newTokenCount, playerID
		});

		await replyToInteraction(interaction, confirmationMessage.getMessageContents());
	}
});
