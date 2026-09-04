import { ButtonStyle } from "discord.js";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { toDisplayedCharactersInline, toDisplayedTokensInline, toNewCurrentTokensSubtext } from "../../utilities/player-message.utility";
import { onUndoSellCharactersButtonPressed } from "./undo-sell-characters-message";

export const NOT_A_PLAYER_FEEDBACK = `You're not a player, so you can't sell characters.`;
export const INVALID_USAGE_OF_AMOUNT_PARAMETER_FEEDBACK = `You can only use "amount" when "characters-selling" is a single character.`;
export const MISSING_CHARACTERS_FEEDBACK = (missingCharacters: string) => `You don't have these characters to sell: ${toDisplayedCharactersInline(missingCharacters)}`;
export const SELL_CHARACTERS_CONFIRMATION_FEEDBACK = (
	{ charactersSold, tokensEarned, newTokenCount }: {
		charactersSold: string,
		tokensEarned: number,
		newTokenCount: number,
	}
) => joinLines(
	`You sell ${toDisplayedCharactersInline(charactersSold)} for ${toDisplayedTokensInline(tokensEarned)}.`,
	toNewCurrentTokensSubtext(newTokenCount),
);
export const UNDO_SELL_CHARACTERS_LABEL = `Undo`;

export function getSellCharactersConfirmationText(
	{ charactersSold, tokensEarned, newTokenCount }: {
		charactersSold: string,
		tokensEarned: number,
		newTokenCount: number,
	}
): string {
	return SELL_CHARACTERS_CONFIRMATION_FEEDBACK({ charactersSold, tokensEarned, newTokenCount });
}

export function getSellCharactersConfirmationDiscordButton(
	{ charactersSold, tokensEarned, newTokenCount, playerID }: {
		charactersSold: string,
		tokensEarned: number,
		newTokenCount: number,
		playerID: string,
	}
): DiscordButton {
	return new DiscordButton({
		promptText: getSellCharactersConfirmationText({ charactersSold, tokensEarned, newTokenCount }),
		id: `undo-sell-characters-${playerID}`,
		label: UNDO_SELL_CHARACTERS_LABEL,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onUndoSellCharactersButtonPressed({ buttonInteraction, charactersSold, tokensEarned });
		},
	});
}
