jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { craftCharacters } from "./craft-characters.workflow";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { returnIfNotFailure } from "./workflow-result-creator";

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
		it('should return the player and recipe in the correct state.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const {newInventory, craftedCharacters: craftedCharacter, recipeUsed} = returnIfNotFailure(
					await craftCharacters({
					playerService, recipeService, player, recipe
				})
			);

			makeSure(newInventory).is('accddc');
			makeSure(craftedCharacter).is('c');
			makeSure(recipeUsed).is(recipe);
		});

		it('should craft a character using a given recipe and player.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			await craftCharacters({
				playerService, recipeService, player, recipe
			});

			const inventoryAfter = playerService.getInventory(player);

			makeSure(inventoryAfter).is('accddc');
		});

		it('should throw MissingRequiredCharactersError if the player does not have all the required characters to craft the character.', async () => {
			const player = addMockPlayer(db, {
				inventory: 'abc'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'def'
			});

			const result = await craftCharacters({
				playerService, recipeService, player, recipe
			})

			await makeSure(result.isMissingRequiredCharacters()).isTrue();
		});

		it('should throw RecipeNotUnlockedError if the recipe is not unlocked for the player.', async () => {
			const isUnlockedForPlayer = jest.spyOn(recipeService, 'isUnlockedForPlayer');
			isUnlockedForPlayer.mockReturnValue(false);

			const player = addMockPlayer(db, {
				inventory: 'aabbccdd'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abb',
				outputCharacters: 'c'
			});

			const result = await craftCharacters({
				playerService, recipeService, player, recipe
			})

			await makeSure(result.isRecipeNotUnlocked()).isTrue();
		});
	});
});