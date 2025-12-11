import { Perk, PerkDefintion } from "../../types/perk.types";
import { PerkRepository } from '../../repositories/perk.repository';
import { DatabaseQuerier } from "../../database/database-querier";
import { PerkAlreadyExistsError } from "../../utilities/error.utility";
import { getRandomNameUUID } from "../../../../utilities/random-utils";

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