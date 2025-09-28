import { TradeService } from '../../services/trade.service';
import { PlayerService } from '../../services/player.service';
import { Trade, TradeResolveable, TradeStatuses } from '../../types/trade.types';
import { Player, PlayerResolvable } from '../../types/player.types';
import { getWorkflowResultCreator, provides } from '../workflow-result-creator';
import { getCharacterDifferences } from '../../../../utilities/data-structure-utils';

const result = getWorkflowResultCreator({
	success: provides<{
		trade: Trade,
		playerModifying: Player,
		otherPlayer: Player,
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
})

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
	if (!tradeService.canPlayerRespond(trade, playerModifying)) {
		const player = playerService.resolvePlayer(playerModifying);
		return result.failure.tradeAwaitingDifferentPlayer({playerAwaitingTrade: player});
	}

	const otherPlayerID =
		trade.status === TradeStatuses.AWAITING_INITIATOR
			? trade.recipientPlayerID
			: trade.initiatingPlayerID;

	return result.success({
		trade: trade,
		playerModifying: playerService.resolvePlayer(playerModifying),
		otherPlayer: playerService.resolvePlayer(otherPlayerID),
	});
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
	const checkResult = checkIfPlayerCanModifyTrade({
		tradeService, playerService, playerModifying, trade
	});
	if (checkResult.isFailure()) return checkResult;
	trade = checkResult.trade;

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
		const {missingCharacters} = getCharacterDifferences(newOfferedCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join(''),
		})
	}

	// Does the recipient player have the new characters they want them to give?
	if (!playerService.hasCharacters(
		trade.recipientPlayerID, newRequestedCharacters
	)) {
		const player = playerService.resolvePlayer(trade.recipientPlayerID);
		const {missingCharacters} = getCharacterDifferences(newRequestedCharacters, player.inventory);
		return result.failure.playerMissingCharacters({
			player,
			missingCharacters: missingCharacters.join(''),
		})
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

	return result.success({
		trade: tradeService.resolveTrade(trade),
		playerModifying: playerService.resolvePlayer(playerModifying),
		otherPlayer: playerService.resolvePlayer(otherPlayerID),
	});
}