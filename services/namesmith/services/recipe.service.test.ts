import { makeSure } from "../../../utilities/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, addMockRecipe } from "../database/mock-database";
import { mockPlayers, mockRecipes } from "../repositories/mock-repositories";
import { RecipeRepository } from "../repositories/recipe.repository";
import { PlayerNotFoundError, RecipeNotFoundError } from "../utilities/error.utility";
import { createMockRecipeService } from "./mock-services";
import { RecipeService } from "./recipe.service";

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

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});

		it('returns true if the player has exactly the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'abc',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});

		it('returns false if the player only has some of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'abdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns false if the player hsa none of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'defgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns false if the player has no characters', () => {
			const player = addMockPlayer(db, {
				inventory: '',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(false);
		});

		it('returns true if the player has more of the needed characters', () => {
			const player = addMockPlayer(db, {
				inventory: 'aaabbcccdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const result = recipeService.doesPlayerHaveRequiredCharacters(recipe.id, player.id);

			makeSure(result).is(true);
		});
	});

	describe('takeInputCharactersFromPlayer', () => {
		it('should take the input characters from the player', () => {
			const player = addMockPlayer(db, {
				inventory: 'abcdefgh',
			});
			const recipe = addMockRecipe(db, {
				inputCharacters: 'abc',
			});

			const removeCharactersFromInventory = jest.spyOn(
				recipeService.playerService,
				'removeCharactersFromInventory'
			);

			recipeService.takeRequiredCharactersFromPlayer(recipe.id, player.id);

			expect(removeCharactersFromInventory).toHaveBeenCalledWith(player.id, 'abc');
		});

		it('should throw an error if the player is not found', () => {
			expect(() => recipeService.takeRequiredCharactersFromPlayer(MOCK_RECIPE.id, "000000000000000000000")).toThrow(PlayerNotFoundError);
		});

		it('should throw an error if the recipe is not found', () => {
			expect(() => recipeService.takeRequiredCharactersFromPlayer(-999, mockPlayers[0].id)).toThrow(RecipeNotFoundError);
		});
	});

	describe('giveOutputCharactersToPlayer', () => {
		it('should give the output characters to the player', () => {
			const player = addMockPlayer(db, {
				inventory: '',
			});
			const recipe = addMockRecipe(db, {
				outputCharacters: 'abc',
			});

			const addCharactersToInventory = jest.spyOn(
				recipeService.playerService,
				'addCharactersToInventory'
			);

			recipeService.giveCraftedCharacterToPlayer(recipe.id, player.id);

			expect(addCharactersToInventory).toHaveBeenCalledWith(player.id, 'abc');
		});

		it('should throw an error if the player is not found', () => {
			expect(() => recipeService.giveCraftedCharacterToPlayer(MOCK_RECIPE.id, "000000000000000000000")).toThrow(PlayerNotFoundError);
		});

		it('should throw an error if the recipe is not found', () => {
			expect(() => recipeService.giveCraftedCharacterToPlayer(-999, mockPlayers[0].id)).toThrow(RecipeNotFoundError);
		});
	});
});