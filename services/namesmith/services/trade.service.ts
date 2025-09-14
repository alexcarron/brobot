import { TradeRepository } from "../repositories/trade.repository";
import { PlayerResolvable } from "../types/player.types";
import { Trade, TradeID, TradeResolveable, TradeStatuses } from "../types/trade.types";
import { InvalidStateError } from "../utilities/error.utility";
import { isTrade } from "../utilities/trade.utility";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with recipes.
 */
export class TradeService {
	constructor (
		public tradeRepository: TradeRepository,
		public playerService: PlayerService,
	) {}

	/**
	 * Resolves a recipe resolvable to a recipe object.
	 * @param tradeResolvable - The recipe resolvable to resolve.
	 * @returns The resolved recipe object.
	 * @throws {RecipeNotFoundError} If the recipe with the given ID is not found.
	 */
	resolveTrade(tradeResolvable: TradeResolveable): Trade {
		const tradeID =
			typeof tradeResolvable === 'object'
				? tradeResolvable.id
				: tradeResolvable;

		return this.tradeRepository.getTradeOrThrow(tradeID);
	}

	/**
	 * Resolves a trade resolvable to a trade ID.
	 * @param tradeResolvable - The trade resolvable to resolve.
	 * @returns The resolved trade ID.
	 */
	resolveID(tradeResolvable: TradeResolveable): TradeID {
		if (isTrade(tradeResolvable))
			return tradeResolvable.id;

		return tradeResolvable;
	}

	/**
	 * Retrieves all trade requests from the database.
	 * @returns An array of all trade objects in the database.
	 */
	getTrades(): Trade[] {
		return this.tradeRepository.getTrades();
	}

	/**
	 * Creates a new trade request with the given properties.
	 * @param parameters - An object containing the properties for the trade request.
	 * @param parameters.initiatingPlayer - The ID of the player who is initiating the trade.
	 * @param parameters.recipientPlayer - The ID of the player who is receiving the trade.
	 * @param parameters.offeredCharacters - The characters being offered in the trade.
	 * @param parameters.requestedCharacters - The characters being requested in the trade.
	 * @returns The newly created trade request object.
	 */
	createTradeRequest(
		{initiatingPlayer, recipientPlayer, offeredCharacters, requestedCharacters}: {
			initiatingPlayer: PlayerResolvable,
			recipientPlayer: PlayerResolvable,
			offeredCharacters: string,
			requestedCharacters: string
		}
	): Trade {
		const initiatingPlayerID = this.playerService.resolveID(initiatingPlayer);
		const recipientPlayerID = this.playerService.resolveID(recipientPlayer);

		const tradeID = this.tradeRepository.createTrade({initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters});

		return this.tradeRepository.getTradeOrThrow(tradeID);
	}

	/**
	 * Accepts a trade request, transferring characters between the two players.
	 * @param trade - The trade request to accept.
	 */
	accept(trade: TradeResolveable): void {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.ACCEPTED
		)
	}

	/**
	 * Declines a trade request.
	 * @param trade - The trade request to decline.
	 */
	decline(trade: TradeResolveable): void {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.DECLINED
		)
	}

	/**
	 * Requests a modification to a trade request, updating the offered and requested characters.
	 * @param trade - The trade request to modify.
	 * @param newOfferedCharacters - The new characters being offered in the trade.
	 * @param newRequestedCharacters - The new characters being requested in the trade.
	 * @throws {InvalidStateError} If the trade is not in the AWAITING_INITIATOR or AWAITING_RECIPIENT status.
	 */
	requestModification(
		trade: TradeResolveable,
		newOfferedCharacters: string,
		newRequestedCharacters: string
	): void {
		trade = this.resolveTrade(trade);
		const tradeID = trade.id;

		this.tradeRepository.setOfferedCharacters(
			tradeID, newOfferedCharacters
		);
		this.tradeRepository.setRequestedCharacters(
			tradeID, newRequestedCharacters
		);

		switch (trade.status) {
			case TradeStatuses.AWAITING_INITIATOR:
				this.tradeRepository.setStatus(
					tradeID, TradeStatuses.AWAITING_RECIPIENT
				);
				break;

			case TradeStatuses.AWAITING_RECIPIENT:
				this.tradeRepository.setStatus(
					tradeID, TradeStatuses.AWAITING_INITIATOR
				);
				break;

			case TradeStatuses.ACCEPTED:
			case TradeStatuses.DECLINED:
			default:
				throw new InvalidStateError(
					`Cannot request modification on trade with status ${trade.status}.`
				)
		}
	}

	/**
	 * Sets the status of the given trade to IGNORED.
	 * @param trade - The trade to ignore.
	 */
	ignore(trade: TradeResolveable) {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.IGNORED
		)
	}

	/**
	 * Determines if the given trade has been responded to by either the initiating or recipient player.
	 * @param trade - The trade to check.
	 * @returns True if the trade has been responded to, false otherwise.
	 */
	hasBeenRespondedTo(trade: TradeResolveable): boolean {
		trade = this.resolveTrade(trade);
		return (
			trade.status !== TradeStatuses.AWAITING_INITIATOR && trade.status !== TradeStatuses.AWAITING_RECIPIENT
		);
	}

	/**
	 * Determines if the given player can respond to the given trade.
	 * @param trade - The trade to check.
	 * @param player - The player to check.
	 * @returns True if the player can respond, false otherwise.
	 */
	canPlayerRespond(
		trade: TradeResolveable,
		player: PlayerResolvable
	): boolean {
		trade = this.resolveTrade(trade);
		const playerID = this.playerService.resolveID(player);

		switch (trade.status) {
			case TradeStatuses.AWAITING_RECIPIENT:
				return trade.recipientPlayerID === playerID;

			case TradeStatuses.AWAITING_INITIATOR:
				return trade.initiatingPlayerID === playerID;

			case TradeStatuses.ACCEPTED:
			case TradeStatuses.DECLINED:
			default:
				return false;
		}
	}

	/**
	 * Determines if a given trade exists.
	 * @param trade - The trade resolvable to check for existence.
	 * @returns True if the given trade exists, false otherwise.
	 */
	isTrade(trade: TradeResolveable): boolean {
		const tradeID = this.resolveID(trade);
		return this.tradeRepository.doesTradeExist(tradeID);
	}

	/**
	 * Checks if a given trade request has been accepted.
	 * @param trade - The trade request to check.
	 * @returns True if the given trade request has been accepted, false otherwise.
	 */
	isAccepted(trade: TradeResolveable): boolean {
		trade = this.resolveTrade(trade);
		return trade.status === TradeStatuses.ACCEPTED;
	}

	/**
	 * Checks if a given trade request has been declined.
	 * @param trade - The trade request to check.
	 * @returns True if the given trade request has been declined, false otherwise.
	 */
	isDeclined(trade: TradeResolveable): boolean {
		trade = this.resolveTrade(trade);
		return trade.status === TradeStatuses.DECLINED;
	}
}