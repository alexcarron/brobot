import { Override, Without } from '../../../utilities/types/generic-types';
import { Perk, PerkID, PerkResolvable } from './perk.types';

export interface Role {
	id: number;
	name: string;
	description: string;
	perks: Perk[];
}

export type MinimalRole = Without<Role, "perks">;

export type DBRole = MinimalRole;

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