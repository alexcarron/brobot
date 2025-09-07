import { getAnticipatedRandomNum } from "../../../utilities/random-utils";
import { MIN_TOKENS_FOR_MINING as MIN_TOKENS_FROM_MINING, MINING_EXPECTED_VALUE as AVERAGE_TOKENS_FROM_MINING } from "../constants/namesmith.constants";
import { PlayerService } from "../services/player.service";
import { PlayerResolvable } from "../types/player.types";
import { NonPlayerMinedError } from "../utilities/error.utility";

/**
 * gives tokens to a player for mining.
 * @param params - The parameters for the function.
 * @param params.playerService The player service.
 * @param params.playerMining The player that is mining.
 * @returns An object containing the amount of tokens earned and the new token count of the player.
 * - NonPlayerMinedError if the provided player is not a valid player.
 */
export const mineTokens = (
	{playerService, playerMining}: {
		playerService: PlayerService,
		playerMining: PlayerResolvable,
	}
) => {
	if (!playerService.isPlayer(playerMining)) {
		return new NonPlayerMinedError(playerService.resolveID(playerMining));
	}

	const tokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_MINING,
		minimumValue: MIN_TOKENS_FROM_MINING
	}));
	playerService.giveTokens(playerMining, tokensEarned);

	const newTokenCount = playerService.getTokens(playerMining);

	return {
		tokensEarned,
		newTokenCount,
	}
}