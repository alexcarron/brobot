import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { TradeResolveable } from '../../types/trade.types';
import { PlayerResolvable } from '../../types/player.types';
import { CannotRespondToTradeError, MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerRespondedToTradeError, NonTradeRespondedToError } from '../../utilities/error.utility';

/**
 * Modifies a trade request, updating the offered and requested characters.
 * @param parameters - An object containing the trade service, player service, player modifying the trade, trade request, new offered characters, and new requested characters.
 * @param parameters.tradeService - The trade service to use.
 * @param parameters.playerService - The player service to use.
 * @param parameters.playerModifying - The ID or player object of the player who is modifying the trade.
 * @param parameters.trade - The ID or trade object of the trade request to modify.
 * @param parameters.newOfferedCharacters - The new characters being offered in the trade.
 * @param parameters.newRequestedCharacters - The new characters being requested in the trade.
 * @returns An object containing the trade that was modified, the initiating player, and the recipient player.
 * @throws {NonPlayerRespondedToTradeError} If the user modifying the trade is not a player.
 * @throws {NonTradeRespondedToError} If the trade being modified does not exist.
 * @throws {CannotRespondToTradeError} If the player modifying the trade is not the initiating player while the trade is awaiting the initiator, or not the recipient player while the trade is awaiting the recipient.
 * @throws {MissingOfferedCharactersError} If the initiating player does not have the characters they are offering.
 * @throws {MissingRequestedCharactersError} If the recipient player does not have the characters they are requesting.
 */
export const modifyTrade = (
	{tradeService, playerService, playerModifying, trade, newOfferedCharacters, newRequestedCharacters}: {
		tradeService: TradeService,
		playerService: PlayerService,
		playerModifying: PlayerResolvable,
		trade: TradeResolveable,
		newOfferedCharacters: string,
		newRequestedCharacters: string,
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

	// Is this player allowed to respond to this trade request?
	if (!tradeService.canPlayerRespond(trade, playerModifying)) {
		const player = playerService.resolvePlayer(playerModifying);
		trade = tradeService.resolveTrade(trade);
		return new CannotRespondToTradeError(player, trade);
	}

	// Does the initating player have the new characters they want them to offer?
	if (!playerService.hasCharacters(
		trade.initiatingPlayerID, newOfferedCharacters
	)) {
		const player = playerService.resolvePlayer(trade.initiatingPlayerID);
		return new MissingOfferedCharactersError(
			player, trade.offeredCharacters
		)
	}

	// Does the recipient player have the new characters they want them to give?
	if (!playerService.hasCharacters(
		trade.recipientPlayerID, newRequestedCharacters
	)) {
		const player = playerService.resolvePlayer(trade.recipientPlayerID);
		return new MissingRequestedCharactersError(
			player, trade.requestedCharacters
		)
	}

	tradeService.requestModification(
		trade,
		newOfferedCharacters,
		newRequestedCharacters
	);

	return {
		trade: tradeService.resolveTrade(trade.id),
		initiatingPlayer: playerService.resolvePlayer(trade.initiatingPlayerID),
		recipientPlayer: playerService.resolvePlayer(trade.recipientPlayerID),
	}
}