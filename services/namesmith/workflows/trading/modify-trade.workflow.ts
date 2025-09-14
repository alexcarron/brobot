import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { TradeResolveable, TradeStatuses } from '../../types/trade.types';
import { PlayerResolvable } from '../../types/player.types';
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerRespondedToTradeError, NonTradeRespondedToError, TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError } from '../../utilities/error.utility';
import { isError } from '../../../../utilities/types/type-guards';

export const checkIfPlayerCanModifyTrade = (
	{tradeService, playerService, playerModifying, trade}: {
		tradeService: TradeService,
		playerService: PlayerService,
		playerModifying: PlayerResolvable,
		trade: TradeResolveable,
	}
) => {
	// Is the user who is modifying the trade a player?
	if (!playerService.isPlayer(playerModifying)) {
		const playerID = playerService.resolveID(playerModifying);
		return new NonPlayerRespondedToTradeError(playerID);
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(trade)) {
		const player = playerService.resolvePlayer(playerModifying);
		return new NonTradeRespondedToError(player, trade);
	}
	trade = tradeService.resolveTrade(trade);

	// Is this trade already responded to?
	if (tradeService.hasBeenRespondedTo(trade)) {
		const player = playerService.resolvePlayer(playerModifying);
		trade = tradeService.resolveTrade(trade);
		return new TradeAlreadyRespondedToError(player, trade);
	}

	// Is this trade awaiting this player?
	if (!tradeService.canPlayerRespond(trade, playerModifying)) {
		const player = playerService.resolvePlayer(playerModifying);
		trade = tradeService.resolveTrade(trade);
		return new TradeAwaitingDifferentPlayerError(player, trade);
	}

	const otherPlayerID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayerID
			: trade.initiatingPlayerID;

	return {
		canModifyTrade: true,
		trade: trade,
		playerModifying: playerService.resolvePlayer(playerModifying),
		otherPlayer: playerService.resolvePlayer(otherPlayerID),
	}
}

/**
 * Modifies a trade request, updating the offered and requested characters.
 * @param parameters - An object containing the trade service, player service, player modifying the trade, trade request, new offered characters, and new requested characters.
 * @param parameters.tradeService - The trade service to use.
 * @param parameters.playerService - The player service to use.
 * @param parameters.playerModifying - The ID or player object of the player who is modifying the trade.
 * @param parameters.trade - The ID or trade object of the trade request to modify.
 * @param parameters.charactersGiving - The new characters being offered in the trade.
 * @param parameters.charactersReceiving - The new characters being requested in the trade.
 * @returns An object containing the trade that was modified, the initiating player, and the recipient player.
 * @throws {NonPlayerRespondedToTradeError} If the user modifying the trade is not a player.
 * @throws {NonTradeRespondedToError} If the trade being modified does not exist.
 * @throws {CannotRespondToTradeError} If the player modifying the trade is not the initiating player while the trade is awaiting the initiator, or not the recipient player while the trade is awaiting the recipient.
 * @throws {MissingOfferedCharactersError} If the initiating player does not have the characters they are offering.
 * @throws {MissingRequestedCharactersError} If the recipient player does not have the characters they are requesting.
 */
export const modifyTrade = (
	{tradeService, playerService, playerModifying, trade, charactersGiving, charactersReceiving}: {
		tradeService: TradeService,
		playerService: PlayerService,
		playerModifying: PlayerResolvable,
		trade: TradeResolveable,
		charactersGiving: string,
		charactersReceiving: string,
	}
) => {
	const result = checkIfPlayerCanModifyTrade({
		tradeService, playerService, playerModifying, trade
	});
	if (isError(result)) return result;
	trade = result.trade;

	let newOfferedCharacters, newRequestedCharacters;
	if (trade.status === TradeStatuses.AWAITING_RECIPIENT) {
		newOfferedCharacters = charactersReceiving;
		newRequestedCharacters = charactersGiving;
	}
	else {
		newOfferedCharacters = charactersGiving;
		newRequestedCharacters = charactersReceiving;
	}

	// Does the initating player have the new characters they want them to offer?
	if (!playerService.hasCharacters(
		trade.initiatingPlayerID, newOfferedCharacters
	)) {
		const player = playerService.resolvePlayer(trade.initiatingPlayerID);
		return new MissingOfferedCharactersError(
			player, newOfferedCharacters
		)
	}

	// Does the recipient player have the new characters they want them to give?
	if (!playerService.hasCharacters(
		trade.recipientPlayerID, newRequestedCharacters
	)) {
		const player = playerService.resolvePlayer(trade.recipientPlayerID);
		return new MissingRequestedCharactersError(
			player, newRequestedCharacters
		)
	}

	tradeService.requestModification(
		trade,
		newOfferedCharacters,
		newRequestedCharacters
	);

	const otherPlayerID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayerID
			: trade.initiatingPlayerID;

	return {
		canModifyTrade: true,
		trade: tradeService.resolveTrade(trade),
		playerModifying: playerService.resolvePlayer(playerModifying),
		otherPlayer: playerService.resolvePlayer(otherPlayerID),
	}
}