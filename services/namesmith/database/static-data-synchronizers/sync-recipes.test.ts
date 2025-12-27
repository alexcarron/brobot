import { makeSure } from "../../../../utilities/jest/jest-utils";
import { createMockDB } from "../../mocks/mock-database";
import { RecipeRepository } from "../../repositories/recipe.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncRecipesToDB } from "./sync-recipes";

describe('sync-recipes.ts', () => {
	let db: DatabaseQuerier;
	let recipeRepository: RecipeRepository;

	beforeEach(() => {
		db = createMockDB();
		recipeRepository = new RecipeRepository(db);
	});

	describe('syncRecipesToDB()', () => {
		it('should add new recipe defintions to the database', () => {
			syncRecipesToDB(db, [
				{
					inputCharacters: 'A',
					outputCharacters: 'B'
				},
				{
					inputCharacters: 'C',
					outputCharacters: 'D'
				}
			]);

			const recipes = recipeRepository.getRecipes();
			makeSure(recipes).hasLengthOf(2);
			makeSure(recipes).hasAnItemWhere((recipe) =>
				recipe.inputCharacters === 'A' &&
				recipe.outputCharacters === 'B'
			);
			makeSure(recipes).hasAnItemWhere((recipe) =>
				recipe.inputCharacters === 'C' &&
				recipe.outputCharacters === 'D'
			);
		});

		it('should delete recipes not defined in the static data', () => {
			syncRecipesToDB(db, [
				{
					inputCharacters: 'A',
					outputCharacters: 'B'
				}
			]);

			const recipes = recipeRepository.getRecipes();
			makeSure(recipes).hasLengthOf(1);
			makeSure(recipes).hasAnItemWhere((recipe) =>
				recipe.inputCharacters === 'A' &&
				recipe.outputCharacters === 'B'
			);
		});
	});

	it('should update existing recipes defined in the static data by ID', () => {
		syncRecipesToDB(db, [
			{
				id: 1,
				inputCharacters: 'A',
				outputCharacters: 'B',
			}
		]);

		syncRecipesToDB(db, [
			{
				id: 1,
				inputCharacters: 'C',
				outputCharacters: 'D',
			}
		]);

		const recipes = recipeRepository.getRecipes();

		makeSure(recipes).hasLengthOf(1);
		makeSure(recipes[0].inputCharacters).is('C');
		makeSure(recipes[0].outputCharacters).is('D');
	});

	it('should delete, update, and add recipes all at once', () => {
		syncRecipesToDB(db, [
			{
				id: 1,
				inputCharacters: 'A',
				outputCharacters: 'B',
			},
			{
				id: 2,
				inputCharacters: 'C',
				outputCharacters: 'D',
			},
			{
				inputCharacters: 'E',
				outputCharacters: 'F',
			}
		]);

		syncRecipesToDB(db, [
			{
				id: 2,
				inputCharacters: 'Z',
				outputCharacters: 'X',
			},
			{
				inputCharacters: 'G',
				outputCharacters: 'H',
			}
		]);

		const recipes = recipeRepository.getRecipes();
		makeSure(recipes).hasLengthOf(2);
		makeSure(recipes).hasNoItemWhere(recipe =>
			recipe.inputCharacters === 'A' &&
			recipe.outputCharacters === 'B'
		);
		makeSure(recipes).hasNoItemWhere(recipe =>
			recipe.inputCharacters === 'C' &&
			recipe.outputCharacters === 'D'
		);
		makeSure(recipes).hasNoItemWhere(recipe =>
			recipe.inputCharacters === 'E' &&
			recipe.outputCharacters === 'F'
		);
		makeSure(recipes).hasAnItemWhere((recipe) =>
			recipe.inputCharacters === 'Z' &&
			recipe.outputCharacters === 'X'
		);
		makeSure(recipes).hasAnItemWhere((recipe) =>
			recipe.inputCharacters === 'G' &&
			recipe.outputCharacters === 'H'
		);
	});
});