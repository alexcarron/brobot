import { Perks } from "../constants/perks.constants";
import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Perk, PerkResolvable } from "../types/perk.types";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";


const result = getWorkflowResultCreator({
	success: provides<{
		perkBeingReplaced: Perk | null,
		freeTokensEarned: number,
	}>(),
	nonPlayer: null,
	perkDoesNotExist: null,
	playerAlreadyHasThatPerk: null,
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
	{playerService, perkService, player, pickedPerk, perksPickingFrom}: {
		playerService: PlayerService,
		perkService: PerkService,
		player: PlayerResolvable,
		pickedPerk: PerkResolvable,
		perksPickingFrom: PerkResolvable[],
	}
) {
	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayer();
	}

	if (!perkService.isPerk(pickedPerk)) {
		return result.failure.perkDoesNotExist();
	}

	if (perkService.doesPlayerHave(pickedPerk, player)) {
		return result.failure.playerAlreadyHasThatPerk();
	}

	let perkBeingReplaced = null;
	for (const possiblePerk of perksPickingFrom) {
		const wasPerkRemoved = perkService.removeIfPlayerHas(possiblePerk, player);

		if (wasPerkRemoved) {
			perkBeingReplaced = perkService.resolvePerk(possiblePerk);
		}
	}

	perkService.giveToPlayer(pickedPerk, player);

	// Handle Free Tokens perk
	let freeTokensEarned = 0;
	perkService.doIfPlayerHas(Perks.FREE_TOKENS, player, () => {
		freeTokensEarned = 500;
		playerService.giveTokens(player, freeTokensEarned);
	});

	if (perkBeingReplaced?.id === Perks.FREE_TOKENS.id) {
		freeTokensEarned = -500;
		playerService.takeTokens(player, -freeTokensEarned);
	}

	return result.success({
		perkBeingReplaced,
		freeTokensEarned,
	});
}