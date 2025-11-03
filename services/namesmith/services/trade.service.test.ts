import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_TRADE_ID } from "../constants/test.constants";
import { InvalidStateError, TradeNotFoundError } from "../utilities/error.utility";
import { createMockTradeService } from "../mocks/mock-services";
import { TradeService } from "./trade.service";
import { DatabaseQuerier } from "../database/database-querier";
import { Trade, TradeStatuses } from "../types/trade.types";
import { addMockTrade, mockTrades } from "../mocks/mock-data/mock-trades";
import { mockPlayers } from "../mocks/mock-data/mock-players";
import { Player } from "../types/player.types";

describe('TradeService', () => {
	let SOME_TRADE: Trade;
	let MOCK_INITIATING_PLAYER: Player;
	let MOCK_RECIPIENT_PLAYER: Player;

	let tradeService: TradeService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		tradeService = createMockTradeService();
		db = tradeService.tradeRepository.db;

		const players = tradeService.playerService.playerRepository.getPlayers();
		MOCK_INITIATING_PLAYER = players[0];
		MOCK_RECIPIENT_PLAYER = players[1];

		SOME_TRADE = tradeService.tradeRepository.getTradeOrThrow(mockTrades[0].id!);
	});

	describe('resolveTrade()', () => {
		it('resolves a trade from a trade object', () => {
			const result = tradeService.resolveTrade(SOME_TRADE);
			expect(result).toEqual(SOME_TRADE);
		});

		it('resolves a trade from a trade ID', () => {
			const result = tradeService.resolveTrade(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE);
		});

		it('resolves the current trade object from an outdated trade object', () => {
			const OUTDATED_TRADE = {
				...SOME_TRADE,
				offeredCharacters: "OUTDATED",
				status: TradeStatuses.DECLINED
			};

			const result = tradeService.resolveTrade(OUTDATED_TRADE);
			expect(result).toEqual(SOME_TRADE);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeService.resolveTrade(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		});
	});

	describe('createTradeRequest()', () => {
		it('creates and returns a new trade object', () => {
			const newTrade = tradeService.createTradeRequest({
				initiatingPlayer: mockPlayers[2].id,
				recipientPlayer: mockPlayers[3].id,
				offeredCharacters: "xyz",
				requestedCharacters: "abc"
			});
			expect(newTrade.initiatingPlayer.id).toEqual(mockPlayers[2].id);
			expect(newTrade.recipientPlayer.id).toEqual(mockPlayers[3].id);
			expect(newTrade.offeredCharacters).toEqual("xyz");
			expect(newTrade.requestedCharacters).toEqual("abc");
		});
	});

	describe('accept()', () => {
		it('sets the trade status to accepted', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			tradeService.accept(trade);
			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.status).toEqual(TradeStatuses.ACCEPTED);
			expect(tradeService.isAccepted(updatedTrade)).toBe(true);
			expect(tradeService.isDeclined(updatedTrade)).toBe(false);
		});
	});

	describe('decline()', () => {
		it('sets the trade status to declined', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			tradeService.decline(trade);
			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.status).toEqual(TradeStatuses.DECLINED);
			expect(tradeService.isDeclined(updatedTrade)).toBe(true);
			expect(tradeService.isAccepted(updatedTrade)).toBe(false);
		});
	});

	describe('requestModification()', () => {
		it('modifies the trade with new offered, requested characters, and status when awaiting initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				offeredCharacters: "berv",
				requestedCharacters: "Xx",
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			tradeService.requestModification(trade, "xyz", "abc");

			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.offeredCharacters).toEqual("xyz");
			expect(updatedTrade.requestedCharacters).toEqual("abc");
			expect(updatedTrade.status).toEqual(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('modifies the trade with new offered, requested characters, and status when awaiting recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				offeredCharacters: "berv",
				requestedCharacters: "Xx",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			tradeService.requestModification(trade, "xyz", "abc");

			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.offeredCharacters).toEqual("xyz");
			expect(updatedTrade.requestedCharacters).toEqual("abc");
			expect(updatedTrade.status).toEqual(TradeStatuses.AWAITING_INITIATOR);
		});

		it('throws InvalidStateError if trade status is accepted', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.ACCEPTED,
			});

			makeSure(() =>
				tradeService.requestModification(trade, "xyz", "abc")
			).throws(InvalidStateError);
		});

		it('throws InvalidStateError if trade status is declined', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.DECLINED,
			});

			makeSure(() =>
				tradeService.requestModification(trade, "xyz", "abc")
			).throws(InvalidStateError);
		});
	});

	describe('ignore()', () => {
		it('sets the trade status to ignored', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			tradeService.ignore(trade);
			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.status).toEqual(TradeStatuses.IGNORED);
		});
	});

	describe('canPlayerRespond()', () => {
		it('returns true the trade is awaiting the recipient and the player is the recipient', () => {
			const trade = addMockTrade(db, {
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns true if the trade is awaiting the initiator and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_INITIATING_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns false if the trade is awaiting the recipient and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_INITIATING_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is awaiting the initiator and the player is the recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is accepted already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is declined already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.DECLINED,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});
	});

	describe('getPlayerWaitingForResponse()', () => {
		it('returns the initiating player if the trade if the intiator is waiting for a response from the recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toEqual(MOCK_INITIATING_PLAYER);
		});

		it('returns the recipient player if the trade if the recipient is waiting for a response from the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toEqual(MOCK_RECIPIENT_PLAYER);
		});

		it('returns null if the trade is accepted', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toBeNull();
		});

		it('returns null if the trade is declined', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.DECLINED,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toBeNull();
		})
	});

	describe('getPlayerAwaitingResponseFrom()', () => {
		it('returns the recipient player if the trade is awaiting the recipient', () => {
			const trade = addMockTrade(db, {
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getPlayerAwaitingResponseFrom(trade);

			expect(result).toEqual(MOCK_RECIPIENT_PLAYER);
		});

		it('returns the initiating player if the trade is awaiting the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.getPlayerAwaitingResponseFrom(trade);

			expect(result).toEqual(MOCK_INITIATING_PLAYER);
		});

		it('returns null if the trade is accepted or declined', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: MOCK_INITIATING_PLAYER.id,
				recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});
			const result = tradeService.getPlayerAwaitingResponseFrom(trade);
			expect(result).toBeNull();
		});
	});

	describe('isDeclined()', () => {
		it('returns true if the trade status is declined', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.DECLINED,
			});
			expect(tradeService.isDeclined(trade)).toBe(true);
		});
		it('returns false if the trade status is not declined', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			expect(tradeService.isDeclined(trade)).toBe(false);
		});
	});

	describe('isAccepted()', () => {
		it('returns true if the trade status is accepted', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.ACCEPTED,
			});
			expect(tradeService.isAccepted(trade)).toBe(true);
		});

		it('returns false if the trade status is not accepted', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			expect(tradeService.isAccepted(trade)).toBe(false);
		});
	});
});