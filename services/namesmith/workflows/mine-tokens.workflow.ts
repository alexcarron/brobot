import { addMinutes } from "../../../utilities/date-time-utils";
import { getAnticipatedRandomNum } from "../../../utilities/random-utils";
import { MIN_TOKENS_FOR_MINING as MIN_TOKENS_FROM_MINING, MINING_EXPECTED_VALUE as AVERAGE_TOKENS_FROM_MINING } from "../constants/namesmith.constants";
import { Perks } from "../constants/perks.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		tokensEarned: number,
		newTokenCount: number,
		hasMineBonusPerk: boolean,
	}>(),

	notAPlayer: null
})

/**
 * gives tokens to a player for mining.
 * @param params - The parameters for the function.
 * @param params.playerMining The player that is mining.
 * @param params.tokenOverride The number of tokens to give the player.
 * @returns A result object containing the amount of tokens earned and the new token count of the player.
 * - NonPlayerMined failure object if the provided player is not a valid player.
 */
export const mineTokens = (
	{playerMining, tokenOverride}: {
		playerMining: PlayerResolvable,
		tokenOverride?: number
	}
) => {
	const {playerService, perkService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerMining)) {
		return result.failure.notAPlayer();
	}

	// Calculate tokens earned
	let tokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_MINING,
		minimumValue: MIN_TOKENS_FROM_MINING
	}));

	perkService.doIfPlayerHas(Perks.MINE_BONUS, playerMining, () => {
		tokensEarned += 1;
	});
	perkService.doIfPlayerHas(Perks.MINING_FOR_REFILLS, playerMining, () => {
		const lastRefillTime = playerService.getLastClaimedRefillTime(playerMining);
		if (lastRefillTime !== null) {
			const newLastRefillTime = addMinutes(lastRefillTime, -1);
			playerService.setLastClaimedRefillTime(playerMining, newLastRefillTime);
		}
	});

	if (tokenOverride !== undefined) {
		tokensEarned = tokenOverride;
	}

	// Actually give the tokens to the player
	playerService.giveTokens(playerMining, tokensEarned);

	// Log the action
	activityLogService.logMineTokens({
		playerMining,
		tokensEarned,
	});

	// Build returned result object
	const newTokenCount = playerService.getTokens(playerMining);
	return result.success({
		tokensEarned,
		newTokenCount,
		hasMineBonusPerk: perkService.doesPlayerHave(Perks.MINE_BONUS, playerMining),
	});
}