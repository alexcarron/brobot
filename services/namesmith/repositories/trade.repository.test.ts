import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_TRADE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { TradeStatuses } from '../types/trade.types';
import { CannotCreateTradeError, TradeAlreadyExistsError, TradeNotFoundError } from "../utilities/error.utility";
import { createMockTradeRepo } from "../mocks/mock-repositories";
import { TradeRepository } from "./trade.repository";
import { addMockTrade, mockTrades } from "../mocks/mock-data/mock-trades";
import { mockPlayers } from "../mocks/mock-data/mock-players";

describe('TradeRepoistory', () => {
	let tradeRepository: TradeRepository;
	let db: DatabaseQuerier;
	const MOCK_TRADE = mockTrades[0];

	beforeEach(() => {
		tradeRepository = createMockTradeRepo();
		db = tradeRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('getTrades()', () => {
		it('returns an array of trade objects', () => {
			const result = tradeRepository.getTrades();
			expect(result).toEqual(mockTrades);
		});
	});

	describe('getTradeByID()', () => {
		it('returns a trade object', () => {
			const result = tradeRepository.getTradeByID(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE);
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
			const result = tradeRepository.getTradeOrThrow(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE);
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

			const createdTrade = tradeRepository.getTradeByID(tradeID);
			expect(createdTrade).toEqual({
				...trade,
				id: tradeID,
				status: TradeStatuses.AWAITING_RECIPIENT
			});
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
			const result = tradeRepository.getInitiatingPlayerID(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE.initiatingPlayerID);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getInitiatingPlayerID(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('getRecipientPlayer()', () => {
		it('returns the ID of the recipient player', () => {
			const result = tradeRepository.getRecipientPlayerID(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE.recipientPlayerID);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getRecipientPlayerID(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('getOfferedCharacters()', () => {
		it('returns the offered characters', () => {
			const result = tradeRepository.getOfferedCharacters(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE.offeredCharacters);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getOfferedCharacters(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('setOfferedCharacters()', () => {
		it('sets the offered characters', () => {
			tradeRepository.setOfferedCharacters(MOCK_TRADE.id, "aaa");
			const result = tradeRepository.getOfferedCharacters(MOCK_TRADE.id);
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
			const result = tradeRepository.getRequestedCharacters(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE.requestedCharacters);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getRequestedCharacters(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		})
	});

	describe('setRequestedCharacters()', () => {
		it('sets the requested characters', () => {
			tradeRepository.setRequestedCharacters(MOCK_TRADE.id, "aaa");
			const result = tradeRepository.getRequestedCharacters(MOCK_TRADE.id);
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
			const result = tradeRepository.getStatus(MOCK_TRADE.id);
			expect(result).toEqual(MOCK_TRADE.status);
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.getStatus(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		});
	});

	describe('setStatus()', () => {
		it('sets the trade status', () => {
			tradeRepository.setStatus(MOCK_TRADE.id, TradeStatuses.ACCEPTED);
			const result = tradeRepository.getStatus(MOCK_TRADE.id);
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
				initiatingPlayerID: mockPlayers[0].id,
				recipientPlayerID: mockPlayers[1].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT
			});

			makeSure(trade).is({
				id: 10001,
				initiatingPlayerID: mockPlayers[0].id,
				recipientPlayerID: mockPlayers[1].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT
			});

			const resolvedTrade = tradeRepository.getTradeByID(10001);
			makeSure(resolvedTrade).is(trade);
		});

		it('generates an ID when none is provided', () => {
			const trade = tradeRepository.addTrade({
				initiatingPlayerID: mockPlayers[0].id,
				recipientPlayerID: mockPlayers[1].id,
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
					id: MOCK_TRADE.id,
					initiatingPlayerID: mockPlayers[0].id,
					recipientPlayerID: mockPlayers[1].id,
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
				id: MOCK_TRADE.id,
				initiatingPlayerID: mockPlayers[1].id,
				recipientPlayerID: mockPlayers[0].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.ACCEPTED
			});

			const resolvedTrade = tradeRepository.getTradeByID(MOCK_TRADE.id);
			makeSure(resolvedTrade).is({
				id: MOCK_TRADE.id,
				initiatingPlayerID: mockPlayers[1].id,
				recipientPlayerID: mockPlayers[0].id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.ACCEPTED
			});
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.updateTrade({
					id: INVALID_TRADE_ID,
					initiatingPlayerID: mockPlayers[1].id,
					recipientPlayerID: mockPlayers[0].id,
					offeredCharacters: "abc",
					requestedCharacters: "def",
					status: TradeStatuses.ACCEPTED
				})
			).throws(TradeNotFoundError);
		});
	});

	describe('removeTrade()', () => {
		it('removes the trade', () => {
			tradeRepository.removeTrade(MOCK_TRADE.id);
			const result = tradeRepository.getTradeByID(MOCK_TRADE.id);
			expect(result).toBeNull();
		});

		it('throws TradeNotFoundError if trade does not exist', () => {
			makeSure(() =>
				tradeRepository.removeTrade(INVALID_TRADE_ID)
			).throws(TradeNotFoundError);
		});
	});
});