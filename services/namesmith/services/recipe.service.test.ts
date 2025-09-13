jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
}));

import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, addMockRecipe } from "../mocks/mock-database";
import { mockPlayers, mockRecipes } from "../mocks/mock-repositories";
import { RecipeRepository } from "../repositories/recipe.repository";
import { PlayerNotFoundError, RecipeNotFoundError } from "../utilities/error.utility";
import { createMockRecipeService } from "../mocks/mock-services";
import { RecipeService } from "./recipe.service";
import { Recipe } from "../types/recipe.types";

describe('RecipeService', () => {
	const MOCK_RECIPE = mockRecipes[0];

	let recipeService: RecipeService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		recipeService = createMockRecipeService();
		db = recipeService.recipeRepository.db;
	});

	describe('constructor', () => {
		it('should create a new RecipeService instance with the given repository', () => {
			expect(recipeService).toBeInstanceOf(RecipeService);
			expect(recipeService.recipeRepository).toBeInstanceOf(RecipeRepository);
		});
	});

	describe('resolveRecipe()', () => {
		it('should resolve a recipe resolvable to a recipe object', () => {
			const recipe = recipeService.resolveRecipe(MOCK_RECIPE.id);
			expect(recipe).toEqual(MOCK_RECIPE);
		});

		it('should throw an error if the recipe with the given ID is not found', () => {
			expect(() => recipeService.resolveRecipe(0)).toThrow(RecipeNotFoundError);
		});

		it('returns a current recipe when given an outdated recipe object', () => {
			const OUTDATED_RECIPE: Recipe = {
				...MOCK_RECIPE,
				outputCharacters: "OUTDATED"
			};
			
			const recipe = recipeService.resolveRecipe(OUTDATED_RECIPE);
			expect(recipe).toEqual(MOCK_RECIPE);
		});

		it('should resolve a recipe object to itself', () => {
			const recipe = recipeService.resolveRecipe(MOCK_RECIPE);
			expect(recipe).toEqual(MOCK_RECIPE);
		});
	});

	describe('playerHasNeededCharacters', () => {
		it('returns true if the player has more than the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'abcdefgh'
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});

		it('returns true if the player has exactly the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'abc',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});

		it('returns false if the player only has some of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'abdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns false if the player hsa none of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'defgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns false if the player has no characters', () => {
			const player = addMockPlayer(db, {
				inventory: '',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns true if the player has more of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'aaabbcccdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.playerHasInputCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});
	});

	describe('takeInputCharactersFromPlayer', () => {
		it('should take the input characters from the player', async () => {
			const player = addMockPlayer(db, {
				inventory: 'abcdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const removeCharacters = jest.spyOn(
				recipeService.playerService,
				'removeCharacters'
			);

			await recipeService.takeInputCharactersFromPlayer(recipe.id, player.id);

			expect(removeCharacters).toHaveBeenCalledWith(player.id, 'abc');
		});

		it('should throw an error if the player is not found', async () => {
			await makeSure(
				recipeService.takeInputCharactersFromPlayer(MOCK_RECIPE.id, INVALID_PLAYER_ID)
			).eventuallyThrows(PlayerNotFoundError);
		});

		it('should throw an error if the recipe is not found', async () => {
			await makeSure(
				recipeService.takeInputCharactersFromPlayer(-999, mockPlayers[0].id)
			).eventuallyThrows(RecipeNotFoundError);
		});
	});

	describe('giveOutputCharactersToPlayer', () => {
		it('should give the output characters to the player', async () => {
			const player = addMockPlayer(db, {
				inventory: '',
			});
			const recipe = addMockRecipe(db, {
				outputCharacters: 'abc',
			});

			const giveCharacters = jest.spyOn(
				recipeService.playerService,
				'giveCharacters'
			);

			await recipeService.giveOutputCharacterToPlayer(recipe.id, player.id);

			expect(giveCharacters).toHaveBeenCalledWith(player.id, 'abc');
		});

		it('should throw an error if the player is not found', async () => {
			await makeSure(
				recipeService.giveOutputCharacterToPlayer(MOCK_RECIPE.id, INVALID_PLAYER_ID)
			).eventuallyThrows(PlayerNotFoundError);
		});

		it('should throw an error if the recipe is not found', async () => {
			await makeSure(
				recipeService.giveOutputCharacterToPlayer(-999, mockPlayers[0].id)
			).eventuallyThrows(RecipeNotFoundError);
		});
	});
});