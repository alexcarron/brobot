import { getCharacterDifferences } from "../../../../utilities/data-structure-utils";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service"
import { Player, PlayerResolvable } from "../../types/player.types"
import { Trade } from "../../types/trade.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		initiatingPlayer: Player,
		recipientPlayer: Player,
		trade: Trade,
	}>(),

	nonPlayerInitiatedTrade: null,
	nonPlayerReceivedTrade: null,
	tradeBetweenSamePlayers: null,
	missingOfferedCharacters: provides<{
		missingCharacters: string,
	}>(),
	missingRequestedCharacters: provides<{
		missingCharacters: string,
	}>(),
})

/**
 * Initiates a trade between two users.
 * @param {object} parameters - An object containing the parameters for the trade.
 * @param {TradeService} parameters.tradeService - The trade service to use.
 * @param {PlayerService} parameters.playerService - The player service to use.
 * @param {PlayerResolvable} parameters.initiatingPlayer - The ID or player object of the player who is initiating the trade.
 * @param {PlayerResolvable} parameters.recipientPlayer - The ID or player object of the player who is receiving the trade.
 * @param {string} parameters.offeredCharacters - The characters being offered by the initiating player.
 * @param {string} parameters.requestedCharacters - The characters being requested by the recipient player.
 * @returns {object} An object containing the initiating player, recipient player, and the trade that was initiated.
 */
export const initiateTrade = (
	{tradeService, playerService, initiatingPlayer, recipientPlayer, offeredCharacters, requestedCharacters}: {
		tradeService: TradeService,
		playerService: PlayerService,
		initiatingPlayer: PlayerResolvable,
		recipientPlayer: PlayerResolvable,
		offeredCharacters: string,
		requestedCharacters: string
	}
) => {
	// Is the initiating user a player?
	if (!playerService.isPlayer(initiatingPlayer)) {
		return result.failure.nonPlayerInitiatedTrade();
	}

	// Is the recipient user a player?
	if (!playerService.isPlayer(recipientPlayer)) {
		return result.failure.nonPlayerReceivedTrade();
	}

	// Is the player trading with themselves?
	if (playerService.areSamePlayers(initiatingPlayer, recipientPlayer)) {
		return result.failure.tradeBetweenSamePlayers();
	}

	// Does the initating player have the characters they are offering?
	if (!playerService.hasCharacters(initiatingPlayer, offeredCharacters)) {
		const player = playerService.resolvePlayer(initiatingPlayer);
		const {missingCharacters} = getCharacterDifferences(offeredCharacters, player.inventory);
		return result.failure.missingOfferedCharacters({
			missingCharacters: missingCharacters.join('')
		})
	}

	// Does the recipient player have the characters they are requesting?
	if (!playerService.hasCharacters(recipientPlayer, requestedCharacters)) {
		const player = playerService.resolvePlayer(recipientPlayer);
		const {missingCharacters} = getCharacterDifferences(requestedCharacters, player.inventory);
		return result.failure.missingRequestedCharacters({
			missingCharacters: missingCharacters.join(''),
		});
	}

	const trade = tradeService.createTradeRequest({
		initiatingPlayer,
		recipientPlayer,
		offeredCharacters,
		requestedCharacters
	});

	return result.success({
		initiatingPlayer: playerService.resolvePlayer(initiatingPlayer),
		recipientPlayer: playerService.resolvePlayer(recipientPlayer),
		trade
	});
}