import { WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { TradeRepository } from "../../repositories/trade.repository";
import { Trade, TradeDefintion, TradeStatuses } from "../../types/trade.types";
import { mockPlayers } from "./mock-players";

export const mockTrades: TradeDefintion[] = [
	{
		id: 1,
		initiatingPlayer: mockPlayers[0].id,
		recipientPlayer: mockPlayers[1].id,
		offeredCharacters: "abc",
		requestedCharacters: "edf",
		status: TradeStatuses.AWAITING_RECIPIENT,
	},
];

/**
 * Adds a trade to the database with the given properties.
 * @param db - The in-memory database.
 * @param tradeDefintion - The trade data to add.
 * @param tradeDefintion.id - The ID of the trade.
 * @param tradeDefintion.initiatingPlayer - The player who initiated the trade.
 * @param tradeDefintion.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefintion.offeredCharacters - The characters offered in the trade.
 * @param tradeDefintion.requestedCharacters - The characters requested in the trade.
 * @param tradeDefintion.status - The status of the trade.
 * @returns The added trade with an ID.
 */
export const addMockTrade = (
	db: DatabaseQuerier,
	tradeDefintion: WithAtLeastOneProperty<TradeDefintion>
): Trade => {
	const {
		id,
		initiatingPlayer = mockPlayers[0].id,
		recipientPlayer = mockPlayers[1].id,
		offeredCharacters = "abc",
		requestedCharacters = "edf",
		status = TradeStatuses.AWAITING_RECIPIENT,
	} = tradeDefintion

	const tradeRepository = TradeRepository.fromDB(db);
	return tradeRepository.addTrade({
		id,
		initiatingPlayer,
		recipientPlayer,
		offeredCharacters,
		requestedCharacters,
		status
	})
};