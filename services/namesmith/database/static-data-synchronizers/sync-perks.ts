import { toPropertyValues } from "../../../../utilities/data-structure-utils";
import { WithOptional } from "../../../../utilities/types/generic-types";
import { isDefined } from "../../../../utilities/types/type-guards";
import { PerkRepository } from "../../repositories/perk.repository";
import { PerkDefintion, Perk, asDBPerks } from "../../types/perk.types";
import { DatabaseQuerier, toPlaceholdersList } from "../database-querier";

/**
 * Syncronizes the database to match a list of data defintions of perks without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param perks - An array of perk objects to be inserted. Each perk can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export function syncPerksToDB(
	db: DatabaseQuerier,
	perks: Readonly<PerkDefintion[]>
) {
	const perkRepository = new PerkRepository(db);

	const perkIDs = toPropertyValues([...perks], "id").filter(isDefined);
	const perkNames = toPropertyValues([...perks], "name").filter(isDefined);

	const runDBTransaction = db.getTransaction((perkDefinitions: WithOptional<Perk, "id">[]) => {
		const deletePerksNotDefined = db.getQuery(`
			DELETE FROM perk
			WHERE
				id NOT IN ${toPlaceholdersList(perkIDs)}
				AND name NOT IN ${toPlaceholdersList(perkNames)}
		`);
		deletePerksNotDefined.run(...perkIDs, ...perkNames);

		const findExistingPerks = db.getQuery(`
			SELECT * FROM perk
			WHERE
				id IN ${toPlaceholdersList(perkIDs)}
				OR name IN ${toPlaceholdersList(perkNames)}
		`);
		const existingDBPerks = asDBPerks(
			findExistingPerks.getRows(
				...perkIDs, ...perkNames
			)
		);

		for (const dbPerk of existingDBPerks) {
			const perkDefintion = perkDefinitions.find(perk =>
				perk.id === dbPerk.id ||
				perk.name === dbPerk.name
			);

			if (perkDefintion === undefined)
				continue;

			perkRepository.updatePerk(perkDefintion);
		}

		const newPerkDefinitions = perkDefinitions.filter(perk =>
			!existingDBPerks.find(dbPerk =>
				dbPerk.id === perk.id ||
				dbPerk.name === perk.name
			)
		);

		for (const perkDefintion of newPerkDefinitions) {
			perkRepository.addPerk(perkDefintion);
		}
	});

	runDBTransaction(perks);
}