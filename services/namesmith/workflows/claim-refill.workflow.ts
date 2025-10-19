
import { PlayerResolvable } from '../types/player.types';
import { PlayerService } from '../services/player.service';
import { AVERAGE_TOKENS_FROM_REFILLING, MIN_TOKENS_FROM_REFILLING, REFILL_COOLDOWN_HOURS } from '../constants/namesmith.constants';
import { getAnticipatedRandomNum } from '../../../utilities/random-utils';
import { addHours } from '../../../utilities/date-time-utils';
import { getWorkflowResultCreator, provides } from './workflow-result-creator';
import { PerkService } from '../services/perk.service';
import { Perks } from '../constants/perks.constants';

const result = getWorkflowResultCreator({
	success: provides<{
		baseTokensEarned: number,
		newTokenCount: number,
		nextRefillTime: Date,
		tokensFromRefillBonus: number,
	}>(),

	nonPlayerRefilled: null,
	refillAlreadyClaimed: provides<{
		nextRefillTime: Date
	}>(),
});

/**
 * gives tokens to a player for refilling.
 * @param params - The parameters for the function.
 * @param params.playerService The player service.
 * @param params.perkService The perk service.
 * @param params.playerRefilling The player that is refilling.
 * @returns An object containing the amount of tokens earned and the new token count of the player.
 * - RefillAlreadyClaimedError if the player has already claimed a refill.
 * - NonPlayerRefilledError if the provided player is not a valid player.
 */
export const claimRefill = (
	{playerService, perkService, playerRefilling}: {
		playerService: PlayerService,
		perkService: PerkService,
		playerRefilling: PlayerResolvable,
	}
) => {
	if (!playerService.isPlayer(playerRefilling)) {
		return result.failure.nonPlayerRefilled();
	}

	let newLastRefillTime = new Date();
	if (!playerService.canRefill(playerRefilling)) {
		const nextRefillTime = playerService.getNextAvailableRefillTime(playerRefilling);
		return result.failure.refillAlreadyClaimed({ nextRefillTime });
	}

	// Calculate tokens earned from refill
	let totalTokensEarned = 0;
	let baseTokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_REFILLING,
		minimumValue: MIN_TOKENS_FROM_REFILLING
	}));

	// Handle Refill Interest perk
	perkService.doIfPlayerHas(Perks.REFILL_INTEREST, playerRefilling, () => {
		const currentTokenCount = playerService.getTokens(playerRefilling);

		baseTokensEarned = Math.round(getAnticipatedRandomNum({
			expectedValue: currentTokenCount * 0.10,
		}))
	});

	totalTokensEarned += baseTokensEarned;

	// Handle Refill Bonus perk
	let tokensFromRefillBonus = 0;
	perkService.doIfPlayerHas(Perks.REFILL_BONUS, playerRefilling, () => {
		tokensFromRefillBonus = Math.floor(baseTokensEarned * 0.25);
		totalTokensEarned += tokensFromRefillBonus;
	});

	playerService.giveTokens(playerRefilling, totalTokensEarned);

	// Set new last refill time
	perkService.doIfPlayerHas(Perks.FASTER_REFILL, playerRefilling, () => {
		newLastRefillTime = addHours(newLastRefillTime, -1);
	})

	playerService.setLastRefillTime(playerRefilling, newLastRefillTime);

	const newTokenCount = playerService.getTokens(playerRefilling);
	const nextRefillTime = addHours(newLastRefillTime, REFILL_COOLDOWN_HOURS);

	return result.success({
		baseTokensEarned,
		newTokenCount,
		nextRefillTime,
		tokensFromRefillBonus,
	});
}