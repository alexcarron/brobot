import { WithOptional } from "../../../../utilities/types/generic-types";
import { Recipe } from "../../types/recipe.types";
import { DatabaseQuerier } from "../database-querier";

/**
 * Synchronizes the database to match a list of data definitions of recipes without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param recipes - An array of recipe objects to be inserted. Each recipe can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export const syncRecipesToDB = (
	db: DatabaseQuerier,
	recipes: Readonly<
		WithOptional<Recipe, "id">[]
	>
) => {
	const insertRecipeIntoDB = db.getQuery("INSERT INTO recipe (inputCharacters, outputCharacters) VALUES (@inputCharacters, @outputCharacters)");

	const insertRecipeIntoDBWithID = db.getQuery("INSERT INTO recipe (id, inputCharacters, outputCharacters) VALUES (@id, @inputCharacters, @outputCharacters)");

	const insertRecipes = db.getTransaction((recipes: WithOptional<Recipe, "id">[]) => {
		db.run("DELETE FROM recipe");

		// SET AUTO INCREMENT TO 1
		db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'recipe'");

		for (const recipe of recipes) {
			if (recipe.id === undefined)
				insertRecipeIntoDB.run({
					inputCharacters: recipe.inputCharacters,
					outputCharacters: recipe.outputCharacters
				});
			else
				insertRecipeIntoDBWithID.run({
					id: recipe.id,
					inputCharacters: recipe.inputCharacters,
					outputCharacters: recipe.outputCharacters
				});
		}
	});

	insertRecipes(recipes);
}