import { toDefinedPropertyValues } from "../../../../utilities/data-structure-utils";
import { WithOptional, WithRequired } from "../../../../utilities/types/generic-types";
import { RecipeRepository } from "../../repositories/recipe.repository";
import { DBRecipe, RecipeDefinition } from "../../types/recipe.types";
import { DatabaseQuerier, toListPlaceholder } from "../database-querier";

/**
 * Synchronizes the database to match a list of data definitions of recipes without breaking existing data.
 * @param db - The database querier used to execute queries.
 * @param recipeDefinitions - An array of recipe objects to be inserted. Each recipe can optionally include an 'id'. If 'id' is not provided, it will be auto-generated.
 */
export const syncRecipesToDB = (
	db: DatabaseQuerier,
	recipeDefinitions: Readonly<
		WithOptional<RecipeDefinition, "id">[]
	>
) => {
	const recipeRepository = new RecipeRepository(db);
	const recipeIDs = toDefinedPropertyValues([...recipeDefinitions], "id");

	db.runTransaction(() => {
		db.run(
			`DELETE FROM recipe
			WHERE id NOT IN ${toListPlaceholder(recipeIDs)}`,
			...recipeIDs
		);

		const existingDBRecipes = db.getRows(
			`SELECT id FROM mysteryBox
			WHERE id IN ${toListPlaceholder(recipeIDs)}`,
			...recipeIDs
		) as DBRecipe[];

		const existingRecipeDefinitions: WithRequired<RecipeDefinition, "id">[] = [];
		const newRecipeDefinitions: RecipeDefinition[] = [];

		for (const recipeDefinition of recipeDefinitions) {
			const existingDBRecipe = existingDBRecipes.find(
				(dbRecipe) => dbRecipe.id === recipeDefinition.id
			);

			if (existingDBRecipe !== undefined)
				existingRecipeDefinitions.push({
					...recipeDefinition,
					id: existingDBRecipe.id
				});
			else
				newRecipeDefinitions.push(recipeDefinition);
		}

		for (const recipeDefinition of existingRecipeDefinitions) {
			recipeRepository.updateRecipe(recipeDefinition);
		}

		for (const recipeDefinition of newRecipeDefinitions) {
			recipeRepository.addRecipe(recipeDefinition);
		}
	});
}