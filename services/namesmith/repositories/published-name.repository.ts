import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { isNumber } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { PlayerID } from "../types/player.types";
import { asPublishedName, asPublishedNames, PublishedName, PublishedNameID, PublishedNameResolvable } from "../types/published-name.types";
import { PublishedNameNotFoundError } from "../utilities/error.utility";

/**
 * Provides direct database access to published name rows.
 */
export class PublishedNameRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new PublishedNameRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return PublishedNameRepository.fromDB(db);
	}

	/**
	 * Returns every published name across all players.
	 * @returns An array of published names.
	 */
	getPublishedNames(): PublishedName[] {
		return asPublishedNames(
			this.db.getRows('SELECT * FROM publishedName')
		);
	}

	/**
	 * Retrieves a published name by its ID.
	 * @param publishedNameID - The ID of the published name to retrieve.
	 * @returns The published name if found, otherwise null.
	 */
	getPublishedNameByID(publishedNameID: PublishedNameID): PublishedName | null {
		const row = this.db.getRow(
			'SELECT * FROM publishedName WHERE id = ?', publishedNameID
		);

		if (row === undefined)
			return null;

		return asPublishedName(row);
	}

	/**
	 * Retrieves a published name by its ID, throwing if it does not exist.
	 * @param publishedNameID - The ID of the published name to retrieve.
	 * @returns The published name.
	 * @throws {PublishedNameNotFoundError} If the published name does not exist.
	 */
	getPublishedNameOrThrow(publishedNameID: PublishedNameID): PublishedName {
		return returnNonNullOrThrow(
			this.getPublishedNameByID(publishedNameID),
			new PublishedNameNotFoundError(publishedNameID)
		);
	}

	/**
	 * Resolves a published name resolvable to a published name ID.
	 * @param publishedNameResolvable - The resolvable to resolve.
	 * @returns The resolved published name ID.
	 */
	resolveID(publishedNameResolvable: PublishedNameResolvable): PublishedNameID {
		if (isNumber(publishedNameResolvable))
			return publishedNameResolvable;

		return publishedNameResolvable.id;
	}

	/**
	 * Resolves a published name resolvable to a published name.
	 * @param publishedNameResolvable - The resolvable to resolve.
	 * @returns The resolved published name.
	 * @throws {PublishedNameNotFoundError} If the published name does not exist.
	 */
	resolvePublishedName(publishedNameResolvable: PublishedNameResolvable): PublishedName {
		return this.getPublishedNameOrThrow(
			this.resolveID(publishedNameResolvable)
		);
	}

	/**
	 * Checks whether a published name exists by its ID.
	 * @param publishedNameID - The ID of the published name to check.
	 * @returns True if the published name exists, otherwise false.
	 */
	doesPublishedNameExist(publishedNameID: PublishedNameID): boolean {
		return this.db.doesExistInTable('publishedName', { id: publishedNameID });
	}

	/**
	 * Retrieves all published names owned by a player, ordered by slot.
	 * @param playerID - The ID of the player whose published names are being retrieved.
	 * @returns An array of the player's published names.
	 */
	getPublishedNamesByPlayer(playerID: PlayerID): PublishedName[] {
		return asPublishedNames(
			this.db.getRows(
				'SELECT * FROM publishedName WHERE playerID = @playerID ORDER BY slotNumber ASC',
				{ playerID }
			)
		);
	}

	/**
	 * Retrieves the number of published names a player currently has.
	 * @param playerID - The ID of the player whose published names are being counted.
	 * @returns The number of published names the player has.
	 */
	getNumPublishedNamesByPlayer(playerID: PlayerID): number {
		const count = this.db.getValue(
			'SELECT COUNT(*) FROM publishedName WHERE playerID = @playerID',
			{ playerID }
		);

		return Number(count);
	}

	/**
	 * Inserts a published name for a player into a specific published name slot.
	 * @param publishedName - The published name to insert.
	 * @param publishedName.playerID - The ID of the player who owns the published name.
	 * @param publishedName.name - The published name text.
	 * @param publishedName.slotNumber - The published name slot the published name occupies.
	 * @returns The created published name.
	 */
	addPublishedName({ playerID, name, slotNumber }: {
		playerID: PlayerID;
		name: string;
		slotNumber: number;
	}): PublishedName {
		const publishedNameID = this.db.insertIntoTable('publishedName', {
			playerID,
			name,
			slotNumber,
		});

		return this.getPublishedNameOrThrow(publishedNameID);
	}

	/**
	 * Removes a published name by its ID.
	 * @param publishedNameID - The ID of the published name to remove.
	 * @throws {PublishedNameNotFoundError} If the published name does not exist.
	 */
	removePublishedName(publishedNameID: PublishedNameID): void {
		const result = this.db.deleteFromTable('publishedName', { id: publishedNameID });

		if (result.changes === 0)
			throw new PublishedNameNotFoundError(publishedNameID);
	}

	/**
	 * Removes all published names owned by a player.
	 * @param playerID - The ID of the player whose published names are being removed.
	 */
	removePublishedNamesByPlayer(playerID: PlayerID): void {
		this.db.deleteFromTable('publishedName', { playerID });
	}

	/**
	 * Removes all published names, clearing the table.
	 */
	removePublishedNames(): void {
		this.db.run('DELETE FROM publishedName');
	}
}
