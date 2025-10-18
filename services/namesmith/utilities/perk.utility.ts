import { DBPerk, Perk } from "../types/perk.types";

/**
 * Converts a DBPerk object into a Perk object.
 * This function is used when retrieving data from the database.
 * It takes a DBPerk object and returns a Perk object with the same properties but with the wasOffered property converted from a number to a boolean.
 * @param dbPerk - The DBPerk object to be converted.
 * @returns The converted Perk object.
 */
export function toPerk(dbPerk: DBPerk): Perk {
	return {
		...dbPerk,
		wasOffered: dbPerk.wasOffered === 1
	};
}