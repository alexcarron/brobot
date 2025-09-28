import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { Trade, TradeResolveable, TradeStatuses } from '../../types/trade.types';
import { Player, PlayerResolvable } from '../../types/player.types';
import { getWorkflowResultCreator, provides } from '../workflow-result-creator';

const result = getWorkflowResultCreator({
	success: provides<{
		trade: Trade,
		playerDeclining: Player,
		playerDeclined: Player,
	}>(),

	nonPlayerRespondedToTrade: null,
	nonTradeRespondedTo: null,
	tradeAlreadyRespondedTo: provides<{
		trade: Trade,
	}>(),
	tradeAwaitingDifferentPlayer: provides<{
		playerAwaitingTrade: Player,
	}>(),
})

/**
 * Declines a trade request.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.playerDeclining - The player declining the trade.
 * @param parameters.trade - The trade to decline.
 * @returns An object containing the declined trade and the initiating and recipient players.
 */
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
		return result.failure.nonPlayerRespondedToTrade();
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(trade)) {
		return result.failure.nonTradeRespondedTo();
	}
	trade = tradeService.resolveTrade(trade);

	// Is this trade already responded to?
	if (tradeService.hasBeenRespondedTo(trade)) {
		trade = tradeService.resolveTrade(trade);
		return result.failure.tradeAlreadyRespondedTo({trade});
	}

	// Is this trade awaiting this player?
	if (!tradeService.canPlayerRespond(trade, playerDeclining)) {
		const player = playerService.resolvePlayer(playerDeclining);
		return result.failure.tradeAwaitingDifferentPlayer({playerAwaitingTrade: player});
	}

	tradeService.decline(trade);

	const playerDeclinedID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayerID
			: trade.initiatingPlayerID;

	return result.success({
		trade: tradeService.resolveTrade(trade.id),
		playerDeclining: playerService.resolvePlayer(playerDeclining),
		playerDeclined: playerService.resolvePlayer(playerDeclinedID),
	});
}