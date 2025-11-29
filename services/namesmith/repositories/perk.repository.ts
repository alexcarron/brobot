import { toNullOnError } from "../../../utilities/error-utils";
import { Override, WithAtLeast } from "../../../utilities/types/generic-types";
import { isNumber, isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { Perk, PerkDefintion, PerkID, PerkName, PerkResolvable, toPerk, toPerks } from "../types/perk.types";
import { PlayerID } from "../types/player.types";
import { RoleID } from "../types/role.types";
import { toDBBool, toOptionalDBBool } from "../utilities/db.utility";
import { PerkAlreadyExistsError, PerkNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to the dynamic perk data.
 */
export class PerkRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new PerkRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return PerkRepository.fromDB(db);
	}

	/**
	 * Returns a list of all perk objects in the game.
	 * @returns An array of perk objects.
	 */
	getPerks(): Perk[] {
		const rows = this.db.getRows('SELECT * FROM perk');
		return toPerks(rows);
	}

	/**
	 * Retrieves a perk by its ID. If the perk does not exist, an error will be thrown.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns The perk object if found.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	getPerkOrThrow(perkID: PerkID): Perk {
		const row = this.db.getRow(
			'SELECT * FROM perk WHERE id = ?', perkID
		);

		if (row === undefined)
			throw new PerkNotFoundError(perkID);

		return toPerk(row);
	}

	/**
	 * Retrieves a perk by its name. If the perk does not exist, an error will be thrown.
	 * @param name - The name of the perk to be retrieved.
	 * @returns The perk object if found.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	getPerkByNameOrThrow(name: PerkName): Perk {
		const maybeRow = this.db.getRow(
			'SELECT * FROM perk WHERE name = ?', name
		);

		if (maybeRow === undefined)
			throw new PerkNotFoundError(name);

		return toPerk(maybeRow);
	}

	/**
	 * Retrieves a perk by its ID.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns The perk object if found, otherwise null.
	 */
	getPerkByID(perkID: PerkID): Perk | null {
		return toNullOnError(() =>
			this.getPerkOrThrow(perkID)
		);
	}

	/**
	 * Retrieves a perk by its name.
	 * @param name - The name of the perk to be retrieved.
	 * @returns The perk object if found, otherwise null.
	 */
	getPerkByName(name: string): Perk | null {
		const row = this.db.getRow(
			"SELECT * FROM perk WHERE name = @name",
			{ name }
		);

		if (row === undefined)
			return null;

		return toPerk(row);
	}

	/**
	 * Resolves a perk ID, perk name, or perk object to a fetched Perk object.
	 * @param perkResolvable - The perk to be resolved.
	 * @throws PerkNotFoundError - If the provided perkResolvable is a string that does not correspond to a perk in the database.
	 * @returns The resolved perk object.
	 */
	resolvePerk(perkResolvable: PerkResolvable): Perk {
		if (isNumber(perkResolvable)) {
			const perkID = perkResolvable;
			return this.getPerkOrThrow(perkID);
		}
		else if (isString(perkResolvable)) {
			const perkName = perkResolvable;
			const maybePerk = this.getPerkByName(perkName);

			if (maybePerk === null)
				throw new PerkNotFoundError(perkName);

			const perk = maybePerk;
			return perk;
		}
		else {
			const perk = perkResolvable;
			return this.getPerkOrThrow(perk.id);
		}
	}

	/**
	 * Resolves a perk ID, perk name, or perk object to a perk ID.
	 * @param perkResolvable - The perk to be resolved.
	 * @returns The resolved perk ID.
	 */
	resolveID(perkResolvable: PerkResolvable): number {
		if (isNumber(perkResolvable)) {
			return perkResolvable;
		}
		else if (isString(perkResolvable)) {
			const perk = this.resolvePerk(perkResolvable);
			return perk.id;
		}
		else {
			return perkResolvable.id;
		}
	}

	/**
	 * Checks if a perk with the given ID or name exists in the database.
	 * @param idOrName - The ID or name of the perk to be checked for.
	 * @returns A boolean indicating if the perk exists in the database.
	 */
	doesPerkExist(idOrName: PerkID | PerkName): boolean {
		if (isNumber(idOrName)) {
			const id = idOrName;
			return this.db.doesExistInTable('perk', { id });
		}
		else {
			const name = idOrName;
			return this.db.doesExistInTable('perk', { name });
		}
	}

	/**
	 * Adds a perk to the database.
	 * If the perk does not have an ID, a new perk is created and its ID is returned.
	 * If the perk does have an ID, it is updated with the given information.
	 * @param perkDefinition - The perk to be added to the database.
	 * @returns The added perk object.
	 */
	addPerk(perkDefinition: PerkDefintion): Perk {
		if (this.doesPerkExist(perkDefinition.name))
			throw new PerkAlreadyExistsError(perkDefinition.name);

		let id = perkDefinition.id;
		if (id !== undefined) {
			if (this.doesPerkExist(id))
				throw new PerkAlreadyExistsError(id);
		}

		const dbPerk = {
			...perkDefinition,
			wasOffered: toDBBool(perkDefinition.wasOffered),
			isBeingOffered: toDBBool(perkDefinition.isBeingOffered),
		};

		id = this.db.insertIntoTable('perk', dbPerk);
		return this.getPerkOrThrow(id);
	}

	/**
	 * Updates a perk in the database.
	 * If the perk does not have an ID, an error will be thrown.
	 * If the perk does have an ID, it is updated with the given information.
	 * If the perk does not have a name, an error will be thrown.
	 * If the perk does have a name, it is updated with the given information.
	 * @param perkDefinition - The perk to be updated in the database.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 * @throws InvalidArgumentError - If an ID or name must be provided.
	 * @returns The updated perk object.
	 */
	updatePerk(
		perkDefinition:
			| WithAtLeast<PerkDefintion, 'id'>
			| WithAtLeast<PerkDefintion, 'name'>
	): Perk {
		const {id, name} = perkDefinition;
		const updatingFields = {
			...perkDefinition,
			wasOffered: toOptionalDBBool(perkDefinition.wasOffered),
			isBeingOffered: toOptionalDBBool(perkDefinition.isBeingOffered)
		}

		if (id !== undefined) {
			if (!this.doesPerkExist(id))
				throw new PerkNotFoundError(id);
		}
		else if (name !== undefined) {
			if (!this.doesPerkExist(name))
				throw new PerkNotFoundError(name);
		}

		this.db.updateInTable('perk', {
			fieldsUpdating: updatingFields,
			identifiers: { id, name }
		});

		if (id !== undefined) {
			return this.getPerkOrThrow(id);
		}
		else {
			return this.getPerkByNameOrThrow(name!);
		}
	}

	/**
	 * Removes a perk from the database.
	 * If the perk does not exist, an error will be thrown.
	 * @param {PerkID} id - The ID of the perk to be removed.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	removePerk(id: PerkID) {
		const result = this.db.deleteFromTable('perk', { id });

		if (result.changes === 0)
			throw new PerkNotFoundError(id);
	}

	/**
	 * Retrieves a list of player IDs that have a perk with the given ID.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns An array of player IDs that have the perk with the given ID.
	 */
	getIDsofPlayersWithPerkID(perkID: PerkID): string[] {
		const query = `
			SELECT playerID FROM playerPerk
			WHERE perkID = @perkID
		`;
		const getPlayersWithPerkID = this.db.prepare(query);
		const rows = getPlayersWithPerkID.all({ perkID }) as { playerID: string }[];
		return rows.map(row => row.playerID);
	}

	/**
	 * Retrieves a list of perk IDs that a player with the given ID has.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns An array of perk IDs that the player with the given ID has.
	 */
	getPerkIDsOfPlayerID(playerID: PlayerID): PerkID[] {
		const query = `
			SELECT perkID FROM playerPerk
			WHERE playerID = @playerID
		`;
		const getPerksOfPlayer = this.db.prepare(query);
		const rows = getPerksOfPlayer.all({ playerID }) as { perkID: number }[];
		return rows.map(row => row.perkID);
	}

	/**
	 * Retrieves a list of perk objects that a player with the given ID has.
	 * @param playerID - The ID of the player to be retrieved.
	 * @returns An array of perk objects that the player with the given ID has.
	 */
	getPerksOfPlayerID(playerID: PlayerID): Perk[] {
		const rows = this.db.getRows(
			`SELECT *
				FROM playerPerk
				JOIN perk ON playerPerk.perkID = perk.id
				WHERE playerID = @playerID`,
			{ playerID }
		);

		return toPerks(rows);
	}

	/**
	 * Adds a perk ID to a player ID in the database.
	 * @param perkID - The ID of the perk to be added.
	 * @param playerID - The ID of the player to have the perk added.
	 */
	addPerkIDToPlayer(perkID: PerkID, playerID: PlayerID) {
		const query = `
			INSERT INTO playerPerk (playerID, perkID)
			VALUES (@playerID, @perkID)
		`;
		this.db.run(query, { playerID, perkID });
	}

	/**
	 * Removes all perks from a player with the given ID.
	 * @param playerID - The ID of the player to have their perks removed.
	 */
	removePerksFromPlayerID(playerID: PlayerID) {
		const query = `
			DELETE FROM playerPerk
			WHERE playerID = @playerID
		`;
		this.db.run(query, { playerID });
	}

	/**
	 * Removes a perk ID from a player ID in the database.
	 * @param perkID - The ID of the perk to be removed.
	 * @param playerID - The ID of the player to have the perk removed.
	 */
	removePerkIDFromPlayer(perkID: PerkID, playerID: PlayerID) {
		const query = `
			DELETE FROM playerPerk
			WHERE playerID = @playerID AND perkID = @perkID
		`;
		this.db.run(query, { playerID, perkID });
	}

	getPerkIDsOfRoleID(roleID: RoleID): PerkID[] {
		const query = `
			SELECT perkID FROM rolePerk
			WHERE roleID = @roleID
		`;
		const getPerksOfRole = this.db.prepare(query);
		const rows = getPerksOfRole.all({ roleID }) as { perkID: number }[];
		return rows.map(row => row.perkID);
	}

	getPerksOfRoleID(roleID: RoleID): Perk[] {
		const rows = this.db.getRows(
			`SELECT *
				FROM rolePerk
				JOIN perk ON rolePerk.perkID = perk.id
				WHERE roleID = @roleID`,
			{ roleID }
		);

		return toPerks(rows);
	}

	/**
	 * Adds a perk ID to a role ID in the database.
	 * @param perkID - The ID of the perk to be added.
	 * @param roleID - The ID of the role to have the perk added.
	 */
	addPerkIDToRole(perkID: PerkID, roleID: RoleID): void {
		const query = `
			INSERT INTO rolePerk (roleID, perkID)
			VALUES (@roleID, @perkID)
		`;
		this.db.run(query, { roleID, perkID });
	}

	/**
	 * Removes all perks from a role with the given ID.
	 * @param roleID - The ID of the role to have their perks removed.
	 */
	removePerksFromRoleID(roleID: RoleID): void {
		const query = `
			DELETE FROM rolePerk
			WHERE roleID = @roleID
		`;
		this.db.run(query, { roleID });
	}

	/**
	 * Retrieves whether a perk with the given ID was offered.
	 * @param perkID - The ID of the perk to be retrieved.
	 * @returns A boolean indicating whether the perk with the given ID was offered.
	 */
	getWasOffered(perkID: PerkID): boolean {
		const perk = this.getPerkOrThrow(perkID);
		return perk.wasOffered;
	}

	/**
	 * Sets whether a perk with the given ID was offered.
	 * @param perkID - The ID of the perk to be updated.
	 * @param wasOffered - A boolean indicating whether the perk with the given ID was offered.
	 * @throws PerkNotFoundError - If the perk does not exist.
	 */
	setWasOffered(perkID: PerkID, wasOffered: boolean) {
		const query = `
			UPDATE perk
			SET wasOffered = @wasOffered
			WHERE id = @id
		`;

		const runResult = this.db.run(query, {
			wasOffered: wasOffered ? 1 : 0,
			id: perkID
		});

		if (runResult.changes === 0)
			throw new PerkNotFoundError(perkID);
	}

	/**
	 * Retrieves a list of perk objects that have not been offered yet.
	 * @returns An array of perk objects that have not been offered yet.
	 */
	getPerksNotYetOffered(): Override<Perk, { wasOffered: false }>[] {
		const rows = this.db.getRows(
			`SELECT * FROM perk
			WHERE wasOffered = 0`
		);

		return toPerks(rows) as Override<Perk, { wasOffered: false }>[];
	}

	/**
	 * Sets whether all perks have been offered.
	 * @param wasOffered - A boolean indicating whether all perks have been offered.
	 */
	setWasOfferedForAllPerks(wasOffered: boolean) {
		const query = `
			UPDATE perk
			SET wasOffered = @wasOffered
		`;
		this.db.run(query, { wasOffered: wasOffered ? 1 : 0 });
	}

	/**
	 * Marks a perk as currently offered.
	 * @param perkID - The ID of the perk to be marked as currently offered.
	 * @throws PerkNotFoundError - If the perk with the given ID does not exist.
	 */
	setPerkAsCurrentlyOffered(perkID: PerkID) {
		const result = this.db.run(
			`UPDATE perk
			SET isBeingOffered = 1
			WHERE id = @perkID`,
			{ perkID }
		);

		if (result.changes === 0)
			throw new PerkNotFoundError(perkID);
	}

	/**
	 * Unmarks all perks as currently offered.
	 */
	unsetAllPerksAsCurrentlyOffered() {
		this.db.run(
			`UPDATE perk
			SET isBeingOffered = 0`
		);
	}

	/**
	 * Checks if a perk with the given ID is currently offered.
	 * @param perkID - The ID of the perk to be checked for.
	 * @returns A boolean indicating if the perk with the given ID is currently offered.
	 */
	isCurrentlyOfferedPerk(perkID: PerkID): boolean {
		const perk = this.getPerkOrThrow(perkID);
		return perk.isBeingOffered;
	}

	/**
	 * Retrieves a list of perks that are currently offered.
	 * @returns An array of perk objects that are currently offered.
	 */
	getCurrentlyOfferedPerks(): Perk[] {
		const rows = this.db.getRows(
			`SELECT * FROM perk
			WHERE isBeingOffered = 1
			ORDER BY id ASC`
		);

		return toPerks(rows);
	}
}