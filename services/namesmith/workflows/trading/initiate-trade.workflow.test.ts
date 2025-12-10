import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { getLatestActivityLog } from "../../mocks/mock-data/mock-activity-logs";
import { addMockPlayer } from "../../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service";
import { ActivityTypes } from "../../types/activity-log.types";
import { Player } from "../../types/player.types";
import { TradeStatuses } from "../../types/trade.types";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { initiateTrade } from "./initiate-trade.workflow";

describe('initiate-trade.workflow.ts', () => {
	let db: DatabaseQuerier;
	let tradeService: TradeService;
	let playerService: PlayerService;

	let SOME_INITIATING_PLAYER: Player;
	let SOME_RECIPIENT_PLAYER: Player;

	beforeEach(() => {
		setupMockNamesmith();
		({ tradeService, playerService } = getNamesmithServices());

		db = playerService.playerRepository.db;

		SOME_INITIATING_PLAYER = addMockPlayer(db, {
			inventory: "abcdefgh",
		});
		SOME_RECIPIENT_PLAYER = addMockPlayer(db, {
			inventory: "ijklmnop",
		});
	})

	describe('initiateTrade()', () => {
		it('logs an initiate trade activity log with accurate information', () => {
			const result =
				returnIfNotFailure(
					initiateTrade({
						initiatingPlayer: SOME_INITIATING_PLAYER,
						recipientPlayer: SOME_RECIPIENT_PLAYER,
						offeredCharacters: SOME_INITIATING_PLAYER.inventory,
						requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
					})
				);

			const activityLog = getLatestActivityLog(db);

			makeSure(activityLog.player.id).is(SOME_INITIATING_PLAYER.id);
			makeSure(activityLog.type).is(ActivityTypes.INITIATE_TRADE);
			makeSure(activityLog.involvedPlayer!.id).is(SOME_RECIPIENT_PLAYER.id);
			makeSure(activityLog.involvedTrade!.id).is(result.trade.id);
		});

		it('successfully initiates a trade between two players', () => {
			const result =
				returnIfNotFailure(
					initiateTrade({
						initiatingPlayer: SOME_INITIATING_PLAYER,
						recipientPlayer: SOME_RECIPIENT_PLAYER,
						offeredCharacters: SOME_INITIATING_PLAYER.inventory,
						requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
					})
				);

			const trade = tradeService.resolveTrade(result.trade.id);
			makeSure(trade).is(result.trade);

			makeSure(result.initiatingPlayer).is(SOME_INITIATING_PLAYER);
			makeSure(result.recipientPlayer).is(SOME_RECIPIENT_PLAYER);
			makeSure(result.trade.initiatingPlayer.id).is(SOME_INITIATING_PLAYER.id);
			makeSure(result.trade.recipientPlayer.id).is(SOME_RECIPIENT_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is(SOME_INITIATING_PLAYER.inventory);
			makeSure(result.trade.requestedCharacters).is(SOME_RECIPIENT_PLAYER.inventory);
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('returns initatorNotAPlayer if the initiating user is not a player', () => {
			const result = initiateTrade({
				initiatingPlayer: INVALID_PLAYER_ID,
				recipientPlayer: SOME_RECIPIENT_PLAYER,
				offeredCharacters: SOME_INITIATING_PLAYER.inventory,
				requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isInitatorNotAPlayer()
			).isTrue();
		});

		it('returns recipientNotAPlayer if the recipient user is not a player', () => {
			const result = initiateTrade({
				initiatingPlayer: SOME_INITIATING_PLAYER,
				recipientPlayer: INVALID_PLAYER_ID,
				offeredCharacters: SOME_INITIATING_PLAYER.inventory,
				requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isRecipientNotAPlayer()
			).isTrue();
		});

		it('returns TradeBetweenSamePlayersError if the initiating player attempts to trade with themselves', () => {
			const result = initiateTrade({
				initiatingPlayer: SOME_INITIATING_PLAYER,
				recipientPlayer: SOME_INITIATING_PLAYER,
				offeredCharacters: SOME_INITIATING_PLAYER.inventory,
				requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isTradeBetweenSamePlayers()
			).isTrue();
		});

		it('returns MissingOfferedCharactersError if the initiating player does not have the characters they are offering', () => {
			const result = initiateTrade({
				initiatingPlayer: SOME_INITIATING_PLAYER,
				recipientPlayer: SOME_RECIPIENT_PLAYER,
				offeredCharacters: SOME_INITIATING_PLAYER.inventory + 'z',
				requestedCharacters: SOME_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isMissingOfferedCharacters()
			).isTrue();
		});

		it('returns MissingRequestedCharactersError if the recipient player does not have the characters they are requesting', () => {
			const result = initiateTrade({
				initiatingPlayer: SOME_INITIATING_PLAYER,
				recipientPlayer: SOME_RECIPIENT_PLAYER,
				offeredCharacters: SOME_INITIATING_PLAYER.inventory,
				requestedCharacters: SOME_RECIPIENT_PLAYER.inventory + 'z',
			});

			makeSure(
				result.isMissingRequestedCharacters()
			).isTrue();
		});
	})
});