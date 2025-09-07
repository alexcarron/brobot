import { PlayerResolvable } from '../types/player.types';
import { PlayerService } from '../services/player.service';
import { NonPlayerRefilledError, RefillAlreadyClaimedError } from '../utilities/error.utility';
import { AVERAGE_TOKENS_FROM_REFILLING, MIN_TOKENS_FROM_REFILLING, REFILL_COOLDOWN_HOURS } from '../constants/namesmith.constants';
import { getAnticipatedRandomNum } from '../../../utilities/random-utils';
import { addHours } from '../../../utilities/date-time-utils';

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
		return new NonPlayerRefilledError(playerService.resolveID(playerRefilling));
	}

	const now = new Date();
	if (!playerService.canRefill(playerRefilling)) {
		return new RefillAlreadyClaimedError(
			playerService.resolvePlayer(playerRefilling),
			playerService.getNextAvailableRefillTime(playerRefilling)
		);
	}

	const tokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_REFILLING,
		minimumValue: MIN_TOKENS_FROM_REFILLING
	}));
	playerService.giveTokens(playerRefilling, tokensEarned);
	playerService.setLastRefillTime(playerRefilling, now);

	const newTokenCount = playerService.getTokens(playerRefilling);
	const nextRefillTime = addHours(now, REFILL_COOLDOWN_HOURS);

	return {
		tokensEarned,
		newTokenCount,
		nextRefillTime,
	};
}