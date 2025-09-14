import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TRADE_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer, addMockTrade } from "../../mocks/mock-database";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { NonPlayerRespondedToTradeError, NonTradeRespondedToError, TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError } from "../../utilities/error.utility";
import { declineTrade } from "./decline-trade.workflow";
import { returnIfNotError } from '../../../../utilities/error-utils';

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
			initiatingPlayerID: MOCK_INITIATING_PLAYER.id,
			recipientPlayerID: MOCK_RECIPIENT_PLAYER.id,
				offeredCharacters: "berv",
				requestedCharacters: "Xx",
			status: TradeStatuses.AWAITING_RECIPIENT,
		});
	})

	describe('declineTrade()', () => {
		it('returns the trade, initating player, and recipient player in their current states', () => {
			const { trade, playerDeclining, playerDeclined } = returnIfNotError(declineTrade({
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
			const { trade } = returnIfNotError(declineTrade({
				...getNamesmithServices(),
				playerDeclining: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			}));

			makeSure(tradeService.isAccepted(MOCK_TRADE.id)).is(false);
			makeSure(tradeService.isDeclined(MOCK_TRADE.id)).is(true);
			makeSure(trade.status).is(TradeStatuses.DECLINED);
		});

		it('returns a NonPlayerRespondedToTradeError if the user declining the trade is not a player', () => {
			makeSure(
				declineTrade({
					...getNamesmithServices(),
					playerDeclining: INVALID_PLAYER_ID,
					trade: MOCK_TRADE,
				})
			).isAnInstanceOf(NonPlayerRespondedToTradeError);
		});

		it('returns a NonTradeRespondedToError if the trade being declined does not exist', () => {
			makeSure(
				declineTrade({
					...getNamesmithServices(),
					playerDeclining: MOCK_RECIPIENT_PLAYER,
					trade: INVALID_TRADE_ID,
				})
			).isAnInstanceOf(NonTradeRespondedToError);
		});

		it('returns a TradeAlreadyRespondedToError if the trade was already ignored', () => {
			tradeService.ignore(MOCK_TRADE);

			makeSure(
				declineTrade({
					...getNamesmithServices(),
					playerDeclining: MOCK_INITIATING_PLAYER,
					trade: MOCK_TRADE,
				})
			).isAnInstanceOf(TradeAlreadyRespondedToError);
		});

		it('returns a TradeAwaitingDifferentPlayerError if the player declining the trade is not the recipient while the trade is awaiting the recipient', () => {
			makeSure(
				declineTrade({
					...getNamesmithServices(),
					playerDeclining: MOCK_INITIATING_PLAYER,
					trade: MOCK_TRADE,
				})
			).isAnInstanceOf(TradeAwaitingDifferentPlayerError);
		});
	});
});