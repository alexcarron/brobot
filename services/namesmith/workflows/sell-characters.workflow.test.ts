jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { CharacterService } from "../services/character.service";
import { sellCharacters, undoSellCharacters } from "./sell-characters.workflow";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { getLatestActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { ActivityTypes } from "../types/activity-log.types";
import { INVALID_PLAYER_ID } from "../constants/testing.constants";

describe('sell-characters.workflow', () => {
	let playerService: PlayerService;
	let characterService: CharacterService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const services = getNamesmithServices();
		playerService = services.playerService;
		characterService = services.characterService;
		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('sellCharacters()', () => {
		it('should give the player tokens and remove the sold characters from their inventory', () => {
			const player = addMockPlayer(db, { inventory: 'aab', tokens: 0 });
			const expectedValue = characterService.getSellValueOfCharacters('aa');

			const { newInventory, newTokenCount, tokensEarned, charactersSold } = returnIfNotFailure(
				sellCharacters({ player, charactersSelling: 'aa' })
			);

			makeSure(charactersSold).is('aa');
			makeSure(tokensEarned).is(expectedValue);
			makeSure(newTokenCount).is(expectedValue);
			makeSure(newInventory).is('b');
			makeSure(playerService.getInventory(player)).is('b');
			makeSure(playerService.getTokens(player)).is(expectedValue);
		});

		it('should sell multiples of a single character using the amount parameter', () => {
			const player = addMockPlayer(db, { inventory: 'aaaa', tokens: 0 });
			const expectedValue = characterService.getSellValueOfCharacters('aaa');

			const { tokensEarned, charactersSold } = returnIfNotFailure(
				sellCharacters({ player, charactersSelling: 'a', amount: 3 })
			);

			makeSure(charactersSold).is('aaa');
			makeSure(tokensEarned).is(expectedValue);
			makeSure(playerService.getInventory(player)).is('a');
		});

		it('should fail with invalidAmountUsage if amount is given with more than one distinct character', () => {
			const player = addMockPlayer(db, { inventory: 'aabb', tokens: 0 });

			const result = sellCharacters({ player, charactersSelling: 'ab', amount: 2 });

			makeSure(result.isInvalidAmountUsage()).isTrue();
		});

		it('should fail with missingCharacters if the player does not have the characters being sold', () => {
			const player = addMockPlayer(db, { inventory: 'a', tokens: 0 });

			const result = sellCharacters({ player, charactersSelling: 'ab' });

			makeSure(result.isMissingCharacters()).isTrue();
			if (result.isMissingCharacters())
				makeSure(result.missingCharacters).is('b');
		});

		it('should fail with notAPlayer if given an invalid player', () => {
			const result = sellCharacters({ player: INVALID_PLAYER_ID, charactersSelling: 'a' });

			makeSure(result.isNotAPlayer()).isTrue();
		});

		it('creates an activity log with accurate metadata', () => {
			const player = addMockPlayer(db, { inventory: 'aab', tokens: 0 });

			sellCharacters({ player, charactersSelling: 'aa' });

			const activityLog = getLatestActivityLog(db);
			makeSure(activityLog.player.id).is(player.id);
			makeSure(activityLog.type).is(ActivityTypes.SELL_CHARACTERS);
			makeSure(activityLog.charactersLost).is('aa');
			makeSure(activityLog.tokensDifference).isGreaterThan(0);
		});
	});

	describe('undoSellCharacters()', () => {
		it('should give the sold characters back and take back the tokens earned', () => {
			const player = addMockPlayer(db, { inventory: 'aab', tokens: 0 });
			const { tokensEarned, charactersSold } = returnIfNotFailure(
				sellCharacters({ player, charactersSelling: 'aa' })
			);

			const { newInventory, newTokenCount } = returnIfNotFailure(
				undoSellCharacters({ player, charactersSold, tokensEarned })
			);

			makeSure(newTokenCount).is(0);
			makeSure(playerService.getTokens(player)).is(0);
			makeSure(newInventory.includes('a')).isTrue();
		});

		it('should fail with cannotAffordUndo if the player no longer has enough tokens to reverse the sale', () => {
			const player = addMockPlayer(db, { inventory: 'aab', tokens: 0 });
			const { tokensEarned, charactersSold } = returnIfNotFailure(
				sellCharacters({ player, charactersSelling: 'aa' })
			);

			playerService.takeTokens(player, tokensEarned);

			const result = undoSellCharacters({ player, charactersSold, tokensEarned });

			makeSure(result.isCannotAffordUndo()).isTrue();
		});
	});
});
