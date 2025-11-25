import { object, number, string, ExtractDomainType } from '../../../utilities/runtime-types-utils';
import { WithOptional } from '../../../utilities/types/generic-types';
import { DBBoolean } from '../utilities/db.utility';

const DBPerkType = object.asTransformableType('Perk', {
	id: number,
	name: string,
	description: string,
	wasOffered: DBBoolean,
	isBeingOffered: DBBoolean,
});
export const asDBPerk = DBPerkType.from;
export const asDBPerks = DBPerkType.fromAll;
export const toPerk = DBPerkType.toPerk;
export const toPerks = DBPerkType.toPerks;
export type Perk = ExtractDomainType<typeof DBPerkType>

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