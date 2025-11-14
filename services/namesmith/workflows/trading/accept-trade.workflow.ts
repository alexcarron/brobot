import { Trade, TradeResolveable } from '../../types/trade.types';
import { Player, PlayerResolvable } from '../../types/player.types';
import { getWorkflowResultCreator, provides } from '../workflow-result-creator';
import { getCharacterDifferences } from '../../../../utilities/data-structure-utils';
import { getNamesmithServices } from '../../services/get-namesmith-services';

const result = getWorkflowResultCreator({
	success: provides<{
		trade: Trade,
		initiatingPlayer: Player,
		recipientPlayer: Player,
	}>(),

	nonPlayerRespondedToTrade: null,
	nonTradeRespondedTo: null,
	tradeAlreadyRespondedTo: provides<{
		trade: Trade,
	}>(),
	tradeAwaitingDifferentPlayer: provides<{
		playerAwaitingTrade: Player,
	}>(),
	playerMissingCharacters: provides<{
		player: Player,
		missingCharacters: string,
	}>(),
});

/**
 * Accepts a trade request, transferring characters between the two players.
 * @param parameters - An object containing the trade service, player service, player accepting the trade, and the trade request.
 * @param parameters.tradeService - The trade service to use.
 * @param parameters.playerService - The player service to use.
 * @param parameters.playerAccepting - The ID or player object of the player who is accepting the trade.
 * @param parameters.trade - The ID or trade object of the trade request to accept.
 * @returns An object containing the trade that was accepted, the initiating player, and the recipient player.
 */
export const acceptTrade = (
	{playerAccepting, trade: tradeResolvable}: {
		playerAccepting: PlayerResolvable,
		trade: TradeResolveable,
	}
) => {
	const {tradeService, playerService, activityLogService} = getNamesmithServices();

	// Is the user who accepting the trade a player?
	if (!playerService.isPlayer(playerAccepting)) {
		return result.failure.nonPlayerRespondedToTrade();
	}

	// Does this trade actually exist?
	if (!tradeService.isTrade(tradeResolvable)) {
		return result.failure.nonTradeRespondedTo();
	}
	const trade = tradeService.resolveTrade(tradeResolvable);

	// Is this trade already responded to?
	if (tradeService.hasBeenRespondedTo(tradeResolvable)) {
		const trade = tradeService.resolveTrade(tradeResolvable);
		return result.failure.tradeAlreadyRespondedTo({trade});
	}

	// Is this trade awaiting this player?
	if (!tradeService.canPlayerRespond(tradeResolvable, playerAccepting)) {
		const playerAwaitingTrade = tradeService.getPlayerAwaitingResponseFrom(tradeResolvable);

		if (playerAwaitingTrade === null) {
			throw new Error('Trade is not awaiting a response from any player, but it is also not responded to. This should never happen.');
		}

		return result.failure.tradeAwaitingDifferentPlayer({playerAwaitingTrade});
	}

	// Does the initating player have the characters they are offering?
	if (!playerService.hasCharacters(trade.initiatingPlayer, trade.offeredCharacters)) {
		const player = playerService.resolvePlayer(trade.initiatingPlayer);
		const {missingCharacters} = getCharacterDifferences(trade.offeredCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join('')
		});
	}

	// Does the recipient player have the characters they are requesting?
	if (!playerService.hasCharacters(trade.recipientPlayer, trade.requestedCharacters)) {
		const player = playerService.resolvePlayer(trade.recipientPlayer);
		const {missingCharacters} = getCharacterDifferences(trade.requestedCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join('')
		});
	}

	playerService.transferCharacters(
		trade.initiatingPlayer,
		trade.recipientPlayer,
		trade.offeredCharacters
	);

	playerService.transferCharacters(
		trade.recipientPlayer,
		trade.initiatingPlayer,
		trade.requestedCharacters
	);

	tradeService.accept(trade);

	activityLogService.logAcceptTrade({
		playerAcceptingTrade: playerAccepting,
		playerAwaitingAcceptance: tradeService.getPlayerWaitingForResponse(trade)!
	});

	return result.success({
		trade: tradeService.resolveTrade(trade.id),
		initiatingPlayer: playerService.resolvePlayer(trade.initiatingPlayer),
		recipientPlayer: playerService.resolvePlayer(trade.recipientPlayer),
	});
}