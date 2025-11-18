import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_TRADE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { Trade, TradeStatuses } from '../types/trade.types';
import { CannotCreateTradeError, TradeAlreadyExistsError, TradeNotFoundError } from "../utilities/error.utility";
import { createMockTradeRepo } from "../mocks/mock-repositories";
import { TradeRepository } from "./trade.repository";
import { addMockTrade, mockTrades } from "../mocks/mock-data/mock-trades";
import { mockPlayers } from "../mocks/mock-data/mock-players";

describe('TradeRepository', () => {
	let tradeRepository: TradeRepository;
	let db: DatabaseQuerier;

	let SOME_TRADE: Trade;

	beforeEach(() => {
		tradeRepository = createMockTradeRepo();
		db = tradeRepository.db;

		SOME_TRADE = tradeRepository.getTradeOrThrow(mockTrades[0].id!);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('getTrades()', () => {
		it('returns an array of trade objects', () => {
			const trades = tradeRepository.getTrades();
			makeSure(trades).hasLengthOf(mockTrades.length);
			makeSure(trades).contains(SOME_TRADE);
			makeSure(trades).haveProperties('id', 'initiatingPlayer', 'recipientPlayer', 'offeredCharacters', 'requestedCharacters', 'status');
		});
	});

	describe('getTradeByID()', () => {
		it('returns a trade object', () => {
			const result = tradeRepository.getTradeByID(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE);
		});

		it('returns a created trade object', () => {
			const trade = addMockTrade(db, {
				offeredCharacters: "aaa",
				requestedCharacters: "bbb",
				status: TradeStatuses.DECLINED
			});

			const result = tradeRepository.getTradeByID(trade.id);
			expect(result).toEqual(trade);
		})

		it('returns null if trade does not exist', () => {
			const result = tradeRepository.getTradeByID(INVALID_TRADE_ID);
			expect(result).toBeNull();
		})
	});

		describe('getTradeOrThrow()', () => {
		it('returns a trade object', () => {
			const result = tradeRepository.getTradeOrThrow(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getTradeOrThrow(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('createTrade()', () => {
		it('creates a new trade and returns its ID', () => {
			const trade = {
				initiatingPlayerID: mockPlayers[2].id,
				recipientPlayerID: mockPlayers[3].id,
				offeredCharacters: "aaa",
				requestedCharacters: "bbb"
			};

			const tradeID = tradeRepository.createTrade(trade);
			makeSure(tradeID).isANumber();

			const createdTrade = tradeRepository.getTradeOrThrow(tradeID);
			expect(createdTrade.id).toEqual(tradeID);
			expect(createdTrade.status).toEqual(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('throws CannotCreateTradeError if trade cannot be created', () => {
			jest.spyOn(db, 'run')
				.mockImplementationOnce(() => ({
					changes: 0,
					lastInsertRowid: -1
				}));

			const trade = {
				initiatingPlayerID: mockPlayers[2].id,
				recipientPlayerID: mockPlayers[3].id,
				offeredCharacters: "aaa",
				requestedCharacters: "bbb"
			};

			makeSure(
				() => tradeRepository.createTrade(trade)
			).throws(CannotCreateTradeError);
		})
	});

	describe('getInitiatingPlayer()', () => {
		it('returns the ID of the initiating player', () => {
			const result = tradeRepository.getInitiatingPlayerID(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE.initiatingPlayer.id);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getInitiatingPlayerID(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('getRecipientPlayer()', () => {
		it('returns the ID of the recipient player', () => {
			const result = tradeRepository.getRecipientPlayerID(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE.recipientPlayer.id);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getRecipientPlayerID(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('getOfferedCharacters()', () => {
		it('returns the offered characters', () => {
			const result = tradeRepository.getOfferedCharacters(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE.offeredCharacters);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getOfferedCharacters(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('setOfferedCharacters()', () => {
		it('sets the offered characters', () => {
			tradeRepository.setOfferedCharacters(SOME_TRADE.id, "aaa");
			const result = tradeRepository.getOfferedCharacters(SOME_TRADE.id);
			expect(result).toEqual("aaa");
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.setOfferedCharacters(INVALID_TRADE_ID, "aaa")
			).throws(TradeNotFoundError);
		});
	})

	describe('getRequestedCharacters()', () => {
		it('returns the requested characters', () => {
			const result = tradeRepository.getRequestedCharacters(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE.requestedCharacters);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getRequestedCharacters(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('setRequestedCharacters()', () => {
		it('sets the requested characters', () => {
			tradeRepository.setRequestedCharacters(SOME_TRADE.id, "aaa");
			const result = tradeRepository.getRequestedCharacters(SOME_TRADE.id);
			expect(result).toEqual("aaa");
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.setRequestedCharacters(INVALID_TRADE_ID, "aaa")
			).throws(TradeNotFoundError);
		});
	});

	describe('getStatus()', () => {
		it('returns the trade status', () => {
			const result = tradeRepository.getStatus(SOME_TRADE.id);
			expect(result).toEqual(SOME_TRADE.status);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getStatus(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		});
	});

	describe('setStatus()', () => {
		it('sets the trade status', () => {
			tradeRepository.setStatus(SOME_TRADE.id, TradeStatuses.ACCEPTED);
			const result = tradeRepository.getStatus(SOME_TRADE.id);
			expect(result).toEqual(TradeStatuses.ACCEPTED);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.setStatus(INVALID_TRADE_ID, TradeStatuses.ACCEPTED)
			).throws(TradeNotFoundError);
		});
	});

	describe('addTrade()', () => {
		it('adds a trade with the given ID', () => {
			const trade = tradeRepository.addTrade({
				id: 10001,
				initiatingPlayer: mockPlayers[0].id,
				recipientPlayer: mockPlayers[1].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT
			});

			makeSure(trade).containsProperties({
				id: 10001,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT
			});

			makeSure(trade.initiatingPlayer.id).is(mockPlayers[0].id);
			makeSure(trade.recipientPlayer.id).is(mockPlayers[1].id);

			const resolvedTrade = tradeRepository.getTradeByID(10001);
			makeSure(resolvedTrade).is(trade);
		});

		it('generates an ID when none is provided', () => {
			const trade = tradeRepository.addTrade({
				initiatingPlayer: mockPlayers[0].id,
				recipientPlayer: mockPlayers[1].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT
			});

			const resolvedTrade = tradeRepository.getTradeByID(trade.id);
			makeSure(resolvedTrade).is(trade);
		});

		it('throws a TradeAlreadyExistsError if the trade already exists', () => {
			makeSure(() =>
				tradeRepository.addTrade({
					id: SOME_TRADE.id,
					initiatingPlayer: mockPlayers[0].id,
					recipientPlayer: mockPlayers[1].id,
					offeredCharacters: "abc",
					requestedCharacters: "def",
					status: TradeStatuses.AWAITING_RECIPIENT
				})
			).throws(TradeAlreadyExistsError);
		});
	});

	describe('updateTrade()', () => {
		it('updates a trade with the given ID', () => {
			tradeRepository.updateTrade({
				id: SOME_TRADE.id,
				initiatingPlayer: mockPlayers[1].id,
				recipientPlayer: mockPlayers[0].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.ACCEPTED
			});

			const resolvedTrade = tradeRepository.getTradeOrThrow(SOME_TRADE.id);
			makeSure(resolvedTrade).containsProperties({
				id: SOME_TRADE.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.ACCEPTED
			});

			makeSure(resolvedTrade.initiatingPlayer.id).is(mockPlayers[1].id);
			makeSure(resolvedTrade.recipientPlayer.id).is(mockPlayers[0].id);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.updateTrade({
					id: INVALID_TRADE_ID,
					initiatingPlayer: mockPlayers[1].id,
					recipientPlayer: mockPlayers[0].id,
					offeredCharacters: "abc",
					requestedCharacters: "def",
					status: TradeStatuses.ACCEPTED
				})
			).throws(TradeNotFoundError);
		});
	});

	describe('removeTrade()', () => {
		it('removes the trade', () => {
			tradeRepository.removeTrade(SOME_TRADE.id);
			const result = tradeRepository.getTradeByID(SOME_TRADE.id);
			expect(result).toBeNull();
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.removeTrade(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		});
	});
});