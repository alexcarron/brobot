import { WithAtLeastOneProperty as WithAtLeastOneProperty } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
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
 * @param recipeData - The recipe data to add.
 * @param recipeData.id - The ID of the recipe.
 * @param recipeData.inputCharacters - The input characters of the recipe.
 * @param recipeData.outputCharacters - The output characters of the recipe.
 * @returns The added recipe with an ID.
 */
export const addMockRecipe = (
	db: DatabaseQuerier,
	{
		id = undefined,
		inputCharacters = "a",
		outputCharacters = "a",
	}: WithAtLeastOneProperty<Recipe>
): Recipe => {
	if (id === undefined) {
		const runResult = db.run(
			"INSERT INTO recipe (inputCharacters, outputCharacters) VALUES (@inputCharacters, @outputCharacters)",
			{ inputCharacters, outputCharacters }
		);

		if (typeof runResult.lastInsertRowid !== "number")
			id = Number(runResult.lastInsertRowid);
		else
			id = runResult.lastInsertRowid;
	}
	else {
		db.run(
			"INSERT INTO recipe (id, inputCharacters, outputCharacters) VALUES (@id, @inputCharacters, @outputCharacters)",
			{ id, inputCharacters, outputCharacters }
		);
	}
	return { id, inputCharacters, outputCharacters };
};