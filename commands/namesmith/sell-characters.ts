import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { sellCharacters } from "../../services/namesmith/workflows/sell-characters.workflow";
import { sendSellCharactersConfirmation } from "../../services/namesmith/interfaces/selling/sell-characters-message";
import { getSetOfCharacters } from "../../utilities/string-checks-utils";

const Parameters = Object.freeze({
	CHARACTERS_SELLING: new Parameter({
		type: ParameterTypes.STRING,
		name: "characters-selling",
		description: "The characters to sell. Repeat a character to sell multiple of it.",
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

			return matchingCharacters.map(character => ({
				name: `${character} — sells for ${characterService.getSellValue(character)} tokens`,
				value: character,
			}));
		},
	}),
	AMOUNT: new Parameter({
		type: ParameterTypes.NUMBER,
		name: "amount",
		description: "Sell this many of the single character above instead of typing it repeatedly",
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
		const result = sellCharacters({
			player: interaction.user.id,
			charactersSelling,
			amount: amount === null || amount === undefined ? undefined : amount,
		});

		if (result.isNotAPlayer())
			return `You're not a player, so you can't sell characters.`;

		if (result.isInvalidAmountUsage())
			return `You can only use "amount" when characters-selling names a single character.`;

		if (result.isMissingCharacters()) {
			const { missingCharacters } = result;
			return `You don't have these characters to sell: ${missingCharacters}`;
		}

		const { charactersSold, tokensEarned, newTokenCount } = result;

		await sendSellCharactersConfirmation({
			interaction,
			charactersSold,
			tokensEarned,
			newTokenCount,
		});
	}
});
