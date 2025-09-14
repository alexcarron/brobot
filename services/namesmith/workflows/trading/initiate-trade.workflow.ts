import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service"
import { PlayerResolvable } from "../../types/player.types"
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerInitiatedTradeError, NonPlayerReceivedTradeError, TradeBetweenSamePlayersError } from "../../utilities/error.utility";

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
 * @throws {NonPlayerInitiatedTradeError} If the initiating player is not a real player.
 * @throws {NonPlayerReceivedTradeError} If the recipient player is not a real player.
 * @throws {MissingOfferedCharactersError} If the initiating player does not have the characters they are offering.
 * @throws {MissingRequestedCharactersError} If the recipient player does not have the characters they are requesting.
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
		const playerID = playerService.resolveID(initiatingPlayer);
		return new NonPlayerInitiatedTradeError(playerID);
	}

	// Is the recipient user a player?
	if (!playerService.isPlayer(recipientPlayer)) {
		const playerID = playerService.resolveID(recipientPlayer);
		return new NonPlayerReceivedTradeError(playerID);
	}

	// Is the player trading with themselves?
	if (playerService.areSamePlayers(initiatingPlayer, recipientPlayer)) {
		const player = playerService.resolvePlayer(initiatingPlayer);
		return new TradeBetweenSamePlayersError(player);
	}

	// Does the initating player have the characters they are offering?
	if (!playerService.hasCharacters(initiatingPlayer, offeredCharacters)) {
		const player = playerService.resolvePlayer(initiatingPlayer);
		return new MissingOfferedCharactersError(
			player, offeredCharacters
		)
	}

	// Does the recipient player have the characters they are requesting?
	if (!playerService.hasCharacters(recipientPlayer, requestedCharacters)) {
		const player = playerService.resolvePlayer(recipientPlayer);
		return new MissingRequestedCharactersError(
			player, requestedCharacters
		)
	}

	const trade = tradeService.createTradeRequest({
		initiatingPlayer,
		recipientPlayer,
		offeredCharacters,
		requestedCharacters
	});
	return {
		initiatingPlayer: playerService.resolvePlayer(initiatingPlayer),
		recipientPlayer: playerService.resolvePlayer(recipientPlayer),
		trade
	};
}