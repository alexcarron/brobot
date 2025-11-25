import { InvalidArgumentError, toNullOnError } from "../../../utilities/error-utils";
import { DatabaseQuerier, toParameterORWhereClause, toParameterSetClause } from "../database/database-querier";
import { PlayerID } from "../types/player.types";
import { asMinimalRoles, MinimalRole, Role, RoleDefinition, RoleID, RoleName, RoleResolvable, asMinimalRole } from "../types/role.types";
import { PlayerNotFoundError, RoleNotFoundError } from "../utilities/error.utility";
import { WithAtLeast, WithOptional } from '../../../utilities/types/generic-types';
import { PerkRepository } from "./perk.repository";
import { isNumber, isString } from "../../../utilities/types/type-guards";
import { createMockDB } from "../mocks/mock-database";

/**
 * Provides access to the dynamic role data.
 */
export class RoleRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param perkRepository - The repository for accessing perk data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public perkRepository: PerkRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new RoleRepository(db, PerkRepository.fromDB(db));
	}

	static asMock() {
		const db = createMockDB();
		return RoleRepository.fromDB(db);
	}

	private attachExistingPerksToRole(minimalRole: MinimalRole): Role {
		const perks = this.perkRepository.getPerksOfRoleID(minimalRole.id);
		return {
			...minimalRole,
			perks
		}
	}

	/**
	 * Returns a list of all role objects in the game without any sub-entities.
	 * @returns An array of role objects with minimal fields.
	 */
	private getMinimalRole(): MinimalRole[] {
		return asMinimalRoles(
			this.db.getRows("SELECT * FROM role")
		)
	}

	/**
	 * Returns a list of all role objects in the game.
	 * @returns An array of role objects.
	 */
	getRoles(): Role[] {
		const minimalRoles = this.getMinimalRole();
		return minimalRoles.map(minimalRole =>
			this.attachExistingPerksToRole(minimalRole)
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
		const row = this.db.getRow(
			"SELECT * FROM role WHERE id = @id",
			{ id: roleID }
		);

		if (row === undefined)
			throw new RoleNotFoundError(roleID);

		return asMinimalRole(row);
	}

	getRoleOrThrow(roleID: RoleID): Role {
		const minimalRole = this.getMinimalRoleOrThrow(roleID);
		return this.attachExistingPerksToRole(minimalRole);
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
		const row = this.db.getRow(
			"SELECT * FROM role WHERE name = @name",
			{ name }
		);

		if (row === undefined) return null;

		return asMinimalRole(row);
	}

	/**
	 * Retrieves a role from the database by its name, throwing a RoleNotFoundError if no role is found with the given name.
	 * @param name - The name of the role to retrieve.
	 * @returns The role with the given name.
	 * @throws {RoleNotFoundError} If no role with the given name is found.
	 */
	getMinimalRoleByNameOrThrow(name: RoleName): MinimalRole {
		const role = this.getMinimalRoleByName(name);

		if (role === null)
			throw new RoleNotFoundError(name);

		return role;
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

		return this.attachExistingPerksToRole(minimalRole);
	}

	/**
	 * Resolves a role given its ID, name, or a role object.
	 * @param roleResolvable - The role to resolve. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns The resolved role.
	 * @throws {RoleNotFoundError} - If the role with the given ID or name is not found.
	 */
	resolveRole(roleResolvable: RoleResolvable): Role {
		if (isNumber(roleResolvable)) {
			return this.getRoleOrThrow(roleResolvable);
		}
		else if (isString(roleResolvable)) {
			const roleName = roleResolvable;
			const maybeRole = this.getRoleByName(roleName);
			if (maybeRole === null) {
				throw new RoleNotFoundError(roleName);
			}

			return maybeRole;
		}
		else {
			const roleID = roleResolvable.id;
			return this.getRoleOrThrow(roleID);
		}
	}

	/**
	 * Resolves a role ID from a given role ID, name, or role object.
	 * @param roleResolvable - The role to resolve. Can be a number (the role's ID), a string (the role's name), or a role object.
	 * @returns The resolved role ID.
	 * @throws {RoleNotFoundError} - If the role with the given ID or name is not found.
	 */
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
	 * Checks if a role with the given ID exists in the database.
	 * @param idOrName - The ID of the role to check.
	 * @returns true if a role with the given ID exists, false otherwise.
	 */
	doesRoleExist(idOrName: RoleID | RoleName): boolean {
		if (isNumber(idOrName)) {
			const id = idOrName;
			return this.db.getValue(
				'SELECT 1 FROM role WHERE id = @id LIMIT 1',
				{ id: id }
			) === 1;
		}
		else {
			const name = idOrName;
			return this.db.getValue(
				'SELECT 1 FROM role WHERE name = @name LIMIT 1',
				{ name: name }
			) === 1;
		}
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
	 * Retrieves the role of a player by their ID.
	 * @param playerID - The ID of the player to retrieve the role of.
	 * @returns The role of the player.
	 */
	getRoleOfPlayerID(playerID: PlayerID): Role | null {
		const roleID = this.getRoleIDOfPlayerID(playerID);

		if (roleID === null)
			return null;

		return this.getRoleOrThrow(roleID);
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

	/**
	 * Adds a minimal role to the database.
	 * If an ID is not provided, one will be automatically generated.
	 * @param minimalRole - The minimal role object to add.
	 * @param minimalRole.id - The ID of the role to add.
	 * @param minimalRole.name - The name of the role to add.
	 * @param minimalRole.description - The description of the role to add.
	 * @returns The added minimal role.
	 */
	private addMinimalRole(
		{ id, name, description }: WithOptional<MinimalRole, 'id'>
	): MinimalRole {
		if (id === undefined) {
			const result = this.db.run(
				`INSERT INTO role (name, description)
				VALUES (@name, @description)`,
				{ name, description }
			)
			id = Number(result.lastInsertRowid);
		}
		else {
			this.db.run(
				`INSERT INTO role (id, name, description)
				VALUES (@id, @name, @description)`,
				{ id, name, description }
			)
		}

		return { id, name, description };
	}

	addRole({ id, name, description, perks: perkResolvables = [] }:
		RoleDefinition
	): Role {
		const minimalRole = this.addMinimalRole({ id, name, description });

		for (const perkResolvable of perkResolvables) {
			const perkID = this.perkRepository.resolveID(perkResolvable);
			this.perkRepository.addPerkIDToRole(perkID, minimalRole.id);
		}

		return this.getRoleOrThrow(minimalRole.id);
	}

	/**
	 * Updates a minimal role object in the database.
	 * @param roleToUpdate - The role object to update.
	 * @param roleToUpdate.id - The ID of the role to update.
	 * @param roleToUpdate.name - The name of the role to update.
	 * @param roleToUpdate.description - The description of the role to update.
	 * @returns The updated role object.
	 * @throws {RoleNotFoundError} If the role with the given ID or name is not found.
	 * @throws {InvalidArgumentError} If neither an ID nor a name is provided.
	 */
	private updateMinimalRole(
		{id, name, description}:
			| WithAtLeast<MinimalRole, 'id'>
			| WithAtLeast<MinimalRole, 'name'>
	): MinimalRole {
		if (
			id !== undefined &&
			this.doesRoleExist(id) === false
		) {
			throw new RoleNotFoundError(id);
		}

		if (
			id === undefined &&
			name !== undefined &&
			this.doesRoleExist(name) === false
		) {
			throw new RoleNotFoundError(name);
		}


		if (name !== undefined || description !== undefined) {
			const updateQuery = `
				UPDATE role
				SET ${toParameterSetClause({ name, description })}
				WHERE ${toParameterORWhereClause({ id, name })}
			`;

			this.db.run(updateQuery, {id, name, description});
		}

		let minimalRole = null;
		if (id !== undefined)
			minimalRole = this.getMinimalRoleByID(id);

		if (minimalRole === null && name !== undefined)
			minimalRole = this.getMinimalRoleByName(name);

		if (minimalRole === null)
			throw new InvalidArgumentError("updateMinimalRole: An ID or name must be provided.");

		return minimalRole;
	}

	/**
	 * Updates a role object in the database.
	 * @param roleToUpdate - The role object to update.
	 * @param roleToUpdate.id - The ID of the role to update. If not provided, the role with the given name will be updated.
	 * @param roleToUpdate.name - The name of the role to update. If not provided, the role with the given ID will be updated.
	 * @param roleToUpdate.description - The description of the role to update.
	 * @param roleToUpdate.perks - An array of perk names to assign to the role. If not provided, the role's current perks will be kept.
	 * @returns The updated role object.
	 * @throws {RoleNotFoundError} If the role with the given ID or name is not found.
	 * @throws {InvalidArgumentError} If neither an ID nor a name is provided.
	 */
	updateRole(
		{id, name, description, perks: perkResolvables}:
			| WithAtLeast<RoleDefinition, 'id'>
			| WithAtLeast<RoleDefinition, 'name'>
	): Role {
		const minimalRole = this.updateMinimalRole({id: id!, name, description});

		if (perkResolvables !== undefined) {
			this.perkRepository.removePerksFromRoleID(minimalRole.id);

			for (const perkResolvable of perkResolvables) {
				const perkID = this.perkRepository.resolveID(perkResolvable);
				this.perkRepository.addPerkIDToRole(perkID, minimalRole.id);
			}
		}

		return this.getRoleOrThrow(minimalRole.id);
	}
}