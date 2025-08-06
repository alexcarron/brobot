import { isRecipe } from "./recipe.utility";

describe('recipe.utility', () => {
	describe('isRecipe()', () => {
		it('returns true if the value is an object with the properties of a Recipe', () => {
			const recipe = { id: 1, inputCharacters: 'abc', outputCharacters: 'def' };
			expect(isRecipe(recipe)).toBe(true);
		});

		it('returns false if the value is not an object', () => {
			expect(isRecipe('abc')).toBe(false);
			expect(isRecipe(123)).toBe(false);
			expect(isRecipe(null)).toBe(false);
			expect(isRecipe(undefined)).toBe(false);
		});

		it('returns false if the value is missing a property', () => {
			const recipe = { id: 1, inputCharacters: 'abc' };
			expect(isRecipe(recipe)).toBe(false);
		});

		it('returns false if the value has a property with the wrong type', () => {
			const recipe = { id: 1, inputCharacters: 'abc', outputCharacters: 123 };
			expect(isRecipe(recipe)).toBe(false);
		})
	})
})