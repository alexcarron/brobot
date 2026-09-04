import { ButtonInteraction } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { undoSellCharacters } from "../../workflows/sell-characters.workflow";
import { toDisplayedCharactersInline, toNewCurrentInventorySubtext, toNewCurrentTokensSubtext } from "../../utilities/player-message.utility";

export const NOT_A_PLAYER_UNDO_FEEDBACK = `You're not a player, so this can't be undone.`;
export const CANNOT_AFFORD_UNDO_FEEDBACK = `You no longer have enough tokens to undo this.`;

export const UNDO_SELL_CHARACTERS_CONFIRMATION_FEEDBACK = (
	{ charactersSold, newInventory, newTokenCount }: {
		charactersSold: string,
		newInventory: string,
		newTokenCount: number,
	}
) => joinLines(
	`You undo selling ${toDisplayedCharactersInline(charactersSold)}.`,
	toNewCurrentInventorySubtext(newInventory),
	toNewCurrentTokensSubtext(newTokenCount),
);

export const UNDO_SELL_CHARACTERS_BUTTON_LABEL = `Undo`;

function getUndoConfirmationText(
	{ charactersSold, newInventory, newTokenCount }: {
		charactersSold: string,
		newInventory: string,
		newTokenCount: number,
	}
): string {
	return UNDO_SELL_CHARACTERS_CONFIRMATION_FEEDBACK({ charactersSold, newInventory, newTokenCount });
}

export async function onUndoSellCharactersButtonPressed(
	{ buttonInteraction, charactersSold, tokensEarned }: {
		buttonInteraction: ButtonInteraction,
		charactersSold: string,
		tokensEarned: number,
	}
) {
	const playerID = buttonInteraction.user.id;
	const result = undoSellCharacters({ player: playerID, charactersSold, tokensEarned });

	if (result.isNotAPlayer())
		return await replyToInteraction(buttonInteraction, NOT_A_PLAYER_UNDO_FEEDBACK);

	if (result.isCannotAffordUndo())
		return await replyToInteraction(buttonInteraction, CANNOT_AFFORD_UNDO_FEEDBACK);

	const { newInventory, newTokenCount } = result;

	return await replyToInteraction(buttonInteraction,
		getUndoConfirmationText({ charactersSold, newInventory, newTokenCount })
	);
}
