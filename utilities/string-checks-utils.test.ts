import { makeSure } from "./jest-utils";
import { areCharactersInString, getCharacterCounts } from "./string-checks-utils";

describe('string-checks-utils', () => {
	describe('areCharactersInString()', () => {
		it('returns true if all characters are in the string', () => {
			const result = areCharactersInString(
				"ttgsi",
				"test string"
			);

			makeSure(result).is(true);
		});

		it('returns false if any character is not in the string', () => {
			const result = areCharactersInString(
				"ttzgsi",
				"test string"
			);

			makeSure(result).is(false);
		});

		it('returns false if number of characters exceeds the string', () => {
			const result = areCharactersInString(
				"tttes",
				"test"
			);

			makeSure(result).is(false);
		});

		it('returns true if both characters and string are the same', () => {
			const result = areCharactersInString(
				"test string",
				"test string"
			);

			makeSure(result).is(true);
		});

		it('is case-sensitive', () => {
			const result = areCharactersInString(
				"TTgsi",
				"test string"
			);

			makeSure(result).is(false);
		});

		it('returns false if the string is empty but the characters are not', () => {
			const result = areCharactersInString(
				"a",
				""
			);

			makeSure(result).is(false);
		});

		it('returns true if the characters are empty but the string are not', () => {
			const result = areCharactersInString(
				"",
				"a"
			);

			makeSure(result).is(true);
		});

		it('returns true if the characters and string is empty', () => {
			const result = areCharactersInString(
				"",
				""
			);

			makeSure(result).is(true);
		});

		it('works with an array of characters', () => {
			const result = areCharactersInString(
				["t", "g", "t", "e", "s"],
				"test string"
			);

			makeSure(result).is(true);
		});

		it('throws error when passed an array of multi-character strings', () => {
			makeSure(() =>
				areCharactersInString(["tt", "e", "s"], "test string")
			).throwsAnError();
		});

		it('handles unicode and special characters correctly', () => {
			const result = areCharactersInString("ø©", "©helloø");
			makeSure(result).is(true);
		});
	});

	describe('getCharacterCounts()', () => {
		it('returns a map with character counts for a single character string', () => {
			const input = 'a';
			const expectedOutput = new Map([['a', 1]]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});
		it('returns a map with character counts for a two character string', () => {
			const input = 'fg';
			const expectedOutput = new Map([
				['f', 1],
				['g', 1],
			]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('returns a map with character counts for a string with multiple characters', () => {
			const input = 'hello';
			const expectedOutput = new Map([
				['h', 1],
				['e', 1],
				['l', 2],
				['o', 1],
			]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('returns a map with character counts for a string with repeated characters', () => {
			const input = 'aaaabbbcc';
			const expectedOutput = new Map([
				['a', 4],
				['b', 3],
				['c', 2],
			]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('returns a map with character counts for a string with special characters', () => {
			const input = 'hello!@#';
			const expectedOutput = new Map([
				['h', 1],
				['e', 1],
				['l', 2],
				['o', 1],
				['!', 1],
				['@', 1],
				['#', 1],
			]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('returns a map with character counts for an empty string', () => {
			const input = '';
			const expectedOutput = new Map();
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});
	});
});