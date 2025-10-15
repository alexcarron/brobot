export interface Recipe {
	id: number;
	inputCharacters: string;
	outputCharacters: string;
}

/**
 * DBRecipe represents a Recipe stored in the database.
 * Currently identical to Recipe but kept for semantic clarity.
 */
export type DBRecipe = Recipe;

export type RecipeID = Recipe["id"];
export type RecipeResolvable = Recipe | RecipeID;