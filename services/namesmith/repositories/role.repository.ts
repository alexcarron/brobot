import { toNullOnError } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { DBPerk, Perk } from "../types/perk.types";
import { PlayerID } from "../types/player.types";
import { DBRole, DBRolePerk, MinimalRole, Role, RoleID, RoleName } from "../types/role.types";
import { PlayerNotFoundError, RoleNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to the dynamic role data.
 */
export class RoleRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	private addPerksToMinimalRole(minimalRole: MinimalRole): Role {
		const dbRolePerks = this.db.getRows(
			"SELECT * FROM rolePerk WHERE roleID = @roleID",
			{ roleID: minimalRole.id }
		) as DBRolePerk[];

		const perks: Perk[] = [];
		for (const dbRolePerk of dbRolePerks) {
			const perkID = dbRolePerk.perkID;

			const perk = this.db.getRow(
				"SELECT * FROM perk WHERE id = @id",
				{ id: perkID }
			) as DBPerk;

			perks.push(perk);
		}

		return {
			...minimalRole,
			perks
		}
	}

	/**
	 * Returns a list of all role objects in the game without any sub-entities.
	 * @returns An array of role objects with minimal fields.
	 */
	getMinimalRoles(): MinimalRole[] {
		const minimalRoles = this.db.getRows(
			"SELECT * FROM role"
		) as DBRole[];
		return minimalRoles;
	}

	/**
	 * Returns a list of all role objects in the game.
	 * @returns An array of role objects.
	 */
	getRoles(): Role[] {
		const minimalRoles = this.getMinimalRoles();
		return minimalRoles.map(minimalRole =>
			this.addPerksToMinimalRole(minimalRole)
		);
	}

	/**
	 * Retrieves a role from the database by its ID.
	 * If no role with the given ID is found, throws a RoleNotFoundError.
	 * @param roleID - The ID of the role to retrieve.
	 * @returns The role with the given ID.
	 * @throws {RoleNotFoundError} If no role with the given ID is found.
	 */
	getMinimalRoleOrThrow(roleID: RoleID): MinimalRole {
		const role = this.db.getRow(
			"SELECT * FROM role WHERE id = @id",
			{ id: roleID }
		) as DBRole | undefined;

		if (role === undefined)
			throw new RoleNotFoundError(roleID);

		return role;
	}

	getRoleOrThrow(roleID: RoleID): Role {
		const minimalRole = this.getMinimalRoleOrThrow(roleID);
		return this.addPerksToMinimalRole(minimalRole);
	}

	/**
	 * Retrieves a role from the database by its ID, returning null if no role is found with the given ID.
	 * @param roleID - The ID of the role to retrieve.
	 * @returns The role with the given ID, or null if no role with the given ID is found.
	 */
	getMinimalRoleByID(roleID: RoleID): MinimalRole | null {
		return toNullOnError(() =>
			this.getMinimalRoleOrThrow(roleID)
		);
	}

	/**
	 * Retrieves a role from the database by its name, returning null if no role is found with the given name.
	 * @param name - The name of the role to retrieve.
	 * @returns The role with the given name, or null if no role with the given name is found.
	 */
	getMinimalRoleByName(name: RoleName): MinimalRole | null {
		const dbRole = this.db.getRow(
			"SELECT * FROM role WHERE name = @name",
			{ name }
		) as DBRole | undefined;

		return dbRole ?? null;
	}

	/**
	 * Retrieves a role from the database by its name, returning null if no role is found with the given name.
	 * @param name - The name of the role to retrieve.
	 * @returns The role with the given name, or null if no role with the given name is found.
	 */
	getRoleByName(name: RoleName): Role | null {
		const minimalRole = this.getMinimalRoleByName(name);
		if (minimalRole === null)
			return null;

		return this.addPerksToMinimalRole(minimalRole);
	}

	/**
	 * Retrieves the role ID associated with a player by their ID.
	 * If no player with the given ID is found, returns null.
	 * @param playerID - The ID of the player to retrieve the role ID of.
	 * @returns The role ID associated with the given player ID, or null if no player with the given ID is found.
	 */
	getRoleIDOfPlayerID(playerID: PlayerID): RoleID | null {
		const player = this.db.getRow(
			"SELECT * FROM player WHERE id = @id",
			{ id: playerID }
		)

		if (player === undefined)
			throw new PlayerNotFoundError(playerID);

		const roleID = this.db.getValue(
			"SELECT role FROM player WHERE id = @id",
			{ id: playerID }
		);

		return roleID as number | null;
	}

	/**
	 * Updates the role ID of a player in the database.
	 * @param roleID - The ID of the role to assign to the player.
	 * @param playerID - The ID of the player to update.
	 */
	addRoleIDToPlayer(roleID: RoleID, playerID: PlayerID) {
		const query = `
			UPDATE player
			SET role = @role
			WHERE id = @id
		`;

		this.db.run(query, {
			role: roleID,
			id: playerID
		});
	}
}