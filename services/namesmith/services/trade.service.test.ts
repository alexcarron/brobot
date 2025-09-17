import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_TRADE_ID } from "../constants/test.constants";
import { InvalidStateError, TradeNotFoundError } from "../utilities/error.utility";
import { createMockTradeService } from "../mocks/mock-services";
import { TradeService } from "./trade.service";
import { DatabaseQuerier } from "../database/database-querier";
import { TradeStatuses } from "../types/trade.types";
import { addMockTrade, mockTrades } from "../mocks/mock-data/mock-trades";
import { mockPlayers } from "../mocks/mock-data/mock-players";

describe('TradeService', () => {
	const MOCK_TRADE = mockTrades[0];
	const MOCK_INITIATING_PLAYER = mockPlayers[0];
	const MOCK_RECIPIENT_PLAYER = mockPlayers[1];

	let tradeService: TradeService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		tradeService = createMockTradeService();
		db = tradeService.tradeRepository.db;
	});

	describe('resolveTrade()', () => {
		it('resolves a trade from a trade object', () => {
			const result = tradeService.resolveTrade(MOCK_TRADE);
			expect(result).toEqual(MOCK_TRADE);
		});

		it('resolves a trade from a trade ID', () => {
			const result = tradeService.resolveTrade(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE);
		});

		it('resolves the current trade object from an outdated trade object', () => {
			const OUTDATED_TRADE = {
				...MOCK_TRADE,
				offeredCharacters: "OUTDATED",
				status: TradeStatuses.DECLINED
			};

			const result = tradeService.resolveTrade(OUTDATED_TRADE);
			expect(result).toEqual(MOCK_TRADE);
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
				initiatingPlayer: mockPlayers[2],
				recipientPlayer: mockPlayers[3].id,
				offeredCharacters: "xyz",
				requestedCharacters: "abc"
			});
			expect(newTrade.initiatingPlayerID).toEqual(mockPlayers[2].id);
			expect(newTrade.recipientPlayerID).toEqual(mockPlayers[3].id);
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
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
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
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
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
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns true if the trade is awaiting the initiator and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_INITIATING_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns false if the trade is awaiting the recipient and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_INITIATING_PLAYER.id
			);

			expect(result).toBe(false);
		});
		it('returns false if the trade is awaiting the initiator and the player is the recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is accepted already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is declined already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
				recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				status: TradeStatuses.DECLINED,
			});

			const result = tradeService.canPlayerRespond(
				trade, MOCK_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
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