import { Perk, PerkDefintion, PerkResolvable } from "../../types/perk.types";
import { PerkRepository } from '../../repositories/perk.repository';
import { DatabaseQuerier } from "../../database/database-querier";
import { PerkAlreadyExistsError } from "../../utilities/error.utility";
import { getRandomNameUUID } from "../../../../utilities/random-utils";
import { PlayerResolvable } from "../../types/player.types";
import { pickPerk } from "../../workflows/pick-perk.workflow";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { getNamesmithServices } from "../../services/get-namesmith-services";

/**
 * Adds a mock perk to the database.
 * @param db - The database to which the mock perk will be added.
 * @param perkDefinition - The definition of the perk to be added.
 * @returns The added perk object.
 * @throws Error - If a perk with the given ID already exists.
 */
export function addMockPerk(
	db: DatabaseQuerier,
	perkDefinition: Partial<PerkDefintion> = {}
): Perk {
	const perkRepository = new PerkRepository(db);

	const {
		id = undefined,
		name = getRandomNameUUID(),
		description = "",
		wasOffered = false,
		isBeingOffered = false,
	} = perkDefinition;

	if (
		id !== undefined &&
		perkRepository.getPerkByID(id) !== null
	)
		throw new PerkAlreadyExistsError(id);

	return perkRepository.addPerk({
		id,
		name,
		description,
		wasOffered,
		isBeingOffered,
	});
}

/**
 * Forces a given player to pick a given perk, overriding all checks and requirements.
 * @param playerResolvable - The player to force to pick the perk.
 * @param perkResolvable - The perk to force the player to pick.
 * @returns The result of picking the perk.
 */
export function forcePlayerToPickPerk(
	playerResolvable: PlayerResolvable,
	perkResolvable: PerkResolvable
) {
	return returnIfNotFailure(
		pickPerk({
			player: playerResolvable,
			pickedPerk: perkResolvable,
			ignoreAlreadyHasPerk: true,
			ignoreAlreadyPickedPerk: true
		})
	)
}

/**
 * Forces a given player to pick a newly created perk, overriding all checks and requirements.
 * @param playerResolvable - The player to force to pick the perk.
 * @param perkDefinition - The definition of the perk to force the player to pick.
 * @returns The result of picking the perk.
 */
export function forcePlayerToPickNewPerk(
	playerResolvable: PlayerResolvable,
	perkDefinition: WithAllOptional<PerkDefintion> = {},
) {
	const { playerService } = getNamesmithServices();
	const createdPerk = addMockPerk(playerService.playerRepository.db, perkDefinition);
	return forcePlayerToPickPerk(playerResolvable, createdPerk);
}