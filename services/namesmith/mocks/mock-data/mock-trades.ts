import { getRandomNumber } from "../../../../utilities/random-utils";
import { WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { mockPlayers } from "./mock-players";

export const mockTrades: Trade[] = [
	{
		id: 1,
		initiatingPlayerID: mockPlayers[0].id,
		recipientPlayerID: mockPlayers[1].id,
		offeredCharacters: "abc",
		requestedCharacters: "edf",
		status: TradeStatuses.AWAITING_RECIPIENT,
	},
];

/**
 * Creates a mock trade object with default values for optional properties.
 * @param parameters - An object with optional parameters for the mock trade object.
 * @param parameters.id - The ID of the trade. If not provided, a random number will be generated.
 * @param parameters.initiatingPlayerID - The ID of the player who initiated the trade.
 * @param parameters.recipientPlayerID - The ID of the player who received the trade.
 * @param parameters.offeredCharacters - The characters offered in the trade.
 * @param parameters.requestedCharacters - The characters requested in the trade.
 * @param parameters.status - The status of the trade.
 * @returns A mock trade object with default values for optional properties.
 */
export const createMockTradeObject = ({
	id = undefined,
	initiatingPlayerID = mockPlayers[0].id,
	recipientPlayerID = mockPlayers[1].id,
	offeredCharacters = "abc",
	requestedCharacters = "edf",
	status = TradeStatuses.AWAITING_RECIPIENT,
}: Partial<Trade>): Trade => {
	if (id === undefined)
		id = getRandomNumber();

	return { id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status };
}

/**
 * Adds a trade to the database with the given properties.
 * @param db - The in-memory database.
 * @param tradeData - The trade data to add.
 * @param tradeData.id - The ID of the trade.
 * @param tradeData.initiatingPlayerID - The ID of the player who initiated the trade.
 * @param tradeData.recipientPlayerID - The ID of the player who received the trade.
 * @param tradeData.offeredCharacters - The characters offered in the trade.
 * @param tradeData.requestedCharacters - The characters requested in the trade.
 * @param tradeData.status - The status of the trade.
 * @returns The added trade with an ID.
 */
export const addMockTrade = (
	db: DatabaseQuerier,
	{
		id = undefined,
		initiatingPlayerID = mockPlayers[0].id,
		recipientPlayerID = mockPlayers[1].id,
		offeredCharacters = "abc",
		requestedCharacters = "edf",
		status = TradeStatuses.AWAITING_RECIPIENT,
	}: WithAtLeastOneProperty<Trade>
): Trade => {
	if (id === undefined) {
		const runResult = db.run(
			`INSERT INTO trade (
				initiatingPlayerID,
				recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			)
			VALUES (
				@initiatingPlayer,
				@recipientPlayer,
				@offeredCharacters,
				@requestedCharacters,
				@status
			)`,
			{ initiatingPlayer: initiatingPlayerID, recipientPlayer: recipientPlayerID, offeredCharacters, requestedCharacters, status }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			`INSERT INTO trade (
				id,
				initiatingPlayerID,
				recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			)
			VALUES (
				@id,
				@initiatingPlayer,
				@recipientPlayer,
				@offeredCharacters,
				@requestedCharacters,
				@status
			)`,
			{
				id,
				initiatingPlayer: initiatingPlayerID,
				recipientPlayer: recipientPlayerID,
				offeredCharacters,
				requestedCharacters,
				status
			}
		);
	}
	return { id, initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters, status };
};