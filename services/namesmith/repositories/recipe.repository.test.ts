import { createMockRecipeRepo, mockRecipes } from "./mock-repositories";
import { RecipeRepository } from "./recipe.repository"

describe('RecipeRepository', () => {
	let recipeRepository: RecipeRepository;

	beforeEach(() => {
		recipeRepository = createMockRecipeRepo();
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
	})
})