
import { PlayerResolvable } from '../types/player.types';
import { PlayerService } from '../services/player.service';
import { AVERAGE_TOKENS_FROM_REFILLING, MIN_TOKENS_FROM_REFILLING, REFILL_COOLDOWN_HOURS } from '../constants/namesmith.constants';
import { getAnticipatedRandomNum } from '../../../utilities/random-utils';
import { addHours } from '../../../utilities/date-time-utils';
import { getWorkflowResultCreator, provides } from './workflow-result-creator';

const result = getWorkflowResultCreator({
	success: provides<{
		tokensEarned: number,
		newTokenCount: number,
		nextRefillTime: Date
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
 * @param params.playerRefilling The player that is refilling.
 * @returns An object containing the amount of tokens earned and the new token count of the player.
 * - RefillAlreadyClaimedError if the player has already claimed a refill.
 * - NonPlayerRefilledError if the provided player is not a valid player.
 */
export const claimRefill = (
	{playerService, playerRefilling}: {
		playerService: PlayerService,
		playerRefilling: PlayerResolvable,
	}
) => {
	if (!playerService.isPlayer(playerRefilling)) {
		return result.failure.nonPlayerRefilled();
	}

	const now = new Date();
	if (!playerService.canRefill(playerRefilling)) {
		const nextRefillTime = playerService.getNextAvailableRefillTime(playerRefilling);
		return result.failure.refillAlreadyClaimed({ nextRefillTime });
	}

	const tokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_REFILLING,
		minimumValue: MIN_TOKENS_FROM_REFILLING
	}));
	playerService.giveTokens(playerRefilling, tokensEarned);
	playerService.setLastRefillTime(playerRefilling, now);

	const newTokenCount = playerService.getTokens(playerRefilling);
	const nextRefillTime = addHours(now, REFILL_COOLDOWN_HOURS);

	return result.success({
		tokensEarned,
		newTokenCount,
		nextRefillTime,
	});
}