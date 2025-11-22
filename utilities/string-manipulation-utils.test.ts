import {
  toTitleCase,
  createTextProgressBar,
  toNumericOrdinal,
  toWordOrdinal,
  createListFromWords,
  wrapTextByLineWidth,
  removeLinks,
  removeEmojis,
  findStringStartingWith,
  incrementEndNumber,
	removeCharactersAsGivenFromEnd,
	removeCharacterAt,
	removeMissingCharacters,
	addSIfPlural,
	toAmountOfNoun,
	toCamelFromKebabCase,
	joinLines,
	capitalizeFirstLetter,
	toCamelCase,
	toIdentifierSegments,
	toKebabCase,
	toPascalCase,
} from "./string-manipulation-utils";
import { createNowUnixTimestamp } from "./date-time-utils";
import { makeSure } from "./jest/jest-utils";

describe('string-manipulation-utils', () => {
	describe('toTitleCase()', () => {
		it('should return an empty string for an empty input', () => {
			expect(toTitleCase('')).toBe('');
		});

		it('should convert a single word to title case', () => {
			expect(toTitleCase('hello')).toBe('Hello');
		});

		it('should convert multiple words to title case', () => {
			expect(toTitleCase('hello world')).toBe('Hello World');
		});

		it('should handle words with punctuation', () => {
			expect(toTitleCase('hello, world!')).toBe('Hello, World!');
		});

		it('should handle words with numbers', () => {
			expect(toTitleCase('hello123 world')).toBe('Hello123 World');
		});

		it('should handle words with special characters', () => {
			expect(toTitleCase('hello!@# world')).toBe('Hello!@# World');
		});

		it('should handle multiple consecutive spaces', () => {
			expect(toTitleCase('hello   world')).toBe('Hello   World');
		});

		it('should handle leading and trailing spaces', () => {
			expect(toTitleCase('   hello world   ')).toBe('   Hello World   ');
		});
	});

	describe('toCamelFromKebabCase()', () => {
		it('should return an empty string for an empty input', () => {
			expect(toCamelFromKebabCase('')).toBe('');
		});

		it('should convert a single word to camel case', () => {
			expect(toCamelFromKebabCase('hello')).toBe('hello');
		});

		it('should convert multiple words to camel case', () => {
			expect(toCamelFromKebabCase('hello-world')).toBe('helloWorld');
		});

		it('should handle words with punctuation', () => {
			expect(toCamelFromKebabCase('hello, world!')).toBe('hello, world!');
		});

		it('should handle words with numbers', () => {
			expect(toCamelFromKebabCase('hello123-world-56-numbers')).toBe('hello123World56Numbers');
		});

		it('should handle leading and trailing dashes', () => {
			expect(toCamelFromKebabCase('-hello-world-')).toBe('helloWorld');
		});

		it('should handle duplicate dashes', () => {
			expect(toCamelFromKebabCase('--hello--world--')).toBe('helloWorld');
		});
	});

	describe('toIdentifierSegments()', () => {
		it('should return an empty array for an empty input', () => {
			expect(toIdentifierSegments('')).toEqual([]);
		});

		it('should split a string into segments', () => {
			expect(toIdentifierSegments('hello world')).toEqual(['hello', 'world']);
		});

		it('should handle words with punctuation', () => {
			expect(toIdentifierSegments('hello, world!')).toEqual(['hello', 'world']);
		});

		it('should handle words with numbers', () => {
			expect(toIdentifierSegments('hello123-world-56-numbers')).toEqual(['hello123', 'world', '56', 'numbers']);
		});

		it('should handle leading and trailing dashes', () => {
			expect(toIdentifierSegments('-hello-world-')).toEqual(['hello', 'world']);
		});

		it('should handle duplicate dashes', () => {
			expect(toIdentifierSegments('--hello--world--')).toEqual(['hello', 'world']);
		});

		it('should handle spaces', () => {
			expect(toIdentifierSegments('hello world')).toEqual(['hello', 'world']);
		});

		it('should handle underscores', () => {
			expect(toIdentifierSegments('hello_world')).toEqual(['hello', 'world']);
		});

		it('should handle hyphens', () => {
			expect(toIdentifierSegments('hello-world')).toEqual(['hello', 'world']);
		});

		it('should handle special characters', () => {
			expect(toIdentifierSegments('hello!@# world')).toEqual(['hello', 'world']);
		});

		it('should handle multiple consecutive separators', () => {
			expect(toIdentifierSegments('hello---world')).toEqual(['hello', 'world']);
		});

		it('should handle leading and trailing separators', () => {
			expect(toIdentifierSegments('---hello---world---')).toEqual(['hello', 'world']);
		});

		it('should handle leading and trailing spaces', () => {
			expect(toIdentifierSegments('   hello   world   ')).toEqual(['hello', 'world']);
		});

		it('should handle leading and trailing underscores', () => {
			expect(toIdentifierSegments('___hello___world___')).toEqual(['hello', 'world']);
		});

		it('should handle numbers, symbols, underscores, dashes, and periods all at once', () => {
			expect(
				toIdentifierSegments('hello123-w0rld#_my-s3cret.is.cool')
			).toEqual([
				'hello123',
				'w0rld',
				'my',
				's3cret',
				'is',
				'cool'
			]);
		});
	});

	describe('toCamelCase()', () => {
		it('should return an empty string for an empty input', () => {
			expect(toCamelCase('')).toBe('');
		});

		it('should convert a single word to camel case', () => {
			expect(toCamelCase('hello')).toBe('hello');
		});

		it('should convert multiple words to camel case', () => {
			expect(toCamelCase('hello-world')).toBe('helloWorld');
		});

		it('should handle words with punctuation', () => {
			expect(toCamelCase('hello, world!')).toBe('helloWorld');
		});

		it('should handle words with numbers', () => {
			expect(toCamelCase('hello123-world-56-numbers')).toBe('hello123World56Numbers');
		});

		it('should handle leading and trailing dashes', () => {
			expect(toCamelCase('-hello-world-')).toBe('helloWorld');
		});

		it('should handle duplicate dashes', () => {
			expect(toCamelCase('--hello--world--')).toBe('helloWorld');
		});

		it('should convert words seperated by spaces', () => {
			expect(toCamelCase('hello world')).toBe('helloWorld');
		});

		it('should convert all uppercase words seperated by spaces', () => {
			expect(toCamelCase('HELLO WORLD')).toBe('helloWorld');
		});

		it('should convert a snake case string', () => {
			expect(toCamelCase('hello_world')).toBe('helloWorld');
		});

		it('should convert a camel case string', () => {
			expect(toCamelCase('helloWorld')).toBe('helloWorld');
		});

		it('should convert a pascal case string', () => {
			expect(toCamelCase('HelloWorld')).toBe('helloWorld');
		});

		it('should convert a kebab case string', () => {
			expect(toCamelCase('hello-world')).toBe('helloWorld');
		});

		it('should handle nonsense casing and seperators', () => {
			expect(toCamelCase('hEllO_woRLd-ThesE are moreWords')).toBe('hEllOWoRLdThesEAreMoreWords');
		});

		it('should handle ambigious casing situations', () => {
			expect(toCamelCase('XML HTTP Request')).toBe('xmlHttpRequest');
		})
	});

	describe('toKebabCase', () => {
		it('should return an empty string for an empty input', () => {
			expect(toKebabCase('')).toBe('');
		});

		it('should convert a string to kebab case', () => {
			expect(toKebabCase('hello world')).toBe('hello-world');
		});

		it('should convert a snake case string', () => {
			expect(toKebabCase('hello_world')).toBe('hello-world');
		});

		it('should convert a camel case string', () => {
			expect(toKebabCase('helloWorld')).toBe('hello-world');
		});

		it('should convert a pascal case string', () => {
			expect(toKebabCase('HelloWorld')).toBe('hello-world');
		});

		it('should convert a kebab case string', () => {
			expect(toKebabCase('hello-world')).toBe('hello-world');
		});

		it('should handle ambigious casing situations', () => {
			expect(toKebabCase('XML HTTP Request')).toBe('xml-http-request');
		});
	});

	describe('toPascalCase', () => {
		it('should return an empty string for an empty input', () => {
			expect(toPascalCase('')).toBe('');
		});

		it('should convert a string to pascal case', () => {
			expect(toPascalCase('hello world')).toBe('HelloWorld');
		});

		it('should convert a snake case string', () => {
			expect(toPascalCase('hello_world')).toBe('HelloWorld');
		});

		it('should convert a camel case string', () => {
			expect(toPascalCase('helloWorld')).toBe('HelloWorld');
		});

		it('should convert a pascal case string', () => {
			expect(toPascalCase('HelloWorld')).toBe('HelloWorld');
		});

		it('should convert a kebab case string', () => {
			expect(toPascalCase('hello-world')).toBe('HelloWorld');
		});

		it('should handle ambigious casing situations', () => {
			expect(toPascalCase('XML HTTP Request')).toBe('XmlHttpRequest');
		});
	});

	describe('createTextProgressBar', () => {
		it('should return an empty progress bar for 0% completion', () => {
			const result = createTextProgressBar(0, 100, 20);
			expect(result).toBe('[————————————————————]0%');
		});

		it('should return a full progress bar for 100% completion', () => {
			const result = createTextProgressBar(100, 100, 20);
			expect(result).toBe('[▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇]100%');
		});

		it('should return a half-filled progress bar for 50% completion', () => {
			const result = createTextProgressBar(50, 100, 20);
			expect(result).toBe('[▇▇▇▇▇▇▇▇▇▇——————————]50%');
		});

		it('should return a progress bar with decimal percentage', () => {
			const result = createTextProgressBar(33, 100, 20);
			expect(result).toBe('[▇▇▇▇▇▇▇—————————————]33%');
		});

		it('should return an empty progress bar for edge cases', () => {
			const result1 = createTextProgressBar(0, 0, 7);
			expect(result1).toBe('[———————]0%');

			const result2 = createTextProgressBar(100, 0, 7);
			expect(result2).toBe('[———————]0%');

			const result3 = createTextProgressBar(100, 100, 0);
			expect(result3).toBe('[]100%');
		});
	});

	describe('toNumericOrdinal()', () => {
		it('should return the correct ordinal suffix for numbers ending in 1', () => {
			expect(toNumericOrdinal(1)).toBe('1st');
			expect(toNumericOrdinal(21)).toBe('21st');
			expect(toNumericOrdinal(101)).toBe('101st');
		});

		it('should return the correct ordinal suffix for numbers ending in 2', () => {
			expect(toNumericOrdinal(2)).toBe('2nd');
			expect(toNumericOrdinal(22)).toBe('22nd');
			expect(toNumericOrdinal(102)).toBe('102nd');
		});

		it('should return the correct ordinal suffix for numbers ending in 3', () => {
			expect(toNumericOrdinal(3)).toBe('3rd');
			expect(toNumericOrdinal(23)).toBe('23rd');
			expect(toNumericOrdinal(103)).toBe('103rd');
		});

		it('should return the correct ordinal suffix for numbers ending in 4-9', () => {
			expect(toNumericOrdinal(4)).toBe('4th');
			expect(toNumericOrdinal(24)).toBe('24th');
			expect(toNumericOrdinal(104)).toBe('104th');
		});

		it('should handle numbers ending in 11, 12, or 13 (special cases)', () => {
			expect(toNumericOrdinal(11)).toBe('11th');
			expect(toNumericOrdinal(12)).toBe('12th');
			expect(toNumericOrdinal(13)).toBe('13th');
		});

		it('should throw an error for NaN inputs', () => {
			expect(() => toNumericOrdinal(NaN)).toThrow('Input is not a valid number');
		});

		it('should handle edge cases (0, negative numbers, etc.)', () => {
			expect(toNumericOrdinal(0)).toBe('0th');
			expect(toNumericOrdinal(-1)).toBe('-1st');
			expect(toNumericOrdinal(-11)).toBe('-11th');
		});
	});

	describe('toWordOrdinal()', () => {
		it('should return correct ordinal for numbers less than 20', () => {
			expect(toWordOrdinal(1)).toBe('first');
			expect(toWordOrdinal(2)).toBe('second');
			expect(toWordOrdinal(3)).toBe('third');
			expect(toWordOrdinal(19)).toBe('nineteenth');
		});

		it('should return correct ordinal for exact multiples of ten', () => {
			expect(toWordOrdinal(10)).toBe('tenth');
			expect(toWordOrdinal(20)).toBe('twentieth');
			expect(toWordOrdinal(30)).toBe('thirtieth');
		});

		it('should return correct ordinal for numbers with non-zero last digit', () => {
			expect(toWordOrdinal(21)).toBe('twenty-first');
			expect(toWordOrdinal(32)).toBe('thirty-second');
			expect(toWordOrdinal(43)).toBe('forty-third');
		});

		it('should throw an error for NaN input', () => {
			expect(() => toWordOrdinal(NaN)).toThrow('Input is not a valid number');
		});

		it('should throw an error for too large input', () => {
			expect(() => toWordOrdinal(1000)).toThrow('Number too large');
		});

		it('should handle 0', () => {
			expect(toWordOrdinal(0)).toBe('zeroth');
		});

		it('should throw an error for negative numbers', () => {
			expect(() => toWordOrdinal(-1)).toThrow('Number should be non-negative');
			expect(() => toWordOrdinal(-10)).toThrow('Number should be non-negative');
		});
	});

	describe('createListFromWords()', () => {
		it('should return empty string for empty array', () => {
			expect(createListFromWords([])).toBe('');
		});

		it('should return single word for single word array', () => {
			expect(createListFromWords(['hello'])).toBe('hello');
		});

		it('should return two words with "and" for two word array', () => {
			expect(createListFromWords(['hello', 'world'])).toBe('hello and world');
		});

		it('should return multiple words with commas and "and" for multiple word array', () => {
			expect(createListFromWords(['hello', 'world', 'foo', 'bar'])).toBe('hello, world, foo, and bar');
		});
	});

	describe('wrapTextByLineWidth()', () => {
		it('should return an empty array for empty text', () => {
			const text = '';
			const lineWidth = 10;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual([]);
		});

		it('should return the original text for text shorter than line width', () => {
			const text = 'hello';
			const lineWidth = 10;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual([text]);
		});

		it('should return the original text for text exactly equal to line width', () => {
			const text = 'hello world';
			const lineWidth = 11;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual([text]);
		});

		it('should wrap text longer than line width with spaces', () => {
			const text = 'hello world this is a test';
			const lineWidth = 10;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual(['hello', 'world this', 'is a test']);
		});

		it('should wrap text longer than line width without spaces', () => {
			const text = 'helloworldthisisatest';
			const lineWidth = 10;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual(['helloworld', 'thisisates', 't']);
		});

		it('should ignore leading/trailing spaces', () => {
			const text = '   hello world   ';
			const lineWidth = 11;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual(['hello world']);
		});

		it('should ignore consecutive spaces', () => {
			const text = 'hello  world  this  is  a  test';
			const lineWidth = 10;
			expect(wrapTextByLineWidth(text, lineWidth)).toEqual(['hello', 'world this', 'is a test']);
		});

		it('should throw an error for invalid line width', () => {
			const text = 'hello world';
			expect(() => wrapTextByLineWidth(text, -10)).toThrow('lineWidth must be a positive number.');
			expect(() => wrapTextByLineWidth(text, 0)).toThrow('lineWidth must be a positive number.');
		});
	});

	describe('removeLinks()', () => {
		it('should remove a single URL from a string', () => {
			const input = 'Hello, visit https://www.example.com for more info.';
			const expectedOutput = 'Hello, visit  for more info.';
			expect(removeLinks(input)).toBe(expectedOutput);
		});

		it('should remove multiple URLs from a string', () => {
			const input = 'Hello, visit https://www.example.com and http://www.google.com for more info.';
			const expectedOutput = 'Hello, visit  and  for more info.';
			expect(removeLinks(input)).toBe(expectedOutput);
		});

		it('should not modify a string with no URLs', () => {
			const input = 'Hello, world!';
			const expectedOutput = 'Hello, world!';
			expect(removeLinks(input)).toBe(expectedOutput);
		});

		it('should remove a URL with special characters', () => {
			const input = 'Hello, visit https://www.example.com/path?query=param#anchor for more info.';
			const expectedOutput = 'Hello, visit  for more info.';
			expect(removeLinks(input)).toBe(expectedOutput);
		});

		it('should return an empty string for an empty input', () => {
			const input = '';
			const expectedOutput = '';
			expect(removeLinks(input)).toBe(expectedOutput);
		});
	});

	describe('removeEmojis()', () => {
		it('should remove emojis from a string', () => {
			const input = 'Hello 🌎 world!';
			const expectedOutput = 'Hello  world!';
			expect(removeEmojis(input)).toBe(expectedOutput);
		});

		it('should return the original string if it does not contain emojis', () => {
			const input = 'Hello world!';
			const expectedOutput = 'Hello world!';
			expect(removeEmojis(input)).toBe(expectedOutput);
		});

		it('should return an empty string if the input is an empty string', () => {
			const input = '';
			const expectedOutput = '';
			expect(removeEmojis(input)).toBe(expectedOutput);
		});
	});

	describe('createNowUnixTimestamp', () => {
		it('returns a valid Unix timestamp', () => {
			const timestamp = createNowUnixTimestamp();
			expect(timestamp).toBeGreaterThan(0);
			expect(timestamp).toBeLessThan(Date.now() / 1000 + 1);
		});

		it('returns a timestamp close to the current time', () => {
			const now = Date.now() / 1000;
			const timestamp = createNowUnixTimestamp();
			expect(timestamp).toBeCloseTo(now, -1);
		});
	});

	describe('findStringStartingWith()', () => {
		it('should return exact match', () => {
			const startingString = 'hello';
			const possibleStrings = ['hello', 'world', 'foo'];
			expect(findStringStartingWith(startingString, possibleStrings)).toBe('hello');
		});

		it('should return partial match', () => {
			const startingString = 'he';
			const possibleStrings = ['hello', 'world', 'foo'];
			expect(findStringStartingWith(startingString, possibleStrings)).toBe('hello');
		});

		it('should return undefined with no match', () => {
			const startingString = 'bar';
			const possibleStrings = ['hello', 'world', 'foo'];
			expect(findStringStartingWith(startingString, possibleStrings)).toBeUndefined();
		});

		it('should return undefined with empty possible strings array', () => {
			const startingString = 'hello';
			const possibleStrings: string[] = [];
			expect(findStringStartingWith(startingString, possibleStrings)).toBeUndefined();
		});
	});

	describe('incrementEndNumber()', () => {
		it('should append 2 to a string with no number at the end', () => {
			expect(incrementEndNumber('hello')).toBe('hello2');
		});

		it('should increment a string with a number at the end by default amount (1)', () => {
			expect(incrementEndNumber('hello1')).toBe('hello2');
		});

		it('should increment a string with a number greater than one at the end', () => {
			expect(incrementEndNumber('hello5')).toBe('hello6');
		});

		it('should increment a string with a number at the end by a specified amount', () => {
			expect(incrementEndNumber('hello1', 2)).toBe('hello3');
		});

		it('should increment a string with a single digit number at the end', () => {
			expect(incrementEndNumber('hello9')).toBe('hello10');
		});

		it('should increment a string with a multi-digit number at the end', () => {
			expect(incrementEndNumber('hello99')).toBe('hello100');
		});

		it('should increment a string with a number at the end that results in a single digit number', () => {
			expect(incrementEndNumber('hello10', -9)).toBe('hello1');
		});

		it('should increment a string with a number at the end that results in a multi-digit number', () => {
			expect(incrementEndNumber('hello9', 10)).toBe('hello19');
		});

		it('should handle negative end number outputs', () => {
			expect(incrementEndNumber('hello', -2)).toBe('hello-1');
		});

		it('should handle confusing strings with many numeric characters', () => {
			expect(incrementEndNumber('10wordswith98syllables1234567890')).toBe('10wordswith98syllables1234567891');
		});
	});

	describe('removeCharacterAt()', () => {
		it('removes a character from a string at the specified index', () => {
			expect(removeCharacterAt('hello', 2)).toBe('helo');
		});

		it('removes a character from a string at the first index', () => {
			expect(removeCharacterAt('hello', 0)).toBe('ello');
		});

		it('removes a character from a string at the last index', () => {
			expect(removeCharacterAt('hello', 4)).toBe('hell');
		});

		it('throws an error if the index is negative', () => {
			expect(() => removeCharacterAt('hello', -1)).toThrow();
		});

		it('throws an error if the index is greater than or equal to the string length', () => {
			expect(() => removeCharacterAt('hello', 5)).toThrow();
		});

		it('throws an error if the index is not an integer', () => {
			expect(() => removeCharacterAt('hello', 2.5)).toThrow();
		});

		it('removes a character from a string with non-ASCII characters', () => {
			expect(removeCharacterAt('héllo', 2)).toBe('hélo');
		});

		it('removes a character from a string with special characters', () => {
			expect(removeCharacterAt('hello!', 5)).toBe('hello');
		});

		it('throws an error when trying to remove a character from an empty string', () => {
			expect(() => removeCharacterAt('', 0)).toThrow();
		});

	})

	describe('removeCharactersFromEnd()', () => {
		it('should remove characters from the end of a string until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('abcdefgh', 'fg')).toBe('abcdeh');
		});

		it('should remove multiple characters from the end of a string until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('aaabbcccccgggjjj', 'ccgj')).toBe('aaabbcccggjj');
		});

		it('should remove repeated characters from the end of a string until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('akppaakkpaakap', 'paakaa')).toBe('akppakkp');
		});

		it('should remove characters from the end of a string with repeated patterns until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('abcabcabc', 'abb')).toBe('abcacc');
		});

		it('should remove characters from the end of a string with consecutive repeated characters until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('cheeses', 'se')).toBe('chees');
		});

		it('should remove characters from the end of a string with spaces and punctuation until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('a pink ponytail', 'pit')).toBe('a pink onyal');
		});

		it('should remove characters from the end of a string with multiple consecutive repeated characters until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('no nonsense', 'nnooee')).toBe('n nss');
		});

		it('should remove characters from the end of a string with uppercase characters until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('AABBBAA', 'AAA')).toBe('ABBB');
		});

		it('should remove a single character from the end of a string until all characters in the given set of characters are removed', () => {
			expect(removeCharactersAsGivenFromEnd('AABBBAA', 'A')).toBe('AABBBA');
		});

		it('should throw an error if the given set of characters is more characters than the string', () => {
			expect(() => removeCharactersAsGivenFromEnd('AABBBAA', 'AAAAA')).toThrow();
		});
	});

	describe('removeMissingCharacters()', () => {
		it('should remove characters not in given string', () => {
			makeSure(removeMissingCharacters('abcd', 'ab')).is('ab');
		});

		it('should remove all characters if given string is empty', () => {
			makeSure(removeMissingCharacters('abcd', '')).is('');
		});

		it('should remove no characters if given string is the same as the string', () => {
			makeSure(removeMissingCharacters('abcd', 'abcd')).is('abcd');
		});

		it('should remove no characters if given string has more characters than the string', () => {
			makeSure(removeMissingCharacters('abcd', 'abcdefghijklmnop')).is('abcd');
		});

		it('should remove only some characters if given string has some but not all characters of the string', () => {
			makeSure(removeMissingCharacters('aaaaa', 'aa')).is('aa');
		});

		it('should handle extra characters and missing characters at the same time', () => {
			makeSure(removeMissingCharacters('Jenna', 'Jeam')).is('Jea');
		});

		it('should return an empty string if the first given string is empty', () => {
			makeSure(removeMissingCharacters('', 'abcdefghijklmnop')).is('');
		});

		it('should handle unique unicode characters', () => {
			makeSure(removeMissingCharacters(' ❌•╹≠∪', '❌λ ∪∩')).is(' ❌∪');
		});
	});

	describe('addSIfPlural()', () => {
		it('should add an "s" if the amount is not 1', () => {
			makeSure(addSIfPlural('cat', 2)).is('cats');
		});

		it('should not add an "s" if the amount is 1', () => {
			makeSure(addSIfPlural('cat', 1)).is('cat');
		});

		it('should add an "s" if the amount is 0', () => {
			makeSure(addSIfPlural('cat', 0)).is('cats');
		});

		it('should add an "s" if the amount is negative', () => {
			makeSure(addSIfPlural('cat', -1)).is('cats');
		});
	});

	describe('toNumericalNounPhrase()', () => {
		it('should return a singular if the amount is 1', () => {
			makeSure(toAmountOfNoun(1, 'cat')).is('1 cat');
		});

		it('should return a plural if the amount is 0', () => {
			makeSure(toAmountOfNoun(0, 'cat')).is('0 cats');
		});

		it('should return a plural if the amount is negative', () => {
			makeSure(toAmountOfNoun(-1, 'cat')).is('-1 cats');
		});

		it('should add an "s" if the amount is 2', () => {
			makeSure(toAmountOfNoun(2, 'cat')).is('2 cats');
		});
	});

	describe('joinLines()', () => {
		it('should join array of lines with a newline', () => {
			const result = joinLines(['line 1', 'line 2', 'line 3']);

			makeSure(result).is('line 1\nline 2\nline 3');
		});

		it('should join parameters with a newline', () => {
			const result = joinLines('line 1', 'line 2', 'line 3');

			makeSure(result).is('line 1\nline 2\nline 3');
		});

		it('should ignore undefined lines', () => {
			const result = joinLines('line 1', undefined, 'line 3');

			makeSure(result).is('line 1\nline 3');
		});

		it('should ignore null lines', () => {
			const result = joinLines('line 1', null, 'line 3');

			makeSure(result).is('line 1\nline 3');
		});

		it('should join a mix of strings, array strings, undefined, and null', () => {
			const result = joinLines(
				'line 1',
				['line 2', 'line 3'],
				undefined,
				null,
				'line 4',
				['line 5', 'line 6'],
				['line 7', 'line 8']
			);

			makeSure(result).is('line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8');
		});
	});

	describe('capitalizeFirstLetter()', () => {
		it('should capitalize the first letter of a string', () => {
			makeSure(capitalizeFirstLetter('hello')).is('Hello');
		});

		it('should ignore a number at the start of the string', () => {
			makeSure(capitalizeFirstLetter('1hello')).is('1hello');
			makeSure(capitalizeFirstLetter('2hello')).is('2hello');
			makeSure(capitalizeFirstLetter('3hello')).is('3hello');
		});

		it('should ignore all symbols at the start of the string', () => {
			makeSure(capitalizeFirstLetter('!hello')).is('!hello');
			makeSure(capitalizeFirstLetter('&hello')).is('&hello');
			makeSure(capitalizeFirstLetter('#hello')).is('#hello');
		});

		it('should preserve the rest of the string', () => {
			makeSure(capitalizeFirstLetter('hello world')).is('Hello world');
		});

		it('should work with empty strings', () => {
			makeSure(capitalizeFirstLetter('')).is('');
		});

		it('should capitalize a single letter string', () => {
			makeSure(capitalizeFirstLetter('a')).is('A');
		});
	});
});