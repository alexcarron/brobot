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
	playerAlreadyHasPerk: null,
})

/**
 * Attempts to pick a perk for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.player - The player to pick the perk for.
 * @param parameters.pickedPerk - The perk to be picked.
 * @param parameters.ignoreAlreadyPickedPerk - Whether to ignore if the player has already picked a perk.
 * @param parameters.ignoreAlreadyHasPerk - Whether to ignore if the player already has the perk.
 * @returns A result indicating if the perk was successfully picked or not.
 */
export function pickPerk(
	{player, pickedPerk, ignoreAlreadyPickedPerk, ignoreAlreadyHasPerk}: {
		player: PlayerResolvable,
		pickedPerk: PerkResolvable,
		ignoreAlreadyPickedPerk?: boolean,
		ignoreAlreadyHasPerk?: boolean
	}
) {
	if (ignoreAlreadyPickedPerk === undefined) ignoreAlreadyPickedPerk = false;
	if (ignoreAlreadyHasPerk === undefined) ignoreAlreadyHasPerk = false;
	const {playerService, perkService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	if (!perkService.isPerk(pickedPerk)) {
		return result.failure.perkDoesNotExist();
	}

	if (playerService.hasPickedPerk(player) && !ignoreAlreadyPickedPerk) {
		return result.failure.perkAlreadyChosen();
	}

	if (perkService.doesPlayerHave(pickedPerk, player) && !ignoreAlreadyHasPerk) {
		return result.failure.playerAlreadyHasPerk();
	}

	perkService.giveToPlayer(pickedPerk, player);
	playerService.setHasPickedPerk(player, true);

	// Handle Free Tokens perk
	let freeTokensEarned = 0;
	const pickedPerkID = perkService.resolveID(pickedPerk);
	if (pickedPerkID === Perks.FREE_TOKENS.id) {
		freeTokensEarned = 500;
		playerService.giveTokens(player, freeTokensEarned);
	}

	activityLogService.logPickPerk({
		player,
		perk: pickedPerk,
		tokensEarned: freeTokensEarned,
	});

	return result.success({
		freeTokensEarned,
	});
}

