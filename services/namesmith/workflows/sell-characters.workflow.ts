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
	invalidAmountUsage: null,
});

/**
 * If amount is given, charactersSelling must name exactly one distinct character; the sale then repeats that character amount times instead of using charactersSelling literally.
 * @param root0 - The sale details.
 * @param root0.player - The player selling characters.
 * @param root0.charactersSelling - The characters to sell.
 * @param root0.amount - If given, sell this many of the single character named in charactersSelling instead of using charactersSelling literally.
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

		return result.failure.invalidAmountUsage();
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

	if (!playerService.hasTokens(playerResolvable, tokensEarned))
		return undoResult.failure.cannotAffordUndo();

	const { newInventory, newTokenCount } = playerService.giveCharactersAndTakeTokens(playerResolvable, {
		charactersGiven: charactersSold,
		tokensTaken: tokensEarned,
	});

	return undoResult.success({ newInventory, newTokenCount });
};
