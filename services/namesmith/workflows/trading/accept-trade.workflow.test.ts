jest.mock("../../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
	sendToPublishedNamesChannel: jest.fn(),
	sendToNamesToVoteOnChannel: jest.fn(),
	isNonPlayer: jest.fn((member) => Promise.resolve(
		member.isPlayer === undefined ?
			false :
			!member.isPlayer
	)),
	resetMemberToNewPlayer: jest.fn(),
}));

jest.mock("../../utilities/discord-fetch.utility", () => ({
	fetchNamesmithGuildMember: jest.fn( (playerID) =>
		Promise.resolve({ id: playerID })
	),
	fetchNamesmithGuildMembers: jest.fn(() =>
		Promise.resolve(mockPlayers.map((player) => ({ id: player.id })))
	),
}));

jest.mock("../../../../utilities/discord-action-utils", () => ({
	addButtonToMessageContents: jest.fn(),
}));

import { makeSure } from "../../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_TRADE_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { addMockPlayer, editMockPlayer, mockPlayers } from "../../mocks/mock-data/mock-players";
import { addMockTrade } from "../../mocks/mock-data/mock-trades";
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { TradeService } from "../../services/trade.service";
import { Player } from "../../types/player.types";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { returnIfNotFailure } from "../workflow-result-creator";
import { acceptTrade } from "./accept-trade.workflow";

describe('accept-trade.workflow.ts', () => {
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

	describe('acceptTrade()', () => {
		it('returns the trade, initiating player, and recipient player', async () => {
			const result = returnIfNotFailure(await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			}));

			// TO DO: replace mock players with literal values
			expect(result.trade).toEqual({
				...MOCK_TRADE,
				status: TradeStatuses.ACCEPTED,
			});
			expect(result.initiatingPlayer).toEqual({
				...MOCK_INITIATING_PLAYER,
				inventory: 'BbdoXx',
				currentName: 'BobXx',
			});
			expect(result.recipientPlayer).toEqual({
				...MOCK_RECIPIENT_PLAYER,
				inventory: 'xxyzanderberv',
				currentName: 'anderberv',
			});
		});

		it('accepts the trade', async () => {
			await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			});

			const { tradeService } = getNamesmithServices();
			const updatedTrade = tradeService.resolveTrade(MOCK_TRADE.id);
			expect(updatedTrade.status).toBe(TradeStatuses.ACCEPTED);
			expect(tradeService.isAccepted(updatedTrade)).toBe(true);
			expect(tradeService.isDeclined(updatedTrade)).toBe(false);
		});

		it('transfers characters between the two players', async () => {
			await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER,
				trade: MOCK_TRADE,
			});

			const { playerService } = getNamesmithServices();
			const updatedInitiatingPlayer = playerService.resolvePlayer(MOCK_INITIATING_PLAYER.id);
			const updatedRecipientPlayer = playerService.resolvePlayer(MOCK_RECIPIENT_PLAYER.id);

			expect(updatedInitiatingPlayer.inventory).toBe("BbdoXx");
			expect(updatedInitiatingPlayer.currentName).toBe("BobXx");
			expect(updatedRecipientPlayer.inventory).toBe("xxyzanderberv");
			expect(updatedRecipientPlayer.currentName).toBe("anderberv");
		});

		it('returns a NonPlayerAcceptedTradeError if the user accepting the trade is not a player', async () => {
			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: INVALID_PLAYER_ID,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isNonPlayerRespondedToTrade()
			).isTrue();
		});

		it('returns a NonTradeAcceptedError if the trade being accepted does not exist', async () => {
			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER,
				trade: INVALID_TRADE_ID,
			});

			makeSure(
				result.isNonTradeRespondedTo()
			).isTrue();
		});

		it('returns a TradeAlreadyRespondedToError if the trade has already been declined', async () => {
			tradeService.decline(MOCK_TRADE);

			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_INITIATING_PLAYER,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isTradeAlreadyRespondedTo()
			).isTrue();
		});

		it('returns a TradeAwaitingDifferentPlayerError if the player accepting the trade is not the recipient while the trade is awaiting the recipient', async () => {
			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_INITIATING_PLAYER,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isTradeAwaitingDifferentPlayer()
			).isTrue();
		});

		it('returns a MissingOfferedCharactersError if the initiating player no longer has the characters they are offering', async () => {
			editMockPlayer(db, {
				id: MOCK_INITIATING_PLAYER.id,
				inventory: "",
			});

			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER.id,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isPlayerMissingCharacters()
			).isTrue();
		});

		it('returns a MissingRequestedCharactersError if the recipient player no longer has the characters they are requesting', async () => {
			editMockPlayer(db, {
				id: MOCK_RECIPIENT_PLAYER.id,
				inventory: "",
			});

			const result = await acceptTrade({
				...getNamesmithServices(),
				playerAccepting: MOCK_RECIPIENT_PLAYER.id,
				trade: MOCK_TRADE,
			});

			makeSure(
				result.isPlayerMissingCharacters()
			).isTrue();
		});
	});
});