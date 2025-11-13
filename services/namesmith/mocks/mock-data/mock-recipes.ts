import { DatabaseQuerier } from "../../database/database-querier";
import { RecipeRepository } from "../../repositories/recipe.repository";
import { Recipe } from "../../types/recipe.types";

export const mockRecipes: Recipe[] = [
	{
		id: 1,
		inputCharacters: "nn",
		outputCharacters: "m",
	},
	{
		id: 2,
		inputCharacters: "vv",
		outputCharacters: "w",
	},
	{
		id: 3,
		inputCharacters: "abc",
		outputCharacters: "def",
	},
	{
		id: 4,
		inputCharacters: "nn",
		outputCharacters: "N",
	},
];

/**
 * Adds a recipe to the database with the given properties.
 * @param db - The in-memory database.
 * @param recipeDefinition - The recipe data to add.
 * @param recipeDefinition.id - The ID of the recipe.
 * @param recipeDefinition.inputCharacters - The input characters of the recipe.
 * @param recipeDefinition.outputCharacters - The output characters of the recipe.
 * @returns The added recipe with an ID.
 */
export const addMockRecipe = (
	db: DatabaseQuerier,
	recipeDefinition: Partial<Recipe> = {}
): Recipe => {
	const recipeRepository = RecipeRepository.fromDB(db);

	const {
		id = undefined,
		inputCharacters = "a",
		outputCharacters = "a",
	} = recipeDefinition;

	return recipeRepository.addRecipe({ id, inputCharacters, outputCharacters });
};