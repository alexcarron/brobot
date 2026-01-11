import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_TRADE_ID } from "../constants/test.constants";
import { InvalidStateError, PlayerNotInvolvedInTradeError, TradeNotFoundError } from "../utilities/error.utility";
import { TradeService } from "./trade.service";
import { DatabaseQuerier } from "../database/database-querier";
import { Trade, TradeStatuses } from "../types/trade.types";
import { addMockTrade } from "../mocks/mock-data/mock-trades";
import { Player } from "../types/player.types";
import { addMockPlayer } from "../mocks/mock-data/mock-players";

describe('TradeService', () => {
	let SOME_TRADE: Trade;
	let SOME_INITIATING_PLAYER: Player;
	let SOME_RECIPIENT_PLAYER: Player;

	let tradeService: TradeService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		tradeService = TradeService.asMock();
		db = tradeService.tradeRepository.db;

		SOME_INITIATING_PLAYER = addMockPlayer(db);
		SOME_RECIPIENT_PLAYER = addMockPlayer(db);
		SOME_TRADE = addMockTrade(db);
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
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "xyz",
				requestedCharacters: "abc"
			});
			expect(newTrade.initiatingPlayer.id).toEqual(SOME_INITIATING_PLAYER.id);
			expect(newTrade.recipientPlayer.id).toEqual(SOME_RECIPIENT_PLAYER.id);
			expect(newTrade.offeredCharacters).toEqual("xyz");
			expect(newTrade.requestedCharacters).toEqual("abc");
		});
	});

	describe('accept()', () => {
		it('sets the trade status to accepted', () => {
			const trade = addMockTrade(db, {
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			tradeService.updateStatusToAccepted(trade);
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
			tradeService.updateStatusToDeclined(trade);
			const updatedTrade = tradeService.resolveTrade(trade.id);
			expect(updatedTrade.status).toEqual(TradeStatuses.DECLINED);
			expect(tradeService.isDeclined(updatedTrade)).toBe(true);
			expect(tradeService.isAccepted(updatedTrade)).toBe(false);
		});
	});

	describe('requestModification()', () => {
		it('modifies the trade with new offered, requested characters, and status when awaiting initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
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
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
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
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns true if the trade is awaiting the initiator and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_INITIATING_PLAYER.id
			);

			expect(result).toBe(true);
		});

		it('returns false if the trade is awaiting the recipient and the player is the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_INITIATING_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is awaiting the initiator and the player is the recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is accepted already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});

		it('returns false if the trade is declined already', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.DECLINED,
			});

			const result = tradeService.canPlayerRespond(
				trade, SOME_RECIPIENT_PLAYER.id
			);

			expect(result).toBe(false);
		});
	});

	describe('getPlayerWaitingForResponse()', () => {
		it('returns the initiating player if the trade if the intiator is waiting for a response from the recipient', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toEqual(SOME_INITIATING_PLAYER);
		});

		it('returns the recipient player if the trade if the recipient is waiting for a response from the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toEqual(SOME_RECIPIENT_PLAYER);
		});

		it('returns null if the trade is accepted', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.ACCEPTED,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toBeNull();
		});

		it('returns null if the trade is declined', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.DECLINED,
			});

			const result = tradeService.getPlayerWaitingForResponse(trade);

			expect(result).toBeNull();
		})
	});

	describe('getPlayerAwaitingResponseFrom()', () => {
		it('returns the recipient player if the trade is awaiting the recipient', () => {
			const trade = addMockTrade(db, {
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getPlayerAwaitingResponseFrom(trade);

			expect(result).toEqual(SOME_RECIPIENT_PLAYER);
		});

		it('returns the initiating player if the trade is awaiting the initiator', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const result = tradeService.getPlayerAwaitingResponseFrom(trade);

			expect(result).toEqual(SOME_INITIATING_PLAYER);
		});

		it('returns null if the trade is accepted or declined', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
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

	describe('getCharactersPlayerIsGiving()', () => {
		it('return the offered characters if the given player initiated the trade', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getCharactersPlayerIsGiving(trade, SOME_INITIATING_PLAYER);

			makeSure(result).is("abc");
		});


		it('return the requested characters if the given player recieved the trade', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getCharactersPlayerIsGiving(trade, SOME_RECIPIENT_PLAYER);

			makeSure(result).is("def");
		});

		it('throws a PlayerNotInvolvedInTrade error if the player is not involved in the trade', () => {
			const SOME_OTHER_PLAYER = addMockPlayer(db);
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			makeSure(() => tradeService.getCharactersPlayerIsGiving(trade, SOME_OTHER_PLAYER)).throws(PlayerNotInvolvedInTradeError);
		});
	});

	describe('getCharactersPlayerIsGetting()', () => {
		it('return the requested characters if the given player initiated the trade', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getCharactersPlayerIsGetting(trade, SOME_INITIATING_PLAYER);

			makeSure(result).is("def");
		});


		it('return the offered characters if the given player recieved the trade', () => {
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const result = tradeService.getCharactersPlayerIsGetting(trade, SOME_RECIPIENT_PLAYER);

			makeSure(result).is("abc");
		});

		it('throws a PlayerNotInvolvedInTrade error if the player is not involved in the trade', () => {
			const SOME_OTHER_PLAYER = addMockPlayer(db);
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_INITIATING_PLAYER.id,
				recipientPlayer: SOME_RECIPIENT_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			makeSure(() => tradeService.getCharactersPlayerIsGetting(trade, SOME_OTHER_PLAYER)).throws(PlayerNotInvolvedInTradeError);
		});
	});
});