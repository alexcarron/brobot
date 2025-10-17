import { Override, Without } from '../../../utilities/types/generic-types';
import { Perk, PerkID, PerkName } from './perk.types';

export interface Role {
	id: number;
	name: string;
	description: string;
	perks: Perk[];
}

export type MinimalRole = Without<Role, "perks">;

/**
 * Represents a Role stored in the database as is.
 */
export type DBRole = MinimalRole;

/**
 * Represents a human-writable role definition used for static/test/seed data designed to be easy to read and enter by hand.
 */
export type RoleDefinition = Override<Role, {
	perks: readonly PerkName[];
}>;

export type RoleID = Role["id"];
export type RoleName = Role["name"];
export type RoleResolvable =
	| RoleID
	| RoleName
	| RoleDefinition
	| Role;


export type DBRolePerk = {
	roleID: RoleID;
	perkID: PerkID;
}