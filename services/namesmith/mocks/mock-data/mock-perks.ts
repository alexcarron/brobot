import { WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { Perk, PerkDefintion } from "../../types/perk.types";
import { PerkRepository } from '../../repositories/perk.repository';
import { DatabaseQuerier } from "../../database/database-querier";

/**
 * Adds a mock perk to the database.
 * @param db - The database to which the mock perk will be added.
 * @param perkDefinition - The definition of the perk to be added.
 * @returns The added perk object.
 * @throws Error - If a perk with the given ID already exists.
 */
export function addMockPerk(
	db: DatabaseQuerier,
	perkDefinition: WithAtLeastOneProperty<PerkDefintion>
): Perk {
	const perkRepository = new PerkRepository(db);

	let {id} = perkDefinition;

	const {
		name = "",
		description = "",
		wasOffered = false
	} = perkDefinition;

	if (
		id !== undefined &&
		perkRepository.getPerkByID(id) !== null
	)
		throw new Error(`Perk with ID ${id} already exists!`);

	if (id === undefined) {
		const runResult = db.run(
			`INSERT INTO perk (name, description, wasOffered)
			VALUES (@name, @description, @wasOffered)`,
			{
				name,
				description,
				wasOffered: wasOffered ? 1 : 0
			}
		);

		id = Number(runResult.lastInsertRowid);
	}
	else {
		db.run(
			`INSERT INTO perk (id, name, description, wasOffered)
			VALUES (@id, @name, @description, @wasOffered)`,
			{
				id,
				name,
				description,
				wasOffered: wasOffered ? 1 : 0
			}
		);
	}

	return {
		id,
		name,
		description,
		wasOffered
	}
}