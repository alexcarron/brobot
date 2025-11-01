import { makeSure } from "./jest/jest-utils";
import { areCharactersInString, getCharacterCounts, isIntegerString, isOneSymbol } from "./string-checks-utils";

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
	describe('isIntegerString()', () => {
		it('returns true for a positive integer string', () => {
			const result = isIntegerString('42');
			makeSure(result).is(true);
		});

		it('returns true for a negative integer string', () => {
			const result = isIntegerString('-10');
			makeSure(result).is(true);
		});

		it('returns true for zero', () => {
			const result = isIntegerString('0');
			makeSure(result).is(true);
		});

		it('returns true for integer with surrounding whitespace (trimmed)', () => {
			const result = isIntegerString(' 42 ');
			makeSure(result).is(true);
		});

		it('returns false for an empty string', () => {
			const result = isIntegerString('');
			makeSure(result).is(false);
		});

		it('returns false for a whitespace-only string', () => {
			const result = isIntegerString('   ');
			makeSure(result).is(false);
		});

		it('returns false for a decimal string', () => {
			const result = isIntegerString('3.14');
			makeSure(result).is(false);
		});

		it('returns false for a string with trailing non-numeric characters', () => {
			const result = isIntegerString('42abc');
			makeSure(result).is(false);
		});

		it('returns false for a string with leading zeros ("0012")', () => {
			const result = isIntegerString('0012');
			makeSure(result).is(false);
		});

		it('returns false for a string with a plus sign prefix ("+5")', () => {
			const result = isIntegerString('+5');
			makeSure(result).is(false);
		});

		it('returns false for "-0" (strict canonicalization)', () => {
			const result = isIntegerString('-0');
			makeSure(result).is(false);
		});

		it('returns false for scientific notation ("1e3")', () => {
			const result = isIntegerString('1e3');
			makeSure(result).is(false);
		});

		it('returns false for hex literal string ("0x10")', () => {
			const result = isIntegerString('0x10');
			makeSure(result).is(false);
		});

		it('returns false for "Infinity" and "NaN"', () => {
			makeSure(isIntegerString('Infinity')).is(false);
			makeSure(isIntegerString('NaN')).is(false);
		});

		it('returns false for unicode numerals or special numeric glyphs', () => {
			makeSure(isIntegerString('②')).is(false);
		});

		it('returns false for very large numeric strings that are not canonical', () => {
			const result = isIntegerString(Number.MAX_SAFE_INTEGER.toString() + '1'); // >
			makeSure(result).is(false);
		});

		it('returns false for strings with internal spaces', () => {
			const result = isIntegerString('4 2');
			makeSure(result).is(false);
		});

		it('returns false for strings containing underscores or commas', () => {
			makeSure(isIntegerString('1_000')).is(false);
			makeSure(isIntegerString('1,000')).is(false);
		});

		it('returns false when given non-digit characters', () => {
			const cases = ['abc', '123a', 'a123', '12-3'];
			for (const c of cases) {
				makeSure(isIntegerString(c)).is(false);
			}
		});

		it('accepts canonical negative large integers within canonical string form', () => {
			// Pick a canonical integer string where number.toString() equals the trimmed input.
			const result = isIntegerString('-123456');
			makeSure(result).is(true);
		});

		it('rejects a plus sign alone or minus sign alone', () => {
			makeSure(isIntegerString('+')).is(false);
			makeSure(isIntegerString('-')).is(false);
		});

		it('rejects inputs with leading plus zero ("+0")', () => {
			makeSure(isIntegerString('+0')).is(false);
		});

		it('is strict about canonical representation: "12" passes, "012" fails', () => {
			makeSure(isIntegerString('12')).is(true);
			makeSure(isIntegerString('012')).is(false);
		});
	});

	describe('isOneSymbol()', () => {
		it('returns true for a single character string', () => {
			makeSure(isOneSymbol('a')).is(true);
		});

		it('returns false for an empty string', () => {
			makeSure(isOneSymbol('')).is(false);
		});

		it('returns false for a string with more than one character', () => {
			makeSure(isOneSymbol('ab')).is(false);
		});

		it('returns false for a string with leading or trailing whitespace', () => {
			makeSure(isOneSymbol(' a')).is(false);
			makeSure(isOneSymbol('a ')).is(false);
		});

		it('returns false for a string with a newline', () => {
			makeSure(isOneSymbol('a\n')).is(false);
		});

		it('returns true for a precomposed accented character (é)', () => {
			makeSure(isOneSymbol('é')).is(true);
		});

		it('returns true for a single non-BMP symbol (musical G clef U+1D11E)', () => {
			makeSure(isOneSymbol('𝄞')).is(true);
		});

		it('returns true for a simple emoji (😀)', () => {
			makeSure(isOneSymbol('😀')).is(true);
		});

		it('returns false for two simple emojis (😀😀)', () => {
			makeSure(isOneSymbol('😀😀')).is(false);
		});

		it('returns true for a thumbs up emoji (👍)', () => {
			makeSure(isOneSymbol('👍')).is(true);
		});

		it('returns true for an emoji with skin-tone modifier (👍🏻)', () => {
			makeSure(isOneSymbol('👍🏻')).is(true);
		});

		it('returns false for emoji with trailing character (👍🏻a)', () => {
			makeSure(isOneSymbol('👍🏻a')).is(false);
		});

		it('returns true for a ZWJ family emoji (👩‍👩‍👧‍👦)', () => {
			makeSure(isOneSymbol('👩‍👩‍👧‍👦')).is(true);
		});

		it('returns true for a complex ZWJ emoji with skin tones (example)', () => {
			makeSure(isOneSymbol('👩🏽‍👩🏾‍👦🏿‍👦🏻')).is(true);
		});

		it('returns false for two emoji where second is not joined by ZWJ (👩‍👩‍👧‍👦👨)', () => {
			makeSure(isOneSymbol('👩‍👩‍👧‍👦👨')).is(false);
		});

		it('returns true for a flag (🇺🇸)', () => {
			makeSure(isOneSymbol('🇺🇸')).is(true);
		});

		it('returns false for two flags (🇺🇸🇨🇦)', () => {
			makeSure(isOneSymbol('🇺🇸🇨🇦')).is(false);
		});

		it('returns true for a keycap emoji (1️⃣)', () => {
			makeSure(isOneSymbol('1️⃣')).is(true);
		});

		it('returns true for a text-symbol with variation selector (♥️)', () => {
			makeSure(isOneSymbol('♥️')).is(true);
		});

		it('returns true for the same symbol without VS16 (♥)', () => {
			makeSure(isOneSymbol('♥')).is(true);
		});

		it('returns true for a single space character', () => {
			makeSure(isOneSymbol(' ')).is(true);
		});

		it('returns false for two spaces', () => {
			makeSure(isOneSymbol('  ')).is(false);
		});

		it('returns true for a single digit', () => {
			makeSure(isOneSymbol('7')).is(true);
		});

		it('returns false for digit + digit', () => {
			makeSure(isOneSymbol('12')).is(false);
		});

		it('returns false for a sequence of emoji separated by ZERO WIDTH JOINER AND SPACE (two visible glyphs)', () => {
			makeSure(isOneSymbol('👩‍💻 👨‍💻')).is(false);
		});

		it('returns false for repeated long ZWJ emoji (same sequence twice)', () => {
			makeSure(isOneSymbol('👩🏽‍👩🏾‍👦🏿‍👦🏻👩🏽‍👩🏾‍👦🏿‍👦🏻')).is(false);
		});
	});
});