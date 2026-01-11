import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { TradeRepository } from "../repositories/trade.repository";
import { Player, PlayerResolvable } from '../types/player.types';
import { Trade, TradeID, TradeResolvable, TradeStatuses } from "../types/trade.types";
import { InvalidStateError, PlayerNotInvolvedInTradeError } from "../utilities/error.utility";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with recipes.
 */
export class TradeService {
	constructor (
		public tradeRepository: TradeRepository,
		public playerService: PlayerService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new TradeService(
			TradeRepository.fromDB(db),
			PlayerService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return TradeService.fromDB(db);
	}

	/**
	 * Resolves a recipe resolvable to a recipe object.
	 * @param tradeResolvable - The recipe resolvable to resolve.
	 * @returns The resolved recipe object.
	 * @throws {RecipeNotFoundError} If the recipe with the given ID is not found.
	 */
	resolveTrade(tradeResolvable: TradeResolvable): Trade {
		return this.tradeRepository.resolveTrade(tradeResolvable);
	}

	/**
	 * Resolves a trade resolvable to a trade ID.
	 * @param tradeResolvable - The trade resolvable to resolve.
	 * @returns The resolved trade ID.
	 */
	resolveID(tradeResolvable: TradeResolvable): TradeID {
		return this.tradeRepository.resolveID(tradeResolvable);
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
	 * Sets the status of the given trade to accepted.
	 * @param trade - The trade request to accept.
	 */
	updateStatusToAccepted(trade: TradeResolvable): void {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.ACCEPTED
		)
	}

	/**
	 * Declines a trade request, setting its status to declined.
	 * @param trade - The trade request to decline.
	 */
	updateStatusToDeclined(trade: TradeResolvable): void {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.DECLINED
		)
	}

	/**
	 * Requests a modification to a trade request, updating the offered and requested characters.
	 * @param tradeResolvable - The trade request to modify.
	 * @param newOfferedCharacters - The new characters being offered in the trade.
	 * @param newRequestedCharacters - The new characters being requested in the trade.
	 * @throws {InvalidStateError} If the trade is not in the AWAITING_INITIATOR or AWAITING_RECIPIENT status.
	 */
	requestModification(
		tradeResolvable: TradeResolvable,
		newOfferedCharacters: string,
		newRequestedCharacters: string
	): void {
		const trade = this.resolveTrade(tradeResolvable);
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
	ignore(trade: TradeResolvable) {
		const tradeID = this.resolveID(trade);
		this.tradeRepository.setStatus(
			tradeID, TradeStatuses.IGNORED
		)
	}

	/**
	 * Determines if the given trade has been responded to by either the initiating or recipient player.
	 * @param tradeResolvable - The trade to check.
	 * @returns True if the trade has been responded to, false otherwise.
	 */
	hasBeenRespondedTo(tradeResolvable: TradeResolvable): boolean {
		const trade = this.resolveTrade(tradeResolvable);
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
		trade: TradeResolvable,
		player: PlayerResolvable
	): boolean {
		trade = this.resolveTrade(trade);
		const playerID = this.playerService.resolveID(player);
		const playerAwaitingResponseFrom = this.getPlayerAwaitingResponseFrom(trade);

		if (playerAwaitingResponseFrom === null)
			return false;

		if (playerAwaitingResponseFrom.id === playerID)
			return true;
		else
			return false;
	}

	/**
	 * Returns the player that is waiting for a response from the otjher player in the trade.
	 * Returns null if the trade is already been responded to.
	 * @param tradeResolvable - The trade to check.
	 * @returns The player that is waiting for a response, or null if the trade has already been responded to.
	 */
	getPlayerWaitingForResponse(tradeResolvable: TradeResolvable): Player | null {
		const trade = this.resolveTrade(tradeResolvable);

		switch (trade.status) {
			case TradeStatuses.AWAITING_INITIATOR:
				return this.playerService.resolvePlayer(trade.recipientPlayer);

			case TradeStatuses.AWAITING_RECIPIENT:
				return this.playerService.resolvePlayer(trade.initiatingPlayer);

			case TradeStatuses.ACCEPTED:
			case TradeStatuses.DECLINED:
			default:
				return null;
		}
	}

	/**
	 * Gets the player that is awaiting a response from the given trade.
	 * If the trade has already been responded to, returns null.
	 * @param tradeResolvable - The trade to check.
	 * @returns The player that is awaiting a response, or null if the trade has already been responded to.
	 */
	getPlayerAwaitingResponseFrom(tradeResolvable: TradeResolvable): Player | null {
		const trade = this.resolveTrade(tradeResolvable);

		switch (trade.status) {
			case TradeStatuses.AWAITING_RECIPIENT:
				return this.playerService.resolvePlayer(
					trade.recipientPlayer
				);

			case TradeStatuses.AWAITING_INITIATOR:
				return this.playerService.resolvePlayer(
					trade.initiatingPlayer
				);

			case TradeStatuses.ACCEPTED:
			case TradeStatuses.DECLINED:
			default:
				return null;
		}
	}

	/**
	 * Determines if a given trade exists.
	 * @param trade - The trade resolvable to check for existence.
	 * @returns True if the given trade exists, false otherwise.
	 */
	isTrade(trade: TradeResolvable): boolean {
		const tradeID = this.resolveID(trade);
		return this.tradeRepository.doesTradeExist(tradeID);
	}

	/**
	 * Checks if a given trade request has been accepted.
	 * @param tradeResolvable - The trade request to check.
	 * @returns True if the given trade request has been accepted, false otherwise.
	 */
	isAccepted(tradeResolvable: TradeResolvable): boolean {
		const trade = this.resolveTrade(tradeResolvable);
		return trade.status === TradeStatuses.ACCEPTED;
	}

	/**
	 * Checks if a given trade request has been declined.
	 * @param tradeResolvable - The trade request to check.
	 * @returns True if the given trade request has been declined, false otherwise.
	 */
	isDeclined(tradeResolvable: TradeResolvable): boolean {
		const trade = this.resolveTrade(tradeResolvable);
		return trade.status === TradeStatuses.DECLINED;
	}

	/**
	 * Returns the characters that the given player is offering to give up in the given trade. Throws if the player is not involved in the trade.
	 * @param tradeResolvable - The trade to check.
	 * @param playerResolvable - The player to check.
	 * @returns The characters that the given player is offering to give up in the given trade.
	 */
	getCharactersPlayerIsGiving(
		tradeResolvable: TradeResolvable,
		playerResolvable: PlayerResolvable
	): string {
		const trade = this.resolveTrade(tradeResolvable);
		const player = this.playerService.resolvePlayer(playerResolvable);

		if (trade.initiatingPlayer.id === player.id)
			return trade.offeredCharacters;
		else if (trade.recipientPlayer.id === player.id)
			return trade.requestedCharacters;
		else
			throw new PlayerNotInvolvedInTradeError(player, trade);
	}

	/**
	 * Returns the characters that the given player is getting from the given trade. Throws if the player is not involved in the trade.
	 * @param tradeResolvable - The trade to check.
	 * @param playerResolvable - The player to check.
	 * @returns The characters that the given player is getting from the given trade.
	 */
	getCharactersPlayerIsGetting(
		tradeResolvable: TradeResolvable,
		playerResolvable: PlayerResolvable
	): string {
		const trade = this.resolveTrade(tradeResolvable);
		const player = this.playerService.resolvePlayer(playerResolvable);

		if (trade.initiatingPlayer.id === player.id)
			return trade.requestedCharacters;
		else if (trade.recipientPlayer.id === player.id)
			return trade.offeredCharacters;
		else
			throw new PlayerNotInvolvedInTradeError(player, trade);
	}
}