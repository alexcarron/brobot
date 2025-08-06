import { InvalidArgumentError } from "../../../utilities/error-utils";
import { IfPresent, Possibly } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { DBRecipe, Recipe, RecipeID } from "../types/recipe.types";

/**
 * Provides access to all static recipe data.
 */
export class RecipeRepository {
	constructor(
		public db: DatabaseQuerier,
	) {}

	/**
	 * Retrieves all recipes from the database.
	 * @returns An array of all recipe objects stored in the database.
	 */
	getRecipes(): Recipe[] {
		const query = "SELECT * FROM recipe";
		return this.db.getRows(query) as DBRecipe[];
	}

	/**
	 * Retrieves a recipe by its ID.
	 * @param id - The unique identifier of the recipe to retrieve.
	 * @returns The recipe object with the specified ID, or null if no such recipe exists.
	 */
	getRecipeByID(id: RecipeID): IfPresent<Recipe> {
		const query = "SELECT * FROM recipe WHERE id = @id";
		const recipe = this.db.getRow(query, { id }) as DBRecipe | undefined;

		if (recipe === undefined)
			return null;

		return recipe;
	}

	/**
	 * Retrieves all recipes that have the specified input characters.
	 * @param inputCharacters - The input characters to filter recipes by.
	 * @returns An array of recipe objects with the given input characters.
	 */
	getRecipesWithInputs(inputCharacters: string): Recipe[] {
		if (inputCharacters === '')
			throw new InvalidArgumentError('getRecipesWithInputs: inputCharacters cannot be empty.');

		const query = "SELECT * FROM recipe WHERE inputCharacters = @inputCharacters";
		return this.db.getRows(query, { inputCharacters }) as DBRecipe[];
	}

	/**
	 * Retrieves all recipes that output the given characters.
	 * @param outputCharacters - The output characters to filter recipes by.
	 * @returns An array of recipe objects with the given output characters.
	 */
	getRecipesWithOutputs(outputCharacters: string): Recipe[] {
		const query = "SELECT * FROM recipe WHERE outputCharacters = @outputCharacters";
		return this.db.getRows(query, { outputCharacters }) as DBRecipe[];
	}
}