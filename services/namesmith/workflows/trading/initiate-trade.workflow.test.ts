import { returnIfNotError } from "../../../../utilities/error-utils";
import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../../constants/test.constants";
import { mockPlayers } from "../../mocks/mock-repositories";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service";
import { TradeStatuses } from "../../types/trade.types";
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerInitiatedTradeError, NonPlayerReceivedTradeError } from "../../utilities/error.utility";
import { initiateTrade } from "./initiate-trade.workflow";

describe('initiate-trade.workflow.ts', () => {
	const MOCK_INITIATING_PLAYER = mockPlayers[0];
	const MOCK_RECIPIENT_PLAYER = mockPlayers[1];

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
	})

	describe('initiateTrade()', () => {
		it('successfully initiates a trade between two players', () => {
			const result =
				returnIfNotError(
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
			makeSure(result.trade.initiatingPlayerID).is(MOCK_INITIATING_PLAYER.id);
			makeSure(result.trade.recipientPlayerID).is(MOCK_RECIPIENT_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is(MOCK_INITIATING_PLAYER.inventory);
			makeSure(result.trade.requestedCharacters).is(MOCK_RECIPIENT_PLAYER.inventory);
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('returns NonPlayerInitiatedTradeError if the initiating user is not a player', () => {
			makeSure(
				initiateTrade({
					...services,
					initiatingPlayer: INVALID_PLAYER_ID,
					recipientPlayer: MOCK_RECIPIENT_PLAYER,
					offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
					requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
				})
			).isAnInstanceOf(NonPlayerInitiatedTradeError);
		});

		it('returns NonPlayerReceivedTradeError if the recipient user is not a player', () => {
			makeSure(
				initiateTrade({
					...services,
					initiatingPlayer: MOCK_INITIATING_PLAYER,
					recipientPlayer: INVALID_PLAYER_ID,
					offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
					requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
				})
			).isAnInstanceOf(NonPlayerReceivedTradeError);
		});

		it('returns MissingOfferedCharactersError if the initiating player does not have the characters they are offering', () => {
			makeSure(
				initiateTrade({
					...services,
					initiatingPlayer: MOCK_INITIATING_PLAYER,
					recipientPlayer: MOCK_RECIPIENT_PLAYER,
					offeredCharacters: MOCK_INITIATING_PLAYER.inventory + 'z',
					requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory,
				})
			).isAnInstanceOf(MissingOfferedCharactersError);
		});

		it('returns MissingRequestedCharactersError if the recipient player does not have the characters they are requesting', () => {
			makeSure(
				initiateTrade({
					...services,
					initiatingPlayer: MOCK_INITIATING_PLAYER,
					recipientPlayer: MOCK_RECIPIENT_PLAYER,
					offeredCharacters: MOCK_INITIATING_PLAYER.inventory,
					requestedCharacters: MOCK_RECIPIENT_PLAYER.inventory + 'z',
				})
			).isAnInstanceOf(MissingRequestedCharactersError);
		});
	})
});