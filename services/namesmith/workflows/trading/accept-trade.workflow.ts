import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { TradeResolveable } from '../../types/trade.types';
import { PlayerResolvable } from '../../types/player.types';
import { CannotRespondToTradeError, MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerRespondedToTradeError, NonTradeRespondedToError } from '../../utilities/error.utility';

/**
 * Accepts a trade request, transferring characters between the two players.
 * @param parameters - An object containing the trade service, player service, player accepting the trade, and the trade request.
 * @param parameters.tradeService - The trade service to use.
 * @param parameters.playerService - The player service to use.
 * @param parameters.playerAccepting - The ID or player object of the player who is accepting the trade.
 * @param parameters.trade - The ID or trade object of the trade request to accept.
 * @returns An object containing the trade that was accepted, the initiating player, and the recipient player.
 * @throws {NonPlayerRespondedToTradeError} If the user accepting the trade is not a player.
 * @throws {NonTradeRespondedToError} If the trade being accepted does not exist.
 * @throws {CannotRespondToTradeError} If the player accepting the trade is not the recipient while the trade is awaiting the recipient.
 * @throws {MissingOfferedCharactersError} If the initiating player does not have the characters they are offering.
 * @throws {MissingRequestedCharactersError} If the recipient player does not have the characters they are requesting.
 */
export const acceptTrade = async (
	{tradeService, playerService, playerAccepting, trade}: {
		tradeService: TradeService,
		playerService: PlayerService,
		playerAccepting: PlayerResolvable,
		trade: TradeResolveable,
	}
) => {
	// Is the user who accepting the trade a player?
	if (!playerService.isPlayer(playerAccepting)) {
		const playerID = playerService.resolveID(playerAccepting);
		return new NonPlayerRespondedToTradeError(playerID);
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(trade)) {
		const player = playerService.resolvePlayer(playerAccepting);
		return new NonTradeRespondedToError(player, trade);
	}
	trade = tradeService.resolveTrade(trade);

	// Is this player allowed to respond to this trade request?
	if (!tradeService.canPlayerRespond(trade, playerAccepting)) {
		const player = playerService.resolvePlayer(playerAccepting);
		trade = tradeService.resolveTrade(trade);
		return new CannotRespondToTradeError(player, trade);
	}

	// Does the initating player have the characters they are offering?
	if (!playerService.hasCharacters(trade.initiatingPlayerID, trade.offeredCharacters)) {
		const player = playerService.resolvePlayer(trade.initiatingPlayerID);
		return new MissingOfferedCharactersError(
			player, trade.offeredCharacters
		)
	}

	// Does the recipient player have the characters they are requesting?
	if (!playerService.hasCharacters(trade.recipientPlayerID, trade.requestedCharacters)) {
		const player = playerService.resolvePlayer(trade.recipientPlayerID);
		return new MissingRequestedCharactersError(
			player, trade.requestedCharacters
		)
	}

	await playerService.transferCharacters(
		trade.initiatingPlayerID,
		trade.recipientPlayerID,
		trade.offeredCharacters
	);

	await playerService.transferCharacters(
		trade.recipientPlayerID,
		trade.initiatingPlayerID,
		trade.requestedCharacters
	);

	tradeService.accept(trade);

	return {
		trade: tradeService.resolveTrade(trade.id),
		initiatingPlayer: playerService.resolvePlayer(trade.initiatingPlayerID),
		recipientPlayer: playerService.resolvePlayer(trade.recipientPlayerID),
	}
}