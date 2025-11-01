import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_RECIPE_ID } from "../constants/test.constants";
import { mockRecipes } from "../mocks/mock-data/mock-recipes";
import { createMockRecipeRepo } from "../mocks/mock-repositories";
import { Recipe } from "../types/recipe.types";
import { RecipeAlreadyExistsError, RecipeNotFoundError } from "../utilities/error.utility";
import { RecipeRepository } from "./recipe.repository"

describe('RecipeRepository', () => {
	let recipeRepository: RecipeRepository;

	let SOME_RECIPE: Recipe;

	beforeEach(() => {
		recipeRepository = createMockRecipeRepo();
		SOME_RECIPE = recipeRepository.getRecipes()[0];
	})

	describe('.getRecipes()', () => {
		it('returns all recipes', () => {
			const recipes = recipeRepository.getRecipes();
			expect(recipes).toEqual(mockRecipes);
		})
	})

	describe('.getRecipeByID()', () => {
		it('returns a recipe by ID', () => {
			const recipe = recipeRepository.getRecipeByID(1);
			expect(recipe).toEqual(mockRecipes[0]);
		})

		it('returns null if no recipe is found', () => {
			const recipe = recipeRepository.getRecipeByID(0);
			expect(recipe).toBeNull();
		})
	})

	describe('.getRecipesWithInputs()', () => {
		it('returns recipes with the given input characters', () => {
			const recipes = recipeRepository.getRecipesWithInputs('abc');
			expect(recipes).toEqual(mockRecipes.filter(recipe => recipe.inputCharacters === 'abc'));
		})

		it('returns multiple recipes with the given input characters', () => {
			const recipes = recipeRepository.getRecipesWithInputs('nn');
			expect(recipes).toEqual(mockRecipes.filter(recipe => recipe.inputCharacters === 'nn'));
		})

		it('returns an empty array if no recipes are found', () => {
			const recipes = recipeRepository.getRecipesWithInputs('nonsense');
			expect(recipes).toEqual([]);
		})

		it('throws an error if inputCharacters is empty', () => {
			expect(() => recipeRepository.getRecipesWithInputs('')).toThrow();
		})
	});

	describe('addRecipe()', () => {
		it('adds a recipe to the database', () => {
			const recipe = recipeRepository.addRecipe({
				id: 1000001,
				inputCharacters: 'abc',
				outputCharacters: 'def'
			});

			makeSure(recipe).is({
				id: 1000001,
				inputCharacters: 'abc',
				outputCharacters: 'def'
			});

			const resolvedRecipe = recipeRepository.getRecipeByID(1000001);
			makeSure(resolvedRecipe).is(recipe);
		});

		it('generates an id when none is provided', () => {
			const recipe = recipeRepository.addRecipe({
				inputCharacters: 'abc',
				outputCharacters: 'def'
			});

			const resolvedRecipe = recipeRepository.getRecipeByID(recipe.id);
			makeSure(resolvedRecipe).is(recipe);
		});

		it('throws a RecipeAlreadyExistsError if the recipe already exists', () => {
			makeSure(() =>
				recipeRepository.addRecipe(SOME_RECIPE)
			).throws(RecipeAlreadyExistsError);
		});
	});

	describe('updateRecipe()', () => {
		it('updates a recipe in the database', () => {
			const updatedRecipe = recipeRepository.updateRecipe({
				id: SOME_RECIPE.id,
				inputCharacters: 'abc',
				outputCharacters: 'def'
			});

			makeSure(updatedRecipe).is({
				id: SOME_RECIPE.id,
				inputCharacters: 'abc',
				outputCharacters: 'def'
			});

			const resolvedRecipe = recipeRepository.getRecipeByID(SOME_RECIPE.id);
			makeSure(resolvedRecipe).is(updatedRecipe);
		});

		it('throws a RecipeNotFoundError if no recipe is found', () => {
			makeSure(() => recipeRepository.updateRecipe({
				id: INVALID_RECIPE_ID,
				inputCharacters: 'abc',
				outputCharacters: 'def'
			})).throws(RecipeNotFoundError);
		});
	});

	describe('removeRecipe()', () => {
		it('removes a recipe by its ID', () => {
			recipeRepository.removeRecipe(SOME_RECIPE.id);
			expect(recipeRepository.getRecipeByID(SOME_RECIPE.id)).toBeNull();
		});

		it('throws a RecipeNotFoundError if no recipe is found', () => {
			expect(() => recipeRepository.removeRecipe(INVALID_RECIPE_ID)).toThrow();
		});
	});
})