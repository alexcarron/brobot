import { DatabaseQuerier, toAssignmentsPlaceholder } from "../database/database-querier";
import { PlayerID } from "../types/player.types";
import { DBTrade, Trade, TradeDefintion, TradeID, TradeStatus } from "../types/trade.types";
import { CannotCreateTradeError, TradeAlreadyExistsError, TradeNotFoundError } from "../utilities/error.utility";
import { throwIfNotTrade, throwIfNotTrades } from "../utilities/trade.utility";
import { WithRequiredAndOneOther } from '../../../utilities/types/generic-types';

/**
 * Provides access to the dynamic trading data
 */
export class TradeRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	/**
	 * Retrieves all trades
	 * @returns An array of all trade objects
	 */
	getTrades(): Trade[] {
		const query =  "SELECT * FROM trade";
		const dbTrades = this.db.getRows(query) as DBTrade[];
		throwIfNotTrades(dbTrades);
		return dbTrades;
	}

	/**
	 * Retrieves a trade by its ID.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The trade object with the given ID.
	 */
	getTradeByID(tradeID: TradeID): Trade | null{
		const query = `SELECT * FROM trade WHERE id = @id`;
		const dbTrade = this.db.getRow(query,
			{ id: tradeID }
		) as DBTrade | undefined;

		if (dbTrade === undefined) return null;

		throwIfNotTrade(dbTrade);
		return dbTrade;
	}

	/**
	 * Retrieves a trade by its ID. If the trade does not exist, an error is thrown.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The trade object with the given ID.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getTradeOrThrow(tradeID: TradeID): Trade {
		const trade = this.getTradeByID(tradeID);

		if (trade === null)
			throw new TradeNotFoundError(tradeID);

		return trade
	}

	/**
	 * Checks if a trade exists in the database.
	 * @param tradeID - The ID of the trade to check.
	 * @returns true if the trade exists, false otherwise.
	 */
	doesTradeExist(tradeID: TradeID): boolean {
		return this.getTradeByID(tradeID) !== null;
	}

	createTrade(trade: {
		initiatingPlayerID: PlayerID,
		recipientPlayerID: PlayerID,
		offeredCharacters: string,
		requestedCharacters: string
	}): TradeID {
		const query = `INSERT INTO trade (
			initiatingPlayerID,
			recipientPlayerID,
			offeredCharacters,
			requestedCharacters
		)
		VALUES (@initiatingPlayerID, @recipientPlayerID, @offeredCharacters, @requestedCharacters)`;

		const runResult = this.db.run(query, trade);

		if (runResult.changes === 0)
			throw new CannotCreateTradeError(trade);

		return runResult.lastInsertRowid as TradeID
	}

	/**
	 * Retrieves the ID of the player that initiated the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The ID of the player that initiated the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getInitiatingPlayerID(tradeID: TradeID): PlayerID {
		const trade = this.getTradeOrThrow(tradeID);
		return trade.initiatingPlayerID
	}

	/**
	 * Retrieves the ID of the player that is the recipient of the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The ID of the player that is the recipient of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getRecipientPlayerID(tradeID: TradeID): PlayerID {
		const trade = this.getTradeOrThrow(tradeID);
		return trade.recipientPlayerID
	}

	/**
	 * Retrieves the characters that are being offered in the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The characters that are being offered in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getOfferedCharacters(tradeID: TradeID): string {
		const trade = this.getTradeOrThrow(tradeID);
		return trade.offeredCharacters
	}

	/**
	 * Updates the characters that are being offered in the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param offeredCharacters - The characters that are being offered in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setOfferedCharacters(tradeID: TradeID, offeredCharacters: string): void {
		const query = `
			UPDATE trade
			SET offeredCharacters = @offeredCharacters
			WHERE id = @id
		`;

		const runResult = this.db.run(query, {
			id: tradeID,
			offeredCharacters
		});

		if (runResult.changes === 0)
			throw new TradeNotFoundError(tradeID);
	}

	/**
	 * Retrieves the characters that are being requested in the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The characters that are being requested in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getRequestedCharacters(tradeID: TradeID): string {
		const trade = this.getTradeOrThrow(tradeID);
		return trade.requestedCharacters
	}

	/**
	 * Updates the characters that are being requested in the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param requestedCharacters - The characters that are being requested in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setRequestedCharacters(tradeID: TradeID, requestedCharacters: string): void {
		const query = `
			UPDATE trade
			SET requestedCharacters = @requestedCharacters
			WHERE id = @id
		`;

		const runResult = this.db.run(query, {
			id: tradeID,
			requestedCharacters
		});

		if (runResult.changes === 0)
			throw new TradeNotFoundError(tradeID);
	}

	/**
	 * Retrieves the status of the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The status of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getStatus(tradeID: TradeID): TradeStatus {
		const trade = this.getTradeOrThrow(tradeID);
		return trade.status
	}


	/**
	 * Updates the status of the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param status - The new status of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setStatus(tradeID: TradeID, status: TradeStatus): void {
		const query = `
			UPDATE trade
			SET status = @status
			WHERE id = @id
		`;

		const runResult = this.db.run(query, {
			id: tradeID,
			status
		});

		if (runResult.changes === 0)
			throw new TradeNotFoundError(tradeID);
	}

	/**
	 * Adds a new trade to the database with the given properties.
	 * If the `id` property is provided and the trade already exists, a `TradeAlreadyExistsError` is thrown.
	 * @param tradeDefinition - The data for the new trade.
	 * @param tradeDefinition.id - The ID of the trade (optional).
	 * @param tradeDefinition.initiatingPlayerID - The ID of the player who is initiating the trade.
	 * @param tradeDefinition.recipientPlayerID - The ID of the player who is receiving the trade.
	 * @param tradeDefinition.offeredCharacters - The characters being offered in the trade.
	 * @param tradeDefinition.requestedCharacters - The characters being requested in the trade.
	 * @param tradeDefinition.status - The status of the trade.
	 * @returns The newly added trade.
	 * @throws {TradeAlreadyExistsError} - If the trade already exists.
	 */
	addTrade({id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status}: TradeDefintion) {
		if (id !== undefined) {
			if (this.doesTradeExist(id))
				throw new TradeAlreadyExistsError(id);

			this.db.run(
				`INSERT INTO trade (id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status)
				VALUES (@id, @initiatingPlayerID, @recipientPlayerID, @offeredCharacters, @requestedCharacters, @status)`,
				{id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status}
			)
		}
		else {
			const result = this.db.run(
				`INSERT INTO trade (initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status)
				VALUES (@initiatingPlayerID, @recipientPlayerID, @offeredCharacters, @requestedCharacters, @status)`,
				{initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status}
			);

			id = Number(result.lastInsertRowid);
		}

		return { id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status };
	}

	/**
	 * Updates the trade with the given ID with the given properties.
	 * The `id` property is required.
	 * At least one of the other properties must also be provided.
	 * If the trade does not exist, a `TradeNotFoundError` is thrown.
	 * @param tradeDefinition - The data for the trade to be updated.
	 * @param tradeDefinition.id - The ID of the trade.
	 * @param tradeDefinition.initiatingPlayerID - The ID of the player who is initiating the trade (optional).
	 * @param tradeDefinition.recipientPlayerID - The ID of the player who is receiving the trade (optional).
	 * @param tradeDefinition.offeredCharacters - The characters being offered in the trade (optional).
	 * @param tradeDefinition.requestedCharacters - The characters being requested in the trade (optional).
	 * @param tradeDefinition.status - The status of the trade (optional).
	 * @returns The updated trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	updateTrade({id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status}:
		WithRequiredAndOneOther<TradeDefintion, 'id'>
	) {
		if (!this.doesTradeExist(id))
			throw new TradeNotFoundError(id);

		this.db.run(
			`UPDATE trade
			SET ${toAssignmentsPlaceholder({ initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status })}
			WHERE id = @id`,
			{ id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status }
		);

		return this.getTradeOrThrow(id);
	}

	/**
	 * Removes the trade with the given ID from the database.
	 * @param tradeID - The ID of the trade to be removed.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	removeTrade(tradeID: TradeID) {
		const result = this.db.run(
			`DELETE FROM trade WHERE id = ?`, tradeID
		);

		if (result.changes === 0)
			throw new TradeNotFoundError(tradeID);
	}
}
