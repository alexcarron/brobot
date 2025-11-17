import { Trade, TradeResolveable, TradeStatuses } from '../../types/trade.types';
import { Player, PlayerResolvable } from '../../types/player.types';
import { getWorkflowResultCreator, provides } from '../workflow-result-creator';
import { getNamesmithServices } from '../../services/get-namesmith-services';

const result = getWorkflowResultCreator({
	success: provides<{
		trade: Trade,
		playerDeclining: Player,
		playerDeclined: Player,
	}>(),

	notAPlayer: null,
	tradeDoesNotExist: null,
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
	{playerDeclining, trade: tradeResolvable}: {
		playerDeclining: PlayerResolvable,
		trade: TradeResolveable,
	}
) => {
	const {tradeService, playerService} = getNamesmithServices();

	// Is the user who is declining the trade a player?
	if (!playerService.isPlayer(playerDeclining)) {
		return result.failure.notAPlayer();
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(tradeResolvable)) {
		return result.failure.tradeDoesNotExist();
	}
	const trade = tradeService.resolveTrade(tradeResolvable);

	// Is this trade already responded to?
	if (tradeService.hasBeenRespondedTo(tradeResolvable)) {
		const trade = tradeService.resolveTrade(tradeResolvable);
		return result.failure.tradeAlreadyRespondedTo({trade});
	}

	// Is this trade awaiting this player?
	if (!tradeService.canPlayerRespond(tradeResolvable, playerDeclining)) {
		const playerAwaitingTrade = tradeService.getPlayerAwaitingResponseFrom(tradeResolvable);

		if (playerAwaitingTrade === null) {
			throw new Error('Trade is not awaiting a response from any player, but it is also not responded to. This should never happen.');
		}

		return result.failure.tradeAwaitingDifferentPlayer({playerAwaitingTrade});
	}

	tradeService.decline(tradeResolvable);

	const playerDeclinedID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayer
			: trade.initiatingPlayer;

	return result.success({
		trade: tradeService.resolveTrade(trade.id),
		playerDeclining: playerService.resolvePlayer(playerDeclining),
		playerDeclined: playerService.resolvePlayer(playerDeclinedID),
	});
}