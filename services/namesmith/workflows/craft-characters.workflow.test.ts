jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { craftCharacters } from './craft-characters.workflow';
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { returnIfNotFailure } from "../utilities/workflow.utility";
import { getLatestActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { ActivityTypes } from "../types/activity-log.types";

describe('craft-character.workflow', () => {
	let recipeService: RecipeService;
	let playerService: PlayerService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		setupMockNamesmith();
		const services = getNamesmithServices();
		recipeService = services.recipeService;
		playerService = services.playerService;
		db = playerService.playerRepository.db;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('craftCharacter()', () => {
		it('creates an activity log with accurate metadata.', () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd',
				currentName: 'abcd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			craftCharacters({player, recipe});

			const activityLog = getLatestActivityLog(db);
			makeSure(activityLog.player.id).is(player.id);
			makeSure(activityLog.type).is(ActivityTypes.CRAFT_CHARACTERS);
			makeSure(activityLog.nameChangedFrom).is('abcd');
			makeSure(activityLog.currentName).is('acdc');
			makeSure(activityLog.charactersGained).is('c');
			makeSure(activityLog.charactersLost).is('abb');
			makeSure(activityLog.involvedRecipe!.id).is(recipe.id);
		});

		it('should return the player and recipe in the correct state.', () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const {newInventory, craftedCharacters: craftedCharacter, recipeUsed} = returnIfNotFailure(
				craftCharacters({
					player, recipe
				})
			);

			makeSure(newInventory).is('accddc');
			makeSure(craftedCharacter).is('c');
			makeSure(recipeUsed).is(recipe);
		});

		it('should craft a character using a given recipe and player.', () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			craftCharacters({
				player, recipe
			});

			const inventoryAfter = playerService.getInventory(player);

			makeSure(inventoryAfter).is('accddc');
		});

		it('should throw MissingRequiredCharactersError if the player does not have all the required characters to craft the character.', () => {
			const player = addMockPlayer(db, {
				inventory: 'abc'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'def'
			});

			const result = craftCharacters({
				player, recipe
			})

			makeSure(result.isMissingRequiredCharacters()).isTrue();
		});

		it('should throw RecipeNotUnlockedError if the recipe is not unlocked for the player.', () => {
			const isUnlockedForPlayer = jest.spyOn(recipeService, 'isUnlockedForPlayer');
			isUnlockedForPlayer.mockReturnValue(false);

			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const result = craftCharacters({
				player, recipe
			})

			makeSure(result.isRecipeNotUnlocked()).isTrue();
		});
	});
});