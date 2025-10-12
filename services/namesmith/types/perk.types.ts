export interface Perk {
	id: number;
	name: string;
	description: string;
}

/**
 * DBPerk represents a Perk stored in the database.
 * Currently identical to Perk but kept for semantic clarity.
 */
export type DBPerk = Perk
export type PerkID = Perk["id"];
export type PerkName = Perk["name"];
export type PerkResolvable = Perk | PerkID | PerkName;