import { DatabaseQuerier } from "../database/database-querier";
import { PlayerID } from "../types/player.types";
import { asMinimalTrade, asMinimalTrades, MinimalTrade, Trade, TradeDefintion, TradeID, TradeStatus } from "../types/trade.types";
import { TradeAlreadyExistsError, TradeNotFoundError } from "../utilities/error.utility";
import { WithRequiredAndOneOther } from '../../../utilities/types/generic-types';
import { PlayerRepository } from "./player.repository";
import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { createMockDB } from "../mocks/mock-database";

/**
 * Provides access to the dynamic trading data
 */
export class TradeRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param playerRepository - The player repository instance used for retrieving player data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new TradeRepository(db, PlayerRepository.fromDB(db));
	}

	static asMock() {
		const db = createMockDB();
		return TradeRepository.fromDB(db);
	}

	/**
	 * Converts a DBTrade object to a Trade object.
	 * @param minimalTrade - The DBTrade object to convert.
	 * @returns The converted Trade object.
	 * @throws {PlayerNotFoundError} If either of the player IDs in the DBTrade object do not correspond to a player in the database.
	 */
	private toTradeFromMinimal(minimalTrade: MinimalTrade): Trade {
		const initiatingPlayer = this.playerRepository.getPlayerOrThrow(minimalTrade.initiatingPlayerID);
		const recipientPlayer = this.playerRepository.getPlayerOrThrow(minimalTrade.recipientPlayerID);

		return {
			...minimalTrade,
			initiatingPlayer,
			recipientPlayer
		};
	}

	private toTradesFromMinimal(minimalTrades: MinimalTrade[]): Trade[] {
		return minimalTrades.map(minimalTrade => this.toTradeFromMinimal(minimalTrade));
	}

	/**
	 * Retrieves all trades
	 * @returns An array of all trade objects
	 */
	getTrades(): Trade[] {
		const rows = this.db.getRows(
			'SELECT * FROM trade'
		);

		return this.toTradesFromMinimal(
			asMinimalTrades(rows)
		);
	}

	/**
	 * Retrieves a DBTrade object by its ID.
	 * @param tradeID - The ID of the DBTrade to be retrieved.
	 * @returns The DBTrade object with the given ID, or null if it does not exist.
	 */
	getMinimalTradeByID(tradeID: TradeID): MinimalTrade | null {
		const row = this.db.getRow(
			`SELECT * FROM trade WHERE id = @id`,
			{ id: tradeID }
		);
		if (row === undefined) return null
		return asMinimalTrade(row);
	}

	getMinimalTradeOrThrow(tradeID: TradeID): MinimalTrade {
		return returnNonNullOrThrow(
			this.getMinimalTradeByID(tradeID),
			new TradeNotFoundError(tradeID)
		)
	}

	/**
	 * Retrieves a trade by its ID.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The trade object with the given ID.
	 */
	getTradeByID(tradeID: TradeID): Trade | null{
		const dbTrade = this.db.getRow(
			`SELECT * FROM trade WHERE id = @id`,
			{ id: tradeID }
		) as MinimalTrade | undefined;

		if (dbTrade === undefined) return null;

		return this.toTradeFromMinimal(dbTrade);
	}

	/**
	 * Retrieves a trade by its ID. If the trade does not exist, an error is thrown.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The trade object with the given ID.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getTradeOrThrow(tradeID: TradeID): Trade {
		return returnNonNullOrThrow(
			this.getTradeByID(tradeID),
			new TradeNotFoundError(tradeID)
		)
	}

	/**
	 * Checks if a trade exists in the database.
	 * @param id - The ID of the trade to check.
	 * @returns true if the trade exists, false otherwise.
	 */
	doesTradeExist(id: TradeID): boolean {
		return this.db.doesExistInTable('trade', { id })
	}

	createTrade(trade: {
		initiatingPlayerID: PlayerID,
		recipientPlayerID: PlayerID,
		offeredCharacters: string,
		requestedCharacters: string
	}): TradeID {
		const id = this.db.insertIntoTable('trade', trade);
		return id;
	}

	/**
	 * Retrieves the ID of the player that initiated the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The ID of the player that initiated the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getInitiatingPlayerID(tradeID: TradeID): PlayerID {
		const dbTrade = this.getMinimalTradeOrThrow(tradeID);
		return dbTrade.initiatingPlayerID
	}

	/**
	 * Retrieves the ID of the player that is the recipient of the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The ID of the player that is the recipient of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getRecipientPlayerID(tradeID: TradeID): PlayerID {
		const dbTrade = this.getMinimalTradeOrThrow(tradeID);
		return dbTrade.recipientPlayerID
	}

	/**
	 * Retrieves the characters that are being offered in the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The characters that are being offered in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getOfferedCharacters(tradeID: TradeID): string {
		const dbTrade = this.getMinimalTradeOrThrow(tradeID);
		return dbTrade.offeredCharacters
	}

	/**
	 * Updates the characters that are being offered in the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param offeredCharacters - The characters that are being offered in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setOfferedCharacters(tradeID: TradeID, offeredCharacters: string): void {
		if (!this.doesTradeExist(tradeID))
			throw new TradeNotFoundError(tradeID);

		const query = `
			UPDATE trade
			SET offeredCharacters = @offeredCharacters
			WHERE id = @id
		`;

		this.db.run(query, {
			id: tradeID,
			offeredCharacters
		});
	}

	/**
	 * Retrieves the characters that are being requested in the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The characters that are being requested in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getRequestedCharacters(tradeID: TradeID): string {
		const dbTrade = this.getMinimalTradeOrThrow(tradeID);
		return dbTrade.requestedCharacters
	}

	/**
	 * Updates the characters that are being requested in the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param requestedCharacters - The characters that are being requested in the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setRequestedCharacters(tradeID: TradeID, requestedCharacters: string): void {
		if (!this.doesTradeExist(tradeID))
			throw new TradeNotFoundError(tradeID);

		const query = `
			UPDATE trade
			SET requestedCharacters = @requestedCharacters
			WHERE id = @id
		`;

		this.db.run(query, {
			id: tradeID,
			requestedCharacters
		});
	}

	/**
	 * Retrieves the status of the given trade.
	 * @param tradeID - The ID of the trade to be retrieved.
	 * @returns The status of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	getStatus(tradeID: TradeID): TradeStatus {
		const dbTrade = this.getMinimalTradeOrThrow(tradeID);
		return dbTrade.status
	}


	/**
	 * Updates the status of the given trade.
	 * @param tradeID - The ID of the trade to be updated.
	 * @param status - The new status of the trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	setStatus(tradeID: TradeID, status: TradeStatus): void {
		if (!this.doesTradeExist(tradeID))
			throw new TradeNotFoundError(tradeID);

		const query = `
			UPDATE trade
			SET status = @status
			WHERE id = @id
		`;

		this.db.run(query, {
			id: tradeID,
			status
		});
	}

	/**
	 * Adds a new trade to the database with the given properties.
	 * If the `id` property is provided and the trade already exists, a `TradeAlreadyExistsError` is thrown.
	 * @param tradeDefinition - The data for the new trade.
	 * @param tradeDefinition.id - The ID of the trade (optional).
	 * @param tradeDefinition.initiatingPlayer - The player who is initiating the trade.
	 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
	 * @param tradeDefinition.offeredCharacters - The characters being offered in the trade.
	 * @param tradeDefinition.requestedCharacters - The characters being requested in the trade.
	 * @param tradeDefinition.status - The status of the trade.
	 * @returns The newly added trade.
	 * @throws {TradeAlreadyExistsError} - If the trade already exists.
	 */
	addTrade(
		{
			id,
			initiatingPlayer: initiatingPlayerResolvable,
			recipientPlayer: recipientPlayerResolvable,
			offeredCharacters,
			requestedCharacters,
			status
		}: TradeDefintion
	): Trade {
		const initiatingPlayerID = this.playerRepository.resolveID(initiatingPlayerResolvable);
		const recipientPlayerID = this.playerRepository.resolveID(recipientPlayerResolvable);

		if (id !== undefined) {
			if (this.doesTradeExist(id))
				throw new TradeAlreadyExistsError(id);
		}

		id = this.db.insertIntoTable('trade', {
			id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status
		});

		return this.getTradeOrThrow(id);
	}

	/**
	 * Updates the trade with the given ID with the given properties.
	 * The `id` property is required.
	 * At least one of the other properties must also be provided.
	 * If the trade does not exist, a `TradeNotFoundError` is thrown.
	 * @param tradeDefinition - The data for the trade to be updated.
	 * @param tradeDefinition.id - The ID of the trade.
	 * @param tradeDefinition.initiatingPlayer - The player who is initiating the trade (optional).
	 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade (optional).
	 * @param tradeDefinition.offeredCharacters - The characters being offered in the trade (optional).
	 * @param tradeDefinition.requestedCharacters - The characters being requested in the trade (optional).
	 * @param tradeDefinition.status - The status of the trade (optional).
	 * @returns The updated trade.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	updateTrade(
		{
			id,
			initiatingPlayer: initiatingPlayerResolvable,
			recipientPlayer: recipientPlayerResolvable,
			offeredCharacters,
			requestedCharacters,
			status
		}: WithRequiredAndOneOther<TradeDefintion, 'id'>
	) {
		if (!this.doesTradeExist(id))
			throw new TradeNotFoundError(id);

		let initiatingPlayerID;
		if (initiatingPlayerResolvable != undefined)
			initiatingPlayerID = this.playerRepository.resolveID(initiatingPlayerResolvable);

		let recipientPlayerID;
		if (recipientPlayerResolvable != undefined)
			recipientPlayerID = this.playerRepository.resolveID(recipientPlayerResolvable);

		this.db.updateInTable('trade', {
			fieldsUpdating: { initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status },
			identifiers: { id }
		});

		return this.getTradeOrThrow(id);
	}

	/**
	 * Removes the trade with the given ID from the database.
	 * @param id - The ID of the trade to be removed.
	 * @throws {TradeNotFoundError} - If the trade does not exist.
	 */
	removeTrade(id: TradeID) {
		const result = this.db.deleteFromTable('trade', { id })

		if (result.changes === 0)
			throw new TradeNotFoundError(id);
	}
}
