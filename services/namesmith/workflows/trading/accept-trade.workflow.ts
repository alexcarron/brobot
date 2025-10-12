import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { Trade, TradeResolveable } from '../../types/trade.types';
import { Player, PlayerResolvable } from '../../types/player.types';
import { getWorkflowResultCreator, provides } from '../workflow-result-creator';
import { getCharacterDifferences } from '../../../../utilities/data-structure-utils';

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
	if (!tradeService.canPlayerRespond(trade, playerAccepting)) {
		const playerAwaitingTrade = tradeService.getPlayerAwaitingResponseFrom(trade);

		if (playerAwaitingTrade === null) {
			throw new Error('Trade is not awaiting a response from any player, but it is also not responded to. This should never happen.');
		}

		return result.failure.tradeAwaitingDifferentPlayer({playerAwaitingTrade});
	}

	// Does the initating player have the characters they are offering?
	if (!playerService.hasCharacters(trade.initiatingPlayerID, trade.offeredCharacters)) {
		const player = playerService.resolvePlayer(trade.initiatingPlayerID);
		const {missingCharacters} = getCharacterDifferences(trade.offeredCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join('')
		});
	}

	// Does the recipient player have the characters they are requesting?
	if (!playerService.hasCharacters(trade.recipientPlayerID, trade.requestedCharacters)) {
		const player = playerService.resolvePlayer(trade.recipientPlayerID);
		const {missingCharacters} = getCharacterDifferences(trade.requestedCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join('')
		});
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

	return result.success({
		trade: tradeService.resolveTrade(trade.id),
		initiatingPlayer: playerService.resolvePlayer(trade.initiatingPlayerID),
		recipientPlayer: playerService.resolvePlayer(trade.recipientPlayerID),
	});
}