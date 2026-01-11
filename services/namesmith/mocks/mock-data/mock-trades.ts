import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { TradeRepository } from "../../repositories/trade.repository";
import { PlayerResolvable } from "../../types/player.types";
import { Trade, TradeDefintion, TradeResolvable, TradeStatuses } from "../../types/trade.types";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { addMockPlayer } from "./mock-players";
import { returnIfNotFailure } from '../../utilities/workflow.utility';
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { initiateTrade } from "../../workflows/trading/initiate-trade.workflow";
import { declineTrade } from "../../workflows/trading/decline-trade.workflow";
import { modifyTrade } from "../../workflows/trading/modify-trade.workflow";

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
 * Gives the required characters to the players involved in the given trade if they don't already have them.
 * @param tradeResolvable - The trade to give the characters for.
 * @returns The trade with the characters given to the players.
 */
function giveRequiredCharactersForTrade(tradeResolvable: TradeResolvable): Trade {
	const { playerService, tradeService } = getNamesmithServices();
	const trade = tradeService.resolveTrade(tradeResolvable);

	switch (trade.status) {
		case TradeStatuses.AWAITING_INITIATOR: {
			if (!playerService.hasCharacters(trade.initiatingPlayer, trade.offeredCharacters))
				playerService.giveCharacters(trade.initiatingPlayer, trade.offeredCharacters);

			if (!playerService.hasCharacters(trade.recipientPlayer, trade.requestedCharacters))
				playerService.giveCharacters(trade.recipientPlayer, trade.requestedCharacters);
			break;
		}

		case TradeStatuses.AWAITING_RECIPIENT: {
			if (!playerService.hasCharacters(trade.recipientPlayer, trade.requestedCharacters))
				playerService.giveCharacters(trade.recipientPlayer, trade.requestedCharacters);

			if (!playerService.hasCharacters(trade.initiatingPlayer, trade.offeredCharacters))
				playerService.giveCharacters(trade.initiatingPlayer, trade.offeredCharacters);
			break;
		}

		default:
			throw new Error(`Invalid trade status reached in forcePlayerToAcceptNewTrade function: ${trade.status}`);
	}

	return trade;
}

/**
 * Sets up the players for a new trade by giving the characters to the players, and initiating the trade.
 * @param player - The player who is initiating the trade.
 * @param tradeDefinition - An object containing the properties of the trade to initiate.
 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefinition.offeredCharacters - The characters offered in the trade.
 * @param tradeDefinition.requestedCharacters - The characters requested in the trade.
 * @returns The initiated trade with an ID.
 */
function setupPlayersForNewTrade(
	player: PlayerResolvable,
	tradeDefinition: WithAllOptional<TradeDefintion> = {}
): Trade {
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
	return giveRequiredCharactersForTrade(trade);
}

/**
 * Sets up a player for a given trade by giving the characters to the player, and
 * throwing an error if the player is not the initiator or recipient of the trade.
 * @param playerResolvable - The player to setup for the trade.
 * @param tradeResolvable - The trade to setup the player for.
 * @returns The setup trade with the required characters given to the player.
 * @throws {Error} - If the player is not the initiator or recipient of the trade.
 */
function setupPlayerForTrade(
	playerResolvable: PlayerResolvable,
	tradeResolvable: TradeResolvable
): Trade {
	const { playerService, tradeService } = getNamesmithServices();
	const trade = tradeService.resolveTrade(tradeResolvable);
	const playerID = playerService.resolveID(playerResolvable);

	switch (trade.status) {
		case TradeStatuses.AWAITING_INITIATOR:
			if (trade.initiatingPlayer.id !== playerID)
				throw new Error(`Player ${playerID} cannot be setup for this trade because they are not the initiator of the trade ${trade.id}.`);
			break;

		case TradeStatuses.AWAITING_RECIPIENT:
			if (trade.recipientPlayer.id !== playerID)
				throw new Error(`Player ${playerID} cannot be setup for this trade because they are not the recipient of the trade ${trade.id}.`);
			break;

		default:
			throw new Error(`Player ${playerID} cannot be setup for this trade because the trade status is ${trade.status} when it should be ${TradeStatuses.AWAITING_RECIPIENT} or ${TradeStatuses.AWAITING_INITIATOR}.`);
	}

	return giveRequiredCharactersForTrade(trade);
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
	const trade = setupPlayersForNewTrade(player, tradeDefinition);
	return returnIfNotFailure(
		acceptTrade({
			playerAccepting: player,
			trade,
		})
	);
}

/**
 * Forces a player to decline a newly defined trade by manually adding the trade, giving the characters to the player, and declining the trade.
 * @param player - The player who is declining the trade.
 * @param tradeDefinition - The trade data to add.
 * @param tradeDefinition.id - The ID of the trade.
 * @param tradeDefinition.initiatingPlayer - The player who initiated the trade.
 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefinition.offeredCharacters - The characters offered in the trade.
 * @param tradeDefinition.requestedCharacters - The characters requested in the trade.
 * @param tradeDefinition.status - The status of the trade.
 * @returns The result of declining the trade.
 */
export function forcePlayerToDeclineNewTrade(
	player: PlayerResolvable,
	tradeDefinition: WithAllOptional<TradeDefintion> = {},
) {
	const trade = setupPlayersForNewTrade(player, tradeDefinition);
	return returnIfNotFailure(
		declineTrade({
			playerDeclining: player,
			trade: trade,
		})
	);
}

/**
 * Forces a player to modify a trade by setting up the trade and modifying it.
 * @param player - The player who is modifying the trade.
 * @param options - The options for modifying the trade.
 * @param options.charactersGiving - The new characters being offered in the modification.
 * @param options.charactersReceiving - The new characters being requested in the modification.
 * @param tradeDefinition - The trade data to modify.
 * @param tradeDefinition.id - The ID of the trade.
 * @param tradeDefinition.initiatingPlayer - The player who initiated the trade.
 * @param tradeDefinition.recipientPlayer - The player who is receiving the trade.
 * @param tradeDefinition.offeredCharacters - The characters offered in the trade.
 * @param tradeDefinition.requestedCharacters - The characters requested in the trade.
 * @param tradeDefinition.status - The status of the trade.
 * @returns The result of modifying the trade.
 */
export function forcePlayerToModifyNewTrade(
	player: PlayerResolvable,
	{ charactersGiving, charactersReceiving }: {
		charactersGiving: string;
		charactersReceiving: string;
	},
	tradeDefinition: WithAllOptional<TradeDefintion> = {},
) {
	const trade = setupPlayersForNewTrade(player, tradeDefinition);

	const { playerService } = getNamesmithServices();
	if (!playerService.hasCharacters(player, charactersGiving))
		playerService.giveCharacters(player, charactersGiving);

	switch (trade.status) {
		case TradeStatuses.AWAITING_INITIATOR: {
			if (!playerService.hasCharacters(trade.recipientPlayer, charactersReceiving))
				playerService.giveCharacters(trade.recipientPlayer, charactersReceiving);
			break;
		}

		case TradeStatuses.AWAITING_RECIPIENT: {
			if (!playerService.hasCharacters(trade.initiatingPlayer, charactersReceiving))
				playerService.giveCharacters(trade.initiatingPlayer, charactersReceiving);
			break;
		}

		default:
			throw new Error(`Invalid trade status reached in forcePlayerToModifyNewTrade function: ${trade.status}`);
	}

	return returnIfNotFailure(
		modifyTrade({
			playerModifying: player,
			trade,
			charactersGiving,
			charactersReceiving
		})
	);
}


/**
 * Forces a player to accept a trade by accepting the trade with the given resolvable.
 * Also sets up the player with the required characters and such to complete the trade.
 * @param playerResolvable - The player who is accepting the trade.
 * @param tradeResolvable - The resolvable of the trade to accept.
 * @returns The result of accepting the trade.
 */
export function forcePlayerToAcceptTrade(
	playerResolvable: PlayerResolvable,
	tradeResolvable: TradeResolvable
) {
	const trade = setupPlayerForTrade(playerResolvable, tradeResolvable);
	return returnIfNotFailure(
		acceptTrade({
			playerAccepting: playerResolvable,
			trade: trade,
		})
	);
}

/**
 * Forces a player to decline a trade by declining the trade with the given resolvable.
 * Also sets up the player with the required characters and such to complete the trade.
 * @param playerResolvable - The player who is declining the trade.
 * @param tradeResolvable - The resolvable of the trade to decline.
 * @returns The result of declining the trade.
 */
export function forcePlayerToDeclineTrade(
	playerResolvable: PlayerResolvable,
	tradeResolvable: TradeResolvable
) {
	const trade = setupPlayerForTrade(playerResolvable, tradeResolvable);
	return returnIfNotFailure(
		declineTrade({
			playerDeclining: playerResolvable,
			trade: trade,
		})
	);
}