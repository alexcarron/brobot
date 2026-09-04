import { getCharacterDifferences } from "../../../utilities/data-structure-utils";
import { getNumUniqueCharacters } from "../../../utilities/string-checks-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";
import { telemetry } from "../telemetry/telemetry";
import { EventType } from "../telemetry/telemetry-event.types";

const result = getWorkflowResultCreator({
	success: provides<{
		charactersSold: string,
		tokensEarned: number,
		newInventory: string,
		newTokenCount: number,
	}>(),

	notAPlayer: null,
	missingCharacters: provides<{ missingCharacters: string }>(),
	invalidUsageOfAmountParameter: null,
});

/**
 * Sells characters from a player's inventory for tokens.
 * @param options - The options for selling characters.
 * @param options.player - The player selling characters.
 * @param options.charactersSelling - The characters to sell.
 * @param options.amount - The amount of the single character named in charactersSelling to sell or undefined to sell all characters in charactersSelling.
 * @returns The result of the sale.
 */
export const sellCharacters = (
	{ player: playerResolvable, charactersSelling, amount }: {
		player: PlayerResolvable;
		charactersSelling: string;
		amount?: number;
	}
) => {
	const { playerService, characterService, activityLogService } = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable))
		return result.failure.notAPlayer();

	const playerID = playerService.resolveID(playerResolvable);
	const numUniqueCharactersSelling = getNumUniqueCharacters(charactersSelling);

	if (amount !== undefined && numUniqueCharactersSelling !== 1) {
		telemetry.track({
			eventType: EventType.ACTION_BLOCKED,
			playerID,
			blockedAction: "sellCharacters",
			blockReason: "amountRequiresExactlyOneDistinctCharacter",
		});

		return result.failure.invalidUsageOfAmountParameter();
	}

	const charactersToSell = amount !== undefined
		? charactersSelling.repeat(amount)
		: charactersSelling;

	if (!playerService.hasCharacters(playerResolvable, charactersToSell)) {
		const player = playerService.resolvePlayer(playerResolvable);
		const { missingCharacters } = getCharacterDifferences(charactersToSell, player.inventory);

		telemetry.track({
			eventType: EventType.ACTION_BLOCKED,
			playerID,
			blockedAction: "sellCharacters",
			blockReason: "missingCharacters",
		});

		return result.failure.missingCharacters({
			missingCharacters: missingCharacters.join(''),
		});
	}

	const tokensEarned = characterService.getSellValueOfCharacters(charactersToSell);

	const { newInventory, newTokenCount } = playerService.takeCharactersAndGiveTokens(playerResolvable, {
		charactersTaken: charactersToSell,
		tokensGiven: tokensEarned,
	});

	activityLogService.logSellCharacters({
		playerSelling: playerResolvable,
		charactersSold: charactersToSell,
		tokensEarned,
	});

	telemetry.track({
		eventType: EventType.CHARACTERS_SOLD,
		playerID,
		charactersSold: charactersToSell,
		tokensEarned,
	});

	return result.success({
		charactersSold: charactersToSell,
		tokensEarned,
		newInventory,
		newTokenCount,
	});
};

const undoResult = getWorkflowResultCreator({
	success: provides<{
		newInventory: string,
		newTokenCount: number,
	}>(),

	notAPlayer: null,
	cannotAffordUndo: null,
});

/**
 * Undoes selling characters from a player's inventory, returning the characters and taking back the tokens earned from the sale.
 * @param options - The options for undoing the sale.
 * @param options.player - The player undoing the sale.
 * @param options.charactersSold - The characters that were sold.
 * @param options.tokensEarned - The tokens that were earned from the sale. 
 * @returns The result of the undo operation.
 */
export const undoSellCharacters = (
	{ player: playerResolvable, charactersSold, tokensEarned }: {
		player: PlayerResolvable;
		charactersSold: string;
		tokensEarned: number;
	}
) => {
	const { playerService } = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable))
		return undoResult.failure.notAPlayer();

	const playerID = playerService.resolveID(playerResolvable);

	if (!playerService.hasTokens(playerResolvable, tokensEarned)) {
		telemetry.track({
			eventType: EventType.ACTION_BLOCKED,
			playerID,
			blockedAction: "undoSellCharacters",
			blockReason: "cannotAffordUndo",
		});

		return undoResult.failure.cannotAffordUndo();
	}

	const { newInventory, newTokenCount } = playerService.giveCharactersAndTakeTokens(playerResolvable, {
		charactersGiven: charactersSold,
		tokensTaken: tokensEarned,
	});

	telemetry.track({
		eventType: EventType.CHARACTERS_SOLD_UNDONE,
		playerID,
		charactersSold,
		tokensEarned,
	});

	return undoResult.success({ newInventory, newTokenCount });
};
