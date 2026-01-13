import { RoleRepository } from "../repositories/role.repository";
import { Role, RoleResolvable } from "../types/role.types";
import { PlayerResolvable } from "../types/player.types";
import { PlayerService } from "./player.service";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { PerkService } from "./perk.service";
import { attempt } from "../../../utilities/error-utils";
import { PlayerAlreadyHasPerkError } from "../utilities/error.utility";


/**
 * Provides methods for interacting with roles.
 */
export class RoleService {
	constructor (
		public roleRepository: RoleRepository,
		public playerService: PlayerService,
		public perkService: PerkService
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new RoleService(
			RoleRepository.fromDB(db),
			PlayerService.fromDB(db),
			PerkService.fromDB(db),
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

	doesPlayerHaveARole(player: PlayerResolvable): boolean {
		const playerID = this.playerService.resolveID(player);
		return this.roleRepository.getRoleIDOfPlayerID(playerID) !== null;
	}

	/**
	 * Assigns a role to a player.
	 * @param roleResolvable - The role to assign. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @param playerResolvable - The player to assign the role to. Can be a number (the player's ID), a string (the player's name), or a player object.
	 */
	setPlayerRole(
		roleResolvable: RoleResolvable,
		playerResolvable: PlayerResolvable,
	): void {
		const role = this.resolveRole(roleResolvable);
		const playerID = this.playerService.resolveID(playerResolvable);
		this.roleRepository.addRoleIDToPlayer(role.id, playerID);

		attempt(() =>
			role.perks.forEach((perk) =>
				this.perkService.giveToPlayer(perk, playerResolvable)
			)
		)
		.ignoreError(PlayerAlreadyHasPerkError)
		.execute();
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