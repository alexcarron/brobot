import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../../constants/test.constants";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { TradeStatuses } from "../../types/trade.types";
import { returnIfNotFailure } from "../workflow-result-creator";
import { initiateTrade } from "./initiate-trade.workflow";

describe('initiate-trade.workflow.ts', () => {
	let MOCK_INITIATING_PLAYER: Player;
	let MOCK_RECIPIENT_PLAYER: Player;

	let services: {
		tradeService: TradeService,
		playerService: PlayerService,
	};

	beforeEach(() => {
		setupMockNamesmith();
		const { tradeService, playerService } = getNamesmithServices();
		services = {
			tradeService,
			playerService
		};

		const players = playerService.playerRepository.getPlayers();
		MOCK_INITIATING_PLAYER = players[0];
		MOCK_RECIPIENT_PLAYER = players[1];
	})

	describe('initiateTrade()', () => {
		it('successfully initiates a trade between two players', () => {
			const result =
				returnIfNotFailure(
					initiateTrade({
						...services,
						initiatingPlayer: MOCK_INITIATING_PLAYER,
						recipientPlayer: MOCK_RECIPIENT_PLAYER,
						offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
						requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
					})
				);

			const { tradeService } = services;
			const trade = tradeService.resolveTrade(result.trade.id);
			makeSure(trade).is(result.trade);

			makeSure(result.initiatingPlayer).is(MOCK_INITIATING_PLAYER);
			makeSure(result.recipientPlayer).is(MOCK_RECIPIENT_PLAYER);
			makeSure(result.trade.initiatingPlayer.id).is(MOCK_INITIATING_PLAYER.id);
			makeSure(result.trade.recipientPlayer.id).is(MOCK_RECIPIENT_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is(MOCK_INITIATING_PLAYER.inventory);
			makeSure(result.trade.requestedCharacters).is(MOCK_RECIPIENT_PLAYER.inventory);
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('returns NonPlayerInitiatedTradeError if the initiating user is not a player', () => {
			const result = initiateTrade({
				...services,
				initiatingPlayer: INVALID_PLAYER_ID,
				recipientPlayer: MOCK_RECIPIENT_PLAYER,
				offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
				requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isNonPlayerInitiatedTrade()
			).isTrue();
		});

		it('returns NonPlayerReceivedTradeError if the recipient user is not a player', () => {
			const result = initiateTrade({
				...services,
				initiatingPlayer: MOCK_INITIATING_PLAYER,
				recipientPlayer: INVALID_PLAYER_ID,
				offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
				requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isNonPlayerReceivedTrade()
			).isTrue();
		});

		it('returns TradeBetweenSamePlayersError if the initiating player attempts to trade with themselves', () => {
			const result = initiateTrade({
				...services,
				initiatingPlayer: MOCK_INITIATING_PLAYER,
				recipientPlayer: MOCK_INITIATING_PLAYER,
				offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
				requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isTradeBetweenSamePlayers()
			).isTrue();
		});

		it('returns MissingOfferedCharactersError if the initiating player does not have the characters they are offering', () => {
			const result = initiateTrade({
				...services,
				initiatingPlayer: MOCK_INITIATING_PLAYER,
				recipientPlayer: MOCK_RECIPIENT_PLAYER,
				offeredCharacters: MOCK_INITIATING_PLAYER.inventory + 'z',
				requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
			});

			makeSure(
				result.isMissingOfferedCharacters()
			).isTrue();
		});

		it('returns MissingRequestedCharactersError if the recipient player does not have the characters they are requesting', () => {
			const result = initiateTrade({
				...services,
				initiatingPlayer: MOCK_INITIATING_PLAYER,
				recipientPlayer: MOCK_RECIPIENT_PLAYER,
				offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
				requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory + 'z',
			});

			makeSure(
				result.isMissingRequestedCharacters()
			).isTrue();
		});
	})
});