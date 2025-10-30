import { Override, WithOptional } from '../../../utilities/types/generic-types';
export interface Perk {
	id: number;
	name: string;
	description: string;
	wasOffered: boolean;
}

/**
 * DBPerk represents a Perk stored in the database.
 * Currently identical to Perk but kept for semantic clarity.
 */
export type DBPerk = Override<Perk, {
	wasOffered: 0 | 1
}>

export type PerkDefintion = WithOptional<Perk, 'wasOffered'>;

export type PerkID = Perk["id"];
export type PerkName = Perk["name"];
export type PerkResolvable =
	| {id: PerkID}
	| PerkID
	| PerkName;


export type DBPlayerPerk = {
	playerID: string;
	perkID: number;
}