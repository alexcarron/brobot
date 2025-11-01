import { WithOptional } from "../../../utilities/types/generic-types";

export interface Recipe {
	id: number;
	inputCharacters: string;
	outputCharacters: string;
}

export type DBRecipe = Recipe;
export type RecipeDefinition = WithOptional<Recipe, "id">;

export type RecipeID = Recipe["id"];
export type RecipeResolvable =
	| {id: RecipeID}
	| RecipeID;