import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { sellCharacters } from "../../services/namesmith/workflows/sell-characters.workflow";
import { getSellCharactersConfirmationDiscordButton, INVALID_USAGE_OF_AMOUNT_PARAMETER_FEEDBACK, MISSING_CHARACTERS_FEEDBACK, NOT_A_PLAYER_FEEDBACK } from "../../services/namesmith/interfaces/sell-characters/sell-characters-message";
import { getSetOfCharacters } from "../../utilities/string-checks-utils";
import { toDisplayedDollars } from "../../services/namesmith/utilities/player-message.utility";
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
					name: `You're not a player, so you can't sell characters.`,
					value: "",
				}];
			}

			const inventory = playerService.getDisplayedInventory(user.id);
			const distinctInventoryCharacters = Array.from(getSetOfCharacters(inventory));

			const matchingCharacters = enteredValue === ''
				? distinctInventoryCharacters
				: distinctInventoryCharacters.filter(character => character.includes(enteredValue));

			const autocompleteOptions = matchingCharacters.map(character => ({
				name: `${character} - ${toDisplayedDollars(characterService.getSellValue(character))}`,
				value: character,
			}));

			const firstAutocompleteOption = {
				name: enteredValue,
				value: enteredValue,
			};

			return [firstAutocompleteOption, ...autocompleteOptions];
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
