import { Recipe } from "../types/recipe.types";

/**
 * Checks if a given value is an object with the properties of a Recipe.
 * @param value - The value to check.
 * @returns If the value is an object with the properties of a Recipe.
 */
export const isRecipe = (value: unknown): value is Recipe => (
	value !== null &&
	typeof value === 'object' &&
	'id' in value &&
	typeof value.id === 'number' &&
	'inputCharacters' in value &&
	typeof value.inputCharacters === 'string' &&
	'outputCharacters' in value &&
	typeof value.outputCharacters === 'string'
)