import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { TradeResolveable } from '../../types/trade.types';
import { PlayerResolvable } from '../../types/player.types';
import { CannotRespondToTradeError, NonPlayerRespondedToTradeError, NonTradeRespondedToError } from '../../utilities/error.utility';

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

	// Is this player allowed to respond to this trade request?
	if (!tradeService.canPlayerRespond(trade, playerDeclining)) {
		const player = playerService.resolvePlayer(playerDeclining);
		trade = tradeService.resolveTrade(trade);
		return new CannotRespondToTradeError(player, trade);
	}

	tradeService.decline(trade);

	return {
		trade: tradeService.resolveTrade(trade.id),
		initiatingPlayer: playerService.resolvePlayer(trade.initiatingPlayerID),
		recipientPlayer: playerService.resolvePlayer(trade.recipientPlayerID),
	};
}