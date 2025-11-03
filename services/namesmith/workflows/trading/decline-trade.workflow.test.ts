import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TRADE_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { declineTrade } from "./decline-trade.workflow";
import { addMockTrade } from "../../mocks/mock-data/mock-trades";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { returnIfNotFailure } from "../workflow-result-creator";

describe('decline-trade.workflow.ts', () => {
	let MOCK_INITIATING_PLAYER: Player;
	let MOCK_RECIPIENT_PLAYER: Player;
	let MOCK_TRADE: Trade;

	let db: DatabaseQuerier;
	let tradeService: TradeService;

	beforeEach(() => {
		({ db, tradeService } = setupMockNamesmith());

		MOCK_INITIATING_PLAYER = addMockPlayer(db, {
			inventory: "Bbbdoevr",
			currentName: "Bobber"
		});
		MOCK_RECIPIENT_PLAYER = addMockPlayer(db, {
			inventory: "Xxxxyzander",
			currentName: "Xander"
		});

		MOCK_TRADE = addMockTrade(db, {
			initiatingPlayer: MOCK_INITIATING_PLAYER.id,
			recipientPlayer: MOCK_RECIPIENT_PLAYER.id,
				offeredCharacters: "berv",
				requestedCharacters: "Xx",
			status: TradeStatuses.AWAITING_RECIPIENT,
		});
	})

	describe('declineTrade()', () => {
		it('returns the trade, initating player, and recipient player in their current states', () => {
			const { trade, playerDeclining, playerDeclined } = returnIfNotFailure(declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			}));

			makeSure(trade).is({
				...MOCK_TRADE,
				status: TradeStatuses.DECLINED,
			});
			makeSure(playerDeclined).is(MOCK_INITIATING_PLAYER);
			makeSure(playerDeclining).is(MOCK_RECIPIENT_PLAYER);
		});

		it('declines the trade', () => {
			const { trade } = returnIfNotFailure(declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			}));

			makeSure(tradeService.isAccepted(MOCK_TRADE.id)).is(false);
			makeSure(tradeService.isDeclined(MOCK_TRADE.id)).is(true);
			makeSure(trade.status).is(TradeStatuses.DECLINED);
		});

		it('returns a NonPlayerRespondedToTradeError if the user declining the trade is not a player', () => {
			const result = declineTrade({
				...getNamesmithServices(),
				playerDeclining: INVALID_PLAYER_ID,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isNonPlayerRespondedToTrade()
			).isTrue();
		});

		it('returns a NonTradeRespondedToError if the trade being declined does not exist', () => {
			const result = declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_RECIPIENT_PLAYER,
				trade: INVALID_TRADE_ID,
			});

			makeSure(
				result.isNonTradeRespondedTo()
			).isTrue();
		});

		it('returns a TradeAlreadyRespondedToError if the trade was already ignored', () => {
			tradeService.ignore(MOCK_TRADE);

			const result = declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_INITIATING_PLAYER,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isTradeAlreadyRespondedTo()
			).isTrue();
		});

		it('returns a TradeAwaitingDifferentPlayerError if the player declining the trade is not the recipient while the trade is awaiting the recipient', () => {
			const result = declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_INITIATING_PLAYER,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isTradeAwaitingDifferentPlayer()
			).isTrue();
		});
	});
});