import { inspect } from "util";
import { makeSure } from "./jest/jest-utils";
import { areCharactersInString, getCharacterCounts, getNumDistinctCharacters, hasEmoji, hasLetter, hasNumber, hasSpace, hasSymbol, isIntegerString, isMultiLine, isOneSymbol, isUnicodeCodePoint } from "./string-checks-utils";

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

		it('treats a compound emoji made of a base character and a variation selector as a single character', () => {
			const result = areCharactersInString("❤️", "hello ❤️ world");
			makeSure(result).is(true);
		});

		it('does not match a compound emoji against a string that only has its bare base character', () => {
			const result = areCharactersInString("❤️", "hello ❤ world");
			makeSure(result).is(false);
		});

		it('accepts an array containing a single compound emoji character', () => {
			const result = areCharactersInString(["❤️", "a"], "a❤️b");
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

		it('counts a compound emoji made of a base character and a variation selector as a single character', () => {
			const input = 'a❤️❤️b';
			const expectedOutput = new Map([
				['a', 1],
				['❤️', 2],
				['b', 1],
			]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('counts a zero-width-joiner family emoji sequence as a single character', () => {
			const input = '👨‍👩‍👧‍👦👨‍👩‍👧‍👦';
			const expectedOutput = new Map([['👨‍👩‍👧‍👦', 2]]);
			expect(getCharacterCounts(input)).toEqual(expectedOutput);
		});

		it('counts characters correctly when given an already-split array of characters', () => {
			const input = ['a', '❤️', 'a'];
			const expectedOutput = new Map([
				['a', 2],
				['❤️', 1],
			]);
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

	describe('hasEmoji()', () => {
		it('returns true for a string that is just an emoji', () => {
			makeSure(hasEmoji('😀')).is(true);
		});

		it('returns true for a string with a single emoji', () => {
			makeSure(hasEmoji('Hello 😀')).is(true);
		});

		it('returns true for a string with multiple emojis', () => {
			makeSure(hasEmoji('😀👍🏽👩‍💻')).is(true);
		});

		it('returns true for multi-codepoint emojis', () => {
			makeSure(hasEmoji('👩‍👩‍👧‍👦')).is(true);
		});

		it('returns false for a string with no emoji', () => {
			makeSure(hasEmoji('Hello world')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(hasEmoji('')).is(false);
		});

		it('returns false for a string with only whitespace', () => {
			makeSure(hasEmoji('   ')).is(false);
		});

		it('returns false for a number', () => {
			makeSure(hasEmoji('123')).is(false);
		});

		it('returns false for a symbol', () => {
			makeSure(hasEmoji('%')).is(false);
		});
	});

	describe('hasSymbol()', () => {
		it('returns true for a string that is just a symbol', () => {
			makeSure(hasSymbol('%')).is(true);
		});

		it('returns true for a string with a single symbol', () => {
			makeSure(hasSymbol('Hello!')).is(true);
		});

		it('returns true for a string with multiple symbols', () => {
			makeSure(hasSymbol('Hello!$@')).is(true);
		});

		it('returns false for a string with no symbols', () => {
			makeSure(hasSymbol('Hello world')).is(false);
		});

		it('returns false for an emoji', () => {
			makeSure(hasSymbol('😀')).is(false);
		});

		it('returns false for a multi-codepoint emoji', () => {
			makeSure(hasSymbol('👩‍👩‍👧‍👦')).is(false);
		});

		it('returns false for regional indicators used in flags', () => {
			makeSure(hasSymbol('🇺🇸')).is(false);
		});

		it('returns false for a number', () => {
			makeSure(hasSymbol('123')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(hasSymbol('')).is(false);
		});

		it('returns false for a string with whitespace', () => {
			makeSure(hasSymbol(' a')).is(false);
			makeSure(hasSymbol('a ')).is(false);
			makeSure(hasSymbol('a b')).is(false);
		});
	});

	describe('hasNumber()', () => {
		it('returns true for a string that is just a number', () => {
			makeSure(hasNumber('5')).is(true);
		});

		it('returns true for a string with a single number', () => {
			makeSure(hasNumber('Hello 5')).is(true);
		});

		it('returns true for a string with multiple numbers', () => {
			makeSure(hasNumber('Hello 5 6')).is(true);
		});

		it('returns false for a string with no numbers', () => {
			makeSure(hasNumber('Hello world')).is(false);
		});

		it('returns false for an emoji', () => {
			makeSure(hasNumber('😀')).is(false);
		});

		it('returns false for a multi-codepoint emoji', () => {
			makeSure(hasNumber('👩‍👩‍👧‍👦')).is(false);
		});

		it('returns false for regional indicators used in flags', () => {
			makeSure(hasNumber('🇺🇸')).is(false);
		});

		it('returns false for a symbol', () => {
			makeSure(hasNumber('%')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(hasNumber('')).is(false);
		});

		it('returns false for a string with whitespace', () => {
			makeSure(hasNumber(' a')).is(false);
			makeSure(hasNumber('a ')).is(false);
			makeSure(hasNumber('a b')).is(false);
		});
	});

	describe('hasLetter()', () => {
		it('returns true for a string that is just a letter', () => {
			makeSure(hasLetter('a')).is(true);
		});

		it('returns true for a string with a single letter', () => {
			makeSure(hasLetter('123 a')).is(true);
		});

		it('returns true for a string with multiple letters', () => {
			makeSure(hasLetter('123 abc')).is(true);
		});

		it('returns false for a string with no letters', () => {
			makeSure(hasLetter('123 456')).is(false);
		});

		it('returns false for an emoji', () => {
			makeSure(hasLetter('😀')).is(false);
		});

		it('returns false for a multi-codepoint emoji', () => {
			makeSure(hasLetter('👩‍👩‍👧‍👦')).is(false);
		});

		it('returns false for regional indicators used in flags', () => {
			makeSure(hasLetter('🇺🇸')).is(false);
		});

		it('returns false for a symbol', () => {
			makeSure(hasLetter('%')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(hasLetter('')).is(false);
		});

		it('returns false for a string with whitespace', () => {
			makeSure(hasLetter(' 1')).is(false);
			makeSure(hasLetter('1 ')).is(false);
			makeSure(hasLetter('1 2')).is(false);
		});

		it('returns false for greek letters', () => {
			makeSure(hasLetter('αβγ|𝑒ττℛ∫')).is(false);
		});
	});

	describe('hasSpace()', () => {
		it('returns true for a string with a space', () => {
			makeSure(hasSpace('Hello world')).is(true);
		});

		it('returns true for a string with multiple spaces', () => {
			makeSure(hasSpace('   Hello    world   ')).is(true);
		});

		it('returns false for a string with no spaces', () => {
			makeSure(hasSpace('HelloWorld')).is(false);
		});

		it('returns false for an emoji', () => {
			makeSure(hasSpace('😀')).is(false);
		});

		it('returns false for a multi-codepoint emoji', () => {
			makeSure(hasSpace('👩‍👩‍👧‍👦')).is(false);
		});

		it('returns false for regional indicators used in flags', () => {
			makeSure(hasSpace('🇺🇸')).is(false);
		});

		it('returns false for a symbol', () => {
			makeSure(hasSpace('%')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(hasSpace('')).is(false);
		});
	});

	describe('isValidUnicodeCodePoint()', () => {
		it('returns true for a code point for a', () => {
			makeSure(isUnicodeCodePoint(
				'a'.codePointAt(0)!
			)).isTrue();
		});

		it('returns true for an emoji code point (basic plane)', () => {
			makeSure(isUnicodeCodePoint(
				'😀'.codePointAt(0)!
			)).isTrue();
		});

		it('returns true for a precomposed accented character (é)', () => {
			makeSure(isUnicodeCodePoint(
				'é'.codePointAt(0)!
			)).isTrue();
		});

		it('returns true for an emoji code point (astral plane)', () => {
			// U+1F600 GRINNING FACE
			makeSure(isUnicodeCodePoint(0x1F600)).isTrue();
		});

		it('rejects surrogate range start and end', () => {
			makeSure(isUnicodeCodePoint(0xD800)).isFalse();
			makeSure(isUnicodeCodePoint(0xDFFF)).isFalse();
		});

		it('rejects known non-characters (U+FDD0..U+FDEF)', () => {
			makeSure(isUnicodeCodePoint(0xFDD0)).isFalse();
			makeSure(isUnicodeCodePoint(0xFDEF)).isFalse();
		});

		it('rejects code points whose low 16 bits are 0xFFFE or 0xFFFF', () => {
			// e.g. U+1FFFF (low 16 bits 0xFFFF)
			makeSure(isUnicodeCodePoint(0x1FFFF)).isFalse();
			// e.g. U+2FFFE (low 16 bits 0xFFFE)
			makeSure(isUnicodeCodePoint(0x2FFFE)).isFalse();
		});

		it('rejects values outside Unicode range and non-positive values', () => {
			makeSure(isUnicodeCodePoint(0)).isFalse();
			makeSure(isUnicodeCodePoint(-1)).isFalse();
			makeSure(isUnicodeCodePoint(0x110000)).isFalse(); // > U+10FFFF
		});
	});

	describe('isMultiLine()', () => {
		it('returns true for a string with newlines', () => {
			makeSure(isMultiLine('a\nb')).is(true);
		});

		it('returns false for a string without newlines', () => {
			makeSure(isMultiLine('abc')).is(false);
		});

		it('returns false for an empty string', () => {
			makeSure(isMultiLine('')).is(false);
		});

		it('returns false for a string with whitespace', () => {
			makeSure(isMultiLine(' 1')).is(false);
			makeSure(isMultiLine('1 ')).is(false);
			makeSure(isMultiLine('1 2')).is(false);
		});

		it('returns true for a string with many newlines', () => {
			makeSure(isMultiLine(`Hello
				This is a string
				with many
				new lines
			`)).is(true);
		});

		it('returns false when using inspect with single value', () => {
			makeSure(isMultiLine(inspect('a'))).is(false);
		});

		it('returns true when using inspect with a large object', () => {
			makeSure(isMultiLine(inspect({
				ageOfTheuser: 18,
				nameOfThisPerson: 'Johnathon Jeffery',
				longEmail: 'anEmailWithManyCharactersOwJ3T@example.com',
			}))).is(true);
		});
	});

	describe('getNumDistinctCharacters()', () => {
		it('returns the number of distinct characters in a string', () => {
			makeSure(getNumDistinctCharacters('Hello, world!')).is(10);
		});

		it('returns the amount of non-repeating emojis', () => {
			makeSure(getNumDistinctCharacters('🔥🔥👨👩‍👩‍👧‍👦👩‍👩‍👧‍👦🔥😀👍🏻👩🏽‍👩🏾‍👦🏿‍👦🏻😀😀👍🏻')).is(6);
		});

		it('returns 0 for an empty string', () => {
			makeSure(getNumDistinctCharacters('')).is(0);
		});

		it('works for special unicode characters', () => {
			makeSure(getNumDistinctCharacters('©©øøéééααααββββγγγγ||||𝑒𝑒𝑒τττττℛℛℛℛ∫∫∫∫🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸')).is(12);
		});
	});
});