import { PerkService } from "../services/perk.service";
import { PlayerService } from "../services/player.service";
import { Perk, PerkResolvable } from "../types/perk.types";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";


const result = getWorkflowResultCreator({
	success: provides<{
		perkAlreadyPicked: Perk | null
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

	let perkAlreadyPicked = null;
	for (const possiblePerk of perksPickingFrom) {
		const wasPerkRemoved = perkService.removeIfPlayerHas(possiblePerk, player);

		if (wasPerkRemoved) {
			perkAlreadyPicked = perkService.resolvePerk(possiblePerk);
		}
	}

	perkService.giveToPlayer(pickedPerk, player);

	return result.success({perkAlreadyPicked});
}