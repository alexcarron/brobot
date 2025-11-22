import { RoleRepository } from "../repositories/role.repository";
import { Role, RoleResolvable } from "../types/role.types";
import { PlayerResolvable } from "../types/player.types";
import { PlayerService } from "./player.service";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";


/**
 * Provides methods for interacting with roles.
 */
export class RoleService {
	constructor (
		public roleRepository: RoleRepository,
		public playerService: PlayerService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new RoleService(
			RoleRepository.fromDB(db),
			PlayerService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return RoleService.fromDB(db);
	}

	/**
	 * Resolves a role given its ID, name, or a role object.
	 * @param roleResolvable - The role to resolve. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns The resolved role.
	 * @throws {RoleNotFoundError} - If the role with the given ID or name is not found.
	 */
	resolveRole(roleResolvable: RoleResolvable): Role {
		return this.roleRepository.resolveRole(roleResolvable);
	}

	resolveID(roleResolvable: RoleResolvable): number {
		return this.roleRepository.resolveID(roleResolvable);
	}

	/**
	 * Checks if a role with the given ID, name, or role object exists.
	 * @param roleResolvable - The role to check. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns true if a role with the given ID or name exists, false otherwise.
	 */
	isRole(roleResolvable: RoleResolvable): boolean {
		try {
			const roleID = this.resolveID(roleResolvable);
			const role = this.roleRepository.getMinimalRoleByID(roleID);
			return role !== null;
		}
		catch {
			return false;
		}
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