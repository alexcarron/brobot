import { toNullOnError } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { DBRole, MinimalRole, RoleID } from "../types/role.types";
import { RoleNotFoundError } from "../utilities/error.utility";

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
}