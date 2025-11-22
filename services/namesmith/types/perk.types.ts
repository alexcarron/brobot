import { object, number, string, zeroOrOne, ExtractType } from '../../../utilities/runtime-types-utils';
import { WithOptional } from '../../../utilities/types/generic-types';
export type Perk = {
	id: number;
	name: string;
	description: string;
	wasOffered: boolean;
	isBeingOffered: boolean;
}

const dbPerkType = object.asType({
	id: number,
	name: string,
	description: string,
	wasOffered: zeroOrOne,
	isBeingOffered: zeroOrOne,
});
export const asDBPerk = dbPerkType.from;
export const asDBPerks = dbPerkType.fromAll;
export type DBPerk = ExtractType<typeof dbPerkType>;

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