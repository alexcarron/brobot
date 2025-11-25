import { ExtractType, number, object, string } from "../../../utilities/runtime-types-utils";
import { WithOptional } from "../../../utilities/types/generic-types";

export const DBRecipeType = object.asType({
	id: number,
	inputCharacters: string,
	outputCharacters: string,
});
export const asRecipe = DBRecipeType.from;
export const asRecipes = DBRecipeType.fromAll;
export type Recipe = ExtractType<typeof DBRecipeType>;
export type RecipeDefinition = WithOptional<Recipe, "id">;

export type RecipeID = Recipe["id"];
export type RecipeResolvable =
	| {id: RecipeID}
	| RecipeID;