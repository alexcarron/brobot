import { DBPerk, Perk } from "../types/perk.types";

/**
 * Converts a DBPerk object into a Perk object.
 * @param dbPerk - The DBPerk object to be converted.
 * @returns The converted Perk object.
 */
export function toPerk(dbPerk: DBPerk): Perk {
	return {
		...dbPerk,
		wasOffered: dbPerk.wasOffered === 1
	};
}

/**
 * Converts an array of DBPerk objects into an array of Perk objects.
 * @param dbPerks - The array of DBPerk objects to be converted.
 * @returns The converted array of Perk objects.
 */
export function toPerks(dbPerks: DBPerk[]): Perk[] {
	return dbPerks.map(toPerk);
}

/**
 * Converts a full Perk object into a DBPerk object.
 * @param perk - The Perk object to be converted.
 * @returns The converted DBPerk object.
 */
export function toDBPerk(perk: Perk): DBPerk {
	return {
		...perk,
		wasOffered: perk.wasOffered ? 1 : 0
	}
}

/**
 * Converts a boolean indicating if a perk was offered into a DBPerk compatible value.
 * @param wasOffered - The boolean indicating if the perk was offered.
 * @returns The converted value.
 */
export function toDBWasOffered(wasOffered: Perk['wasOffered']): 1 | 0 {
	return wasOffered ? 1 : 0
}