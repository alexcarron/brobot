import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { TradeResolveable, TradeStatuses } from '../../types/trade.types';
import { PlayerResolvable } from '../../types/player.types';
import { NonPlayerRespondedToTradeError, NonTradeRespondedToError, TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError } from '../../utilities/error.utility';

export const declineTrade = (
	{tradeService, playerService, playerDeclining, trade}: {
		tradeService: TradeService,
		playerService: PlayerService,
		playerDeclining: PlayerResolvable,
		trade: TradeResolveable,
	}
) => {
	// Is the user who is declining the trade a player?
	if (!playerService.isPlayer(playerDeclining)) {
		const playerID = playerService.resolveID(playerDeclining);
		return new NonPlayerRespondedToTradeError(playerID);
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(trade)) {
		const player = playerService.resolvePlayer(playerDeclining);
		return new NonTradeRespondedToError(player, trade);
	}
	trade = tradeService.resolveTrade(trade);

	// Is this trade already responded to?
	if (tradeService.hasBeenRespondedTo(trade)) {
		const player = playerService.resolvePlayer(playerDeclining);
		trade = tradeService.resolveTrade(trade);
		return new TradeAlreadyRespondedToError(player, trade);
	}

	// Is this trade awaiting this player?
	if (!tradeService.canPlayerRespond(trade, playerDeclining)) {
		const player = playerService.resolvePlayer(playerDeclining);
		trade = tradeService.resolveTrade(trade);
		return new TradeAwaitingDifferentPlayerError(player, trade);
	}

	tradeService.decline(trade);

	const playerDeclinedID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayerID
			: trade.initiatingPlayerID;

	return {
		trade: tradeService.resolveTrade(trade.id),
		playerDeclining: playerService.resolvePlayer(playerDeclining),
		playerDeclined: playerService.resolvePlayer(playerDeclinedID),
	};
}