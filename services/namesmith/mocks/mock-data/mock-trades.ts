import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { TradeRepository } from "../../repositories/trade.repository";
import { PlayerResolvable } from "../../types/player.types";
import { Trade, TradeDefintion, TradeStatuses } from "../../types/trade.types";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { addMockPlayer } from "./mock-players";
import { returnIfNotFailure } from '../../utilities/workflow.utility';
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { initiateTrade } from "../../workflows/trading/initiate-trade.workflow";

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
	tradeDefintion: WithAllOptional<TradeDefintion> = {}
): Trade => {
	let {
		initiatingPlayer = undefined,
		recipientPlayer = undefined,
	} = tradeDefintion;
	const {
		id,
		offeredCharacters = "abc",
		requestedCharacters = "edf",
		status = TradeStatuses.AWAITING_RECIPIENT,
	} = tradeDefintion;

	if (initiatingPlayer === undefined) {
		initiatingPlayer = addMockPlayer(db);
	}
	if (recipientPlayer === undefined) {
		recipientPlayer = addMockPlayer(db);
	}

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

/**
 * Forces a player to initiate a trade with another player by giving the characters to the players, and initiating the trade.
 * @param player - The player who is initiating the trade.
 * @param tradeDefinition - An object containing the properties of the trade to initiate.
 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefinition.offeredCharacters - The characters offered in the trade.
 * @param tradeDefinition.requestedCharacters - The characters requested in the trade.
 * @returns The initiated trade with an ID.
 */
export function forcePlayerToInitiateTrade(
	player: PlayerResolvable,
	tradeDefinition: WithAllOptional<TradeDefintion> = {}
) {
	const { playerService } = getNamesmithServices();
	const db = playerService.playerRepository.db;

	let {
		recipientPlayer = addMockPlayer(db),
	} = tradeDefinition;

	const {
		offeredCharacters = "abc",
		requestedCharacters = "edf",
	} = tradeDefinition;
	const playerID = playerService.resolveID(player);
	const recipientPlayerID = playerService.resolveID(recipientPlayer);

	if (playerID === recipientPlayerID) {
		recipientPlayer = addMockPlayer(db).id;
	}

	playerService.giveCharacters(player, offeredCharacters);
	playerService.giveCharacters(recipientPlayer, requestedCharacters);


	return returnIfNotFailure(
		initiateTrade({
			initiatingPlayer: player,
			recipientPlayer,
			offeredCharacters,
			requestedCharacters
		})
	);
}

/**
 * Forces a player to accept a newly defined trade by manually adding the trade, giving the characters to the player, and accepting the trade.
 * @param player - The player who is accepting the trade.
 * @param tradeDefinition - The trade data to add.
 * @param tradeDefinition.id - The ID of the trade.
 * @param tradeDefinition.initiatingPlayer - The player who initiated the trade.
 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefinition.offeredCharacters - The characters offered in the trade.
 * @param tradeDefinition.requestedCharacters - The characters requested in the trade.
 * @param tradeDefinition.status - The status of the trade.
 * @returns The result of accepting the trade.
 */
export function forcePlayerToAcceptNewTrade(
	player: PlayerResolvable,
	tradeDefinition: WithAllOptional<TradeDefintion> = {},
) {
	const { playerService } = getNamesmithServices();
	const db = playerService.playerRepository.db;

	switch (tradeDefinition.status) {
		case TradeStatuses.AWAITING_INITIATOR:
			tradeDefinition.initiatingPlayer = player;
			break;

		case TradeStatuses.AWAITING_RECIPIENT:
			tradeDefinition.recipientPlayer = player;
			break;

		default:
			tradeDefinition.status = TradeStatuses.AWAITING_RECIPIENT;
			tradeDefinition.recipientPlayer = player;
			break;
	}

	const trade = addMockTrade(db, tradeDefinition);

	switch (trade.status) {
		case TradeStatuses.AWAITING_INITIATOR: {
			playerService.giveCharacters(player, trade.offeredCharacters);
			playerService.giveCharacters(trade.recipientPlayer, trade.requestedCharacters);
			break;
		}

		case TradeStatuses.AWAITING_RECIPIENT: {
			playerService.giveCharacters(player, trade.requestedCharacters);
			playerService.giveCharacters(trade.initiatingPlayer, trade.offeredCharacters);
			break;
		}


		default:
			throw new Error(`Invalid trade status reached in forcePlayerToAcceptNewTrade function: ${trade.status}`);
	}

	return returnIfNotFailure(
		acceptTrade({
			playerAccepting: player,
			trade,
		})
	);
}