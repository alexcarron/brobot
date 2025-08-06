export interface Recipe {
	id: number;
	inputCharacters: string;
	outputCharacters: string;
}

export interface DBRecipe extends Recipe {}

export type RecipeID = Recipe["id"];

export type RecipeResolvable = Recipe | RecipeID;