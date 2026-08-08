import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { PlayerID } from "../types/player.types";
import { asDBTip, asDBTips, Tip, TipDefinition, TipKey, TipResolvable } from "../types/tip.types";
import { isString } from "../../../utilities/types/type-guards";
import { PlayerNotFoundError, TipAlreadyExistsError, TipNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to the static tip data and to how many times each player has been shown each tip.
 */
export class TipRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new TipRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return TipRepository.fromDB(db);
	}

	/**
	 * Returns a list of all tip objects in the game.
	 * @returns An array of tip objects.
	 */
	getTips(): Tip[] {
		return asDBTips(
			this.db.getRows("SELECT * FROM tip")
		);
	}

	/**
	 * Retrieves a tip by its key. If the tip does not exist, an error is thrown.
	 * @param tipKey - The key of the tip to retrieve.
	 * @returns The tip object if found.
	 * @throws {TipNotFoundError} If the tip does not exist.
	 */
	getTip(tipKey: TipKey): Tip {
		const row = this.db.getRow(
			"SELECT * FROM tip WHERE key = @key",
			{ key: tipKey }
		);

		if (row === undefined)
			throw new TipNotFoundError(tipKey);

		return asDBTip(row);
	}

	/**
	 * Checks if a tip with the given key exists in the database.
	 * @param tipKey - The key of the tip to check for.
	 * @returns True if a tip with the given key exists, false otherwise.
	 */
	doesTipExist(tipKey: TipKey): boolean {
		return this.db.doesExistInTable('tip', { key: tipKey });
	}

	/**
	 * Resolves a tip key or tip object to a fetched tip object.
	 * @param tipResolvable - The tip to resolve. Can be a key or a tip object.
	 * @returns The resolved tip object.
	 * @throws {TipNotFoundError} If the tip does not exist.
	 */
	resolveTip(tipResolvable: TipResolvable): Tip {
		return this.getTip(this.resolveKey(tipResolvable));
	}

	/**
	 * Resolves a tip key or tip object to a tip key.
	 * @param tipResolvable - The tip to resolve. Can be a key or a tip object.
	 * @returns The resolved tip key.
	 */
	resolveKey(tipResolvable: TipResolvable): TipKey {
		if (isString(tipResolvable))
			return tipResolvable;

		return tipResolvable.key;
	}

	/**
	 * Adds a tip to the database.
	 * @param tipDefinition - The tip to be added to the database.
	 * @returns The added tip object.
	 * @throws {TipAlreadyExistsError} If a tip with the given key already exists.
	 */
	addTip(tipDefinition: TipDefinition): Tip {
		if (this.doesTipExist(tipDefinition.key))
			throw new TipAlreadyExistsError(tipDefinition.key);

		this.db.insertIntoTable('tip', {
			key: tipDefinition.key,
			message: tipDefinition.message,
		});

		return this.getTip(tipDefinition.key);
	}

	/**
	 * Updates a tip in the database.
	 * @param tipDefinition - The tip to be updated in the database.
	 * @returns The updated tip object.
	 * @throws {TipNotFoundError} If the tip does not exist.
	 */
	updateTip(tipDefinition: TipDefinition): Tip {
		if (!this.doesTipExist(tipDefinition.key))
			throw new TipNotFoundError(tipDefinition.key);

		this.db.updateInTable('tip', {
			fieldsUpdating: { message: tipDefinition.message },
			identifiers: { key: tipDefinition.key },
		});

		return this.getTip(tipDefinition.key);
	}

	/**
	 * Removes a tip from the database.
	 * @param tipKey - The key of the tip to be removed.
	 * @throws {TipNotFoundError} If the tip does not exist.
	 */
	removeTip(tipKey: TipKey): void {
		const result = this.db.deleteFromTable('tip', { key: tipKey });

		if (result.changes === 0)
			throw new TipNotFoundError(tipKey);
	}

	/**
	 * Retrieves how many times a player has been shown a given tip.
	 * @param playerID - The ID of the player.
	 * @param tipKey - The tip to check.
	 * @returns The number of times the tip has been shown, or 0 if it has never been shown.
	 */
	getViewCount(playerID: PlayerID, tipKey: TipKey): number {
		const viewCount = this.db.getValue(
			`SELECT viewCount FROM playerTipViewCount
			WHERE playerID = @playerID AND tipKey = @tipKey`,
			{ playerID, tipKey }
		);

		return viewCount === undefined
			? 0
			: Number(viewCount);
	}

	/**
	 * Increments how many times a player has been shown a given tip.
	 * @param playerID - The ID of the player.
	 * @param tipKey - The tip that was shown.
	 * @throws {PlayerNotFoundError} If the player with the specified ID is not found.
	 */
	incrementViewCount(playerID: PlayerID, tipKey: TipKey): void {
		if (this.db.doesExistInTable('player', { id: playerID }) === false)
			throw new PlayerNotFoundError(playerID);

		this.db.run(
			`INSERT INTO playerTipViewCount (playerID, tipKey, viewCount)
			VALUES (@playerID, @tipKey, 1)
			ON CONFLICT(playerID, tipKey) DO UPDATE SET viewCount = viewCount + 1`,
			{ playerID, tipKey }
		);
	}
}
