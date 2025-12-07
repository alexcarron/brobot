import { Perks } from "../constants/perks.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PerkResolvable } from "../types/perk.types";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";


const result = getWorkflowResultCreator({
	success: provides<{
		freeTokensEarned: number,
	}>(),

	notAPlayer: null,
	perkDoesNotExist: null,
	perkAlreadyChosen: null,
})

/**
 * Attempts to pick a perk for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerService - The player service to use to check if the player is valid.
 * @param parameters.perkService - The perk service to use to check if the perk is valid.
 * @param parameters.player - The player to pick the perk for.
 * @param parameters.pickedPerk - The perk to be picked.
 * @param parameters.perksPickingFrom - The perks that the player is picking from.
 * @returns A result indicating if the perk was successfully picked or not.
 */
export function pickPerk(
	{player, pickedPerk}: {
		player: PlayerResolvable,
		pickedPerk: PerkResolvable,
	}
) {
	const {playerService, perkService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	if (!perkService.isPerk(pickedPerk)) {
		return result.failure.perkDoesNotExist();
	}

	if (playerService.hasPickedPerk(player)) {
		return result.failure.perkAlreadyChosen();
	}

	perkService.giveToPlayer(pickedPerk, player);
	playerService.setHasPickedPerk(player, true);

	// Handle Free Tokens perk
	let freeTokensEarned = 0;
	perkService.doIfPlayerHas(Perks.FREE_TOKENS, player, () => {
		freeTokensEarned = 500;
		playerService.giveTokens(player, freeTokensEarned);
	});

	activityLogService.logPickPerk({
		playerPickingPerk: player,
		tokensEarned: freeTokensEarned,
	});

	return result.success({
		freeTokensEarned,
	});
}