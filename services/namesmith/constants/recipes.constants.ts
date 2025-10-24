import { recipes } from "../database/static-data/recipes";

type RecipeShape = Readonly<{
	inputCharacters: string;
	outputCharacters: string
}>;

type RecipeName<
	SpecificRecipe extends RecipeShape
> =
	SpecificRecipe extends {
		inputCharacters: infer Input extends string;
		outputCharacters: infer Output extends string;
	}
		? `${Input} ➔ ${Output}`
		: never;

type RecipesEnum<
	SpecificRecipes extends Readonly<RecipeShape[]>
> =
	{
		[SpecificRecipe in SpecificRecipes[number] as RecipeName<SpecificRecipe>]: SpecificRecipe;
	};

type ConstantRecipes = RecipesEnum<typeof recipes>;

/**
 * Converts a recipe object to a recipe name string in the format "inputCharacters -> outputCharacters".
 * @param recipe - The recipe object to convert.
 * @returns The recipe name string.
 */
function toRecipeName(recipe: RecipeShape): RecipeName<RecipeShape> {
	return `${recipe.inputCharacters} ➔ ${recipe.outputCharacters}`
}

export const Recipes: ConstantRecipes = recipes.reduce(
	(previousValue, accumulatedValue) => {
		return {
			...previousValue,
			[toRecipeName(accumulatedValue)]: accumulatedValue
		};
	}
) as any;