import { ExtractType, number, object, string } from '../../../utilities/runtime-types-utils';
import { Override } from '../../../utilities/types/generic-types';
import { Perk, PerkID, PerkResolvable } from './perk.types';

const DBRoleType = object.asType({
	id: number,
	name: string,
	description: string,
});
export const asMinimalRole = DBRoleType.from;
export const asMinimalRoles = DBRoleType.fromAll;
export type MinimalRole = ExtractType<typeof DBRoleType>;

export type Role =
	& MinimalRole
	& { perks: Perk[] }

export type RoleDefinition = Override<Role, {
	id?: RoleID;
	perks?: PerkResolvable[];
}>;

export type RoleID = Role["id"];
export type RoleName = Role["name"];
export type RoleResolvable =
	| RoleID
	| RoleName
	| { id: RoleID };


export type DBRolePerk = {
	roleID: RoleID;
	perkID: PerkID;
}