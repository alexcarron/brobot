import { getAnticipatedRandomNum } from "../../../utilities/random-utils";
import { MIN_TOKENS_FOR_MINING as MIN_TOKENS_FROM_MINING, MINING_EXPECTED_VALUE as AVERAGE_TOKENS_FROM_MINING } from "../constants/namesmith.constants";
import { Perks } from "../constants/perks.constants";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		tokensEarned: number,
		newTokenCount: number,
		hasMineBonusPerk: boolean,
	}>(),

	nonPlayerMined: null
})

/**
 * gives tokens to a player for mining.
 * @param params - The parameters for the function.
 * @param params.playerService The player service.
 * @param params.perkService The perk service.
 * @param params.playerMining The player that is mining.
 * @returns A result object containing the amount of tokens earned and the new token count of the player.
 * - NonPlayerMined failure object if the provided player is not a valid player.
 */
export const mineTokens = (
	{playerService, perkService, playerMining}: {
		playerService: PlayerService,
		perkService: PerkService,
		playerMining: PlayerResolvable,
	}
) => {
	if (!playerService.isPlayer(playerMining)) {
		return result.failure.nonPlayerMined();
	}

	let tokensEarned = Math.round(getAnticipatedRandomNum({
		expectedValue: AVERAGE_TOKENS_FROM_MINING,
		minimumValue: MIN_TOKENS_FROM_MINING
	}));

	perkService.doIfPlayerHas(Perks.MINE_BONUS, playerMining, () => {
		tokensEarned += 1;
	});

	playerService.giveTokens(playerMining, tokensEarned);

	const newTokenCount = playerService.getTokens(playerMining);

	return result.success({
		tokensEarned,
		newTokenCount,
		hasMineBonusPerk: perkService.doesPlayerHave(Perks.MINE_BONUS, playerMining),
	});
}