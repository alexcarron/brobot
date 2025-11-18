import { DBPerk, Perk } from "../types/perk.types";
import { fromDBBoolean as fromDBBool, toDBBool } from "./db.utility";

/**
 * Converts a DBPerk object into a Perk object.
 * @param dbPerk - The DBPerk object to be converted.
 * @returns The converted Perk object.
 */
export function toPerk(dbPerk: DBPerk): Perk {
	return {
		...dbPerk,
		wasOffered: fromDBBool(dbPerk.wasOffered),
		isBeingOffered: fromDBBool(dbPerk.isBeingOffered),
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
		wasOffered: toDBBool(perk.wasOffered),
		isBeingOffered: toDBBool(perk.isBeingOffered),
	}
}