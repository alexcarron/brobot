import { Override, WithOptional } from '../../../utilities/types/generic-types';
export type Perk = {
	id: number;
	name: string;
	description: string;
	wasOffered: boolean;
}

export type DBPerk = Override<Perk, {
	wasOffered: 0 | 1
}>

export type PerkDefintion = WithOptional<Perk, 'id' | 'wasOffered'>;

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