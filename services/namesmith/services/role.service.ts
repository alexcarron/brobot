import { RoleRepository } from "../repositories/role.repository";
import { isNumber, isString } from "../../../utilities/types/type-guards";
import { Role, RoleResolvable } from "../types/role.types";
import { RoleNotFoundError } from "../utilities/error.utility";
import { PlayerResolvable } from "../types/player.types";
import { PlayerService } from "./player.service";


/**
 * Provides methods for interacting with roles.
 */
export class RoleService {
	constructor (
		public roleRepository: RoleRepository,
		public playerService: PlayerService,
	) {}

	/**
	 * Resolves a role given its ID, name, or a role object.
	 * @param roleResolvable - The role to resolve. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns The resolved role.
	 * @throws {RoleNotFoundError} - If the role with the given ID or name is not found.
	 */
	resolveRole(roleResolvable: RoleResolvable): Role {
		if (isNumber(roleResolvable)) {
			return this.roleRepository.getRoleOrThrow(roleResolvable);
		}
		else if (isString(roleResolvable)) {
			const roleName = roleResolvable;
			const maybeRole = this.roleRepository.getRoleByName(roleName);
			if (maybeRole === null) {
				throw new RoleNotFoundError(roleName);
			}

			return maybeRole;
		}
		else {
			const roleID = roleResolvable.id;
			return this.roleRepository.getRoleOrThrow(roleID);
		}
	}

	resolveID(roleResolvable: RoleResolvable): number {
		if (isNumber(roleResolvable)) {
			const roleID = roleResolvable;
			return roleID;
		}
		else if (isString(roleResolvable)) {
			const role = this.resolveRole(roleResolvable);
			return role.id;
		}
		else {
			return roleResolvable.id;
		}
	}

	/**
	 * Checks if a role with the given ID, name, or role object exists.
	 * @param roleResolvable - The role to check. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns true if a role with the given ID or name exists, false otherwise.
	 */
	isRole(roleResolvable: RoleResolvable): boolean {
		const roleID = this.resolveID(roleResolvable);
		const role = this.roleRepository.getMinimalRoleByID(roleID);
		return role !== null;
	}

	/**
	 * Retrieves all roles from the database.
	 * @returns An array of all roles in the database.
	 */
	getRoles(): Role[] {
		return this.roleRepository.getRoles();
	}

	/**
	 * Checks if a player has a given role.
	 * @param role - The role to check. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @param player - The player to check. Can be a number (the player's ID), a string (the player's name), or a player object.
	 * @returns True if the player has the given role, false otherwise.
	 */
	doesPlayerHave(
		role: RoleResolvable,
		player: PlayerResolvable,
	): boolean {
		const roleID = this.resolveID(role);
		const playerID = this.playerService.resolveID(player);
		return this.roleRepository.getRoleIDOfPlayerID(playerID) === roleID;
	}

	/**
	 * Assigns a role to a player.
	 * @param role - The role to assign. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @param player - The player to assign the role to. Can be a number (the player's ID), a string (the player's name), or a player object.
	 */
	setPlayerRole(
		role: RoleResolvable,
		player: PlayerResolvable,
	): void {
		const roleID = this.resolveID(role);
		const playerID = this.playerService.resolveID(player);
		this.roleRepository.addRoleIDToPlayer(roleID, playerID);
	}

	/**
	 * Retrieves the role of a player.
	 * @param player - The player to retrieve the role of. Can be a number (the player's ID), a string (the player's name), or a player object.
	 * @returns The role of the player, or null if the player does not have a role.
	 */
	getRoleOfPlayer(
		player: PlayerResolvable,
	): Role | null {
		const playerID = this.playerService.resolveID(player);
		const roleID = this.roleRepository.getRoleIDOfPlayerID(playerID);

		if (roleID === null) return null;

		return this.roleRepository.getRoleOrThrow(roleID);
	}
}