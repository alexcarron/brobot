import { Tips } from "../../constants/tips.constants";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TipResolvable } from "../../types/tip.types";
import { toTipLine } from "../../utilities/player-message.utility";

/**
 * Gets the tip line to show after a successful mine deeper (manual or auto-mine), if any.
 * @param userID - The ID of the player mining.
 * @param params - The parameters for the function.
 * @param params.characterDiscovered - The character discovered from this mine, if any.
 * @returns The tip line, or null if no tip should be shown.
 */
export function getDeeperMineTipLine(
	userID: string,
	{ characterDiscovered }: { characterDiscovered: string | null }
): string | null {
	const { tipService } = getNamesmithServices();

	const possibleTipKeys: TipResolvable[] = [];
	if (characterDiscovered !== null) {
		possibleTipKeys.push(Tips.CHARACTER_ODDS_IMPROVE_WITH_DEPTH.key);
	}
	possibleTipKeys.push(Tips.HOW_MINING_RISK_WORKS.key);

	const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(userID, possibleTipKeys);
	return toTipLine(tipMessage);
}

/**
 * Gets the tip line to show after a mine collapses, if any.
 * @param userID - The ID of the player mining.
 * @param params - The parameters for the function.
 * @param params.isAutoMining - Whether the collapse happened during an auto-mine loop.
 * @returns The tip line, or null if no tip should be shown.
 */
export function getCollapseTipLine(
	userID: string,
	{ isAutoMining }: { isAutoMining: boolean }
): string | null {
	const { tipService } = getNamesmithServices();

	const possibleTipKeys: TipResolvable[] = [];
	if (isAutoMining) {
		possibleTipKeys.push(Tips.AUTO_MINING_RISK_KEEPS_CLIMBING.key);
	}
	possibleTipKeys.push(Tips.MINING_HAS_NO_COOLDOWN.key);

	const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(userID, possibleTipKeys);
	return toTipLine(tipMessage);
}

/**
 * Gets the tip line to show after a player stops an auto-mine loop, if any.
 * @param userID - The ID of the player mining.
 * @returns The tip line, or null if no tip should be shown.
 */
export function getAutoMineStoppedTipLine(userID: string): string | null {
	const { tipService } = getNamesmithServices();

	const tipMessage = tipService.getAndViewFirstTipPlayerShouldSee(userID, [Tips.AUTO_MINING_RISK_KEEPS_CLIMBING.key]);
	return toTipLine(tipMessage);
}
