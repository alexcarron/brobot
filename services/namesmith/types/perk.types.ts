import { object, number, string } from '../../../utilities/runtime-types-utils';
import { WithOptional } from '../../../utilities/types/generic-types';
import { DBBoolean } from '../utilities/db.utility';
export type Perk = {
	id: number;
	name: string;
	description: string;
	wasOffered: boolean;
	isBeingOffered: boolean;
}

const dbPerkType = object.asRawType('Perk', {
	id: number,
	name: string,
	description: string,
	wasOffered: DBBoolean,
	isBeingOffered: DBBoolean,
});
export const asDBPerk = dbPerkType.from;
export const asDBPerks = dbPerkType.fromAll;
export const toPerk = dbPerkType.toPerk;
export const toPerks = dbPerkType.toPerks;

export type PerkDefintion = WithOptional<Perk,
	| 'id'
	| 'wasOffered'
	| 'isBeingOffered'
>;

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