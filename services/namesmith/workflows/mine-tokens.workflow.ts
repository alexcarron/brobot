import { addMinutes } from "../../../utilities/date-time-utils";
import { CHARACTER_DISCOVERY_MYSTERY_BOX_ID } from "../constants/mine-tokens.constants";
import { MINE_BONUS_BONUS_TOKENS, Perks } from "../constants/perks.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import {
	doesMineCollapseAtLayer,
	getCollapseChanceAtLayer,
	getRandomTokensGivenForMine,
	getTokensKeptAfterCollapse,
	isCharacterDiscoveredAtLayer,
} from "../utilities/mine-tokens.utility";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		tokensGained: number,
		characterDiscovered: string | null,
		didCollapse: boolean,
		tokensLostFromCollapse: number | null,
		tokensKeptAfterCollapse: number | null,
		newTokenCount: number,
		hasMineBonusPerk: boolean,
		collapseChanceNextLayer: number,
	}>(),

	notAPlayer: null
})

/**
 * Performs a single mine in a player's mining session.
 * @param params - The parameters for the function.
 * @param params.player The player who is mining.
 * @param params.currentLayerNumber The layer this mine lands on (e.g. 1 for the first mine).
 * @param params.tokensMinedThisSession The tokens the player has mined so far this mining session.
 * @param params.tokenGainedOverride The number of tokens to give the player on a non-collapsing mine, overriding the randomized value.
 * @returns A result object describing the outcome of the mine.
 * - notAPlayer failure object if the provided player is not a valid player.
 */
export const mineOneLayer = (
	{ player, currentLayerNumber, tokensMinedThisSession, tokenGainedOverride }: {
		player: PlayerResolvable,
		currentLayerNumber: number,
		tokensMinedThisSession: number,
		tokenGainedOverride?: number,
	}
) => {
	const { playerService, perkService, activityLogService, mysteryBoxService } = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	const hasMineBonusPerk = perkService.doesPlayerHave(Perks.MINE_BONUS, player);

	const isPastFirstLayer = currentLayerNumber > 1;
	if (isPastFirstLayer && doesMineCollapseAtLayer(currentLayerNumber)) {
		const tokensKeptAfterCollapse = getTokensKeptAfterCollapse(tokensMinedThisSession);
		const tokensLost = tokensMinedThisSession - tokensKeptAfterCollapse;

		playerService.takeTokens(player, tokensLost);
		activityLogService.logMineTokens({
			playerMining: player,
			tokensEarned: -tokensLost,
			numLayersDeep: currentLayerNumber,
		});

		return result.success({
			tokensGained: 0,
			characterDiscovered: null,
			didCollapse: true,
			tokensLostFromCollapse: tokensLost,
			tokensKeptAfterCollapse,
			newTokenCount: playerService.getTokens(player),
			hasMineBonusPerk,
			collapseChanceNextLayer: getCollapseChanceAtLayer(currentLayerNumber + 1),
		});
	}

	let tokensGained = getRandomTokensGivenForMine(currentLayerNumber);

	perkService.doIfPlayerHas(Perks.MINE_BONUS, player, () => {
		tokensGained += MINE_BONUS_BONUS_TOKENS;
	});
	perkService.doIfPlayerHas(Perks.MINING_FOR_REFILLS, player, () => {
		const lastRefillTime = playerService.getLastClaimedRefillTime(player);
		if (lastRefillTime !== null) {
			const newLastRefillTime = addMinutes(lastRefillTime, -1);
			playerService.setLastClaimedRefillTime(player, newLastRefillTime);
		}
	});

	if (tokenGainedOverride !== undefined) {
		tokensGained = tokenGainedOverride;
	}

	let characterDiscovered: string | null = null;
	if (isCharacterDiscoveredAtLayer(currentLayerNumber)) {
		const character = mysteryBoxService.openBox(CHARACTER_DISCOVERY_MYSTERY_BOX_ID);
		characterDiscovered = character.value;
		playerService.giveCharacters(player, character.value);
	}

	playerService.giveTokens(player, tokensGained);

	activityLogService.logMineTokens({
		playerMining: player,
		tokensEarned: tokensGained,
		charactersGained: characterDiscovered ?? undefined,
		numLayersDeep: currentLayerNumber,
	});

	const newTokenCount = playerService.getTokens(player);
	return result.success({
		tokensGained,
		characterDiscovered,
		didCollapse: false,
		tokensLostFromCollapse: null,
		tokensKeptAfterCollapse: null,
		newTokenCount,
		hasMineBonusPerk,
		collapseChanceNextLayer: getCollapseChanceAtLayer(currentLayerNumber + 1),
	});
}