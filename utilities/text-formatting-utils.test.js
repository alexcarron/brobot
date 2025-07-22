const { toTitleCase, createTextProgressBar, toNumericOrdinal, toWordOrdinal, createListFromWords, wrapTextByLineWidth, removeLinks, removeEmojis, findStringStartingWith, incrementEndNumber } = require("./text-formatting-utils");
const { createNowUnixTimestamp } = require("./date-time-utils");

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

	it('should throw an error for non-numeric input', () => {
		expect(() => createTextProgressBar('a', 100, 20)).toThrow();
		expect(() => createTextProgressBar(100, 'b', 20)).toThrow();
		expect(() => createTextProgressBar(100, 100, 'c')).toThrow();
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

	it('should throw an error for non-numeric inputs', () => {
		expect(() => toNumericOrdinal('a')).toThrow('Input is not a valid number');
		expect(() => toNumericOrdinal(null)).toThrow('Input is not a valid number');
		expect(() => toNumericOrdinal(undefined)).toThrow('Input is not a valid number');
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

	it('should throw an error for non-numeric input', () => {
		expect(() => toWordOrdinal('a')).toThrow('Input is not a valid number');
		expect(() => toWordOrdinal(null)).toThrow('Input is not a valid number');
		expect(() => toWordOrdinal(undefined)).toThrow('Input is not a valid number');
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

	it('should return empty string for null input', () => {
		expect(createListFromWords(null)).toBe('');
	});

	it('should return empty string for undefined input', () => {
		expect(createListFromWords(undefined)).toBe('');
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

	it('should throw an error for invalid text input', () => {
		expect(() => wrapTextByLineWidth(123, 10)).toThrow('text must be a string.');
		expect(() => wrapTextByLineWidth(null, 10)).toThrow('text must be a string.');
		expect(() => wrapTextByLineWidth(undefined, 10)).toThrow('text must be a string.');
	});

	it('should throw an error for invalid line width', () => {
		const text = 'hello world';
		expect(() => wrapTextByLineWidth(text, -10)).toThrow('lineWidth must be a positive number.');
		expect(() => wrapTextByLineWidth(text, 0)).toThrow('lineWidth must be a positive number.');
		expect(() => wrapTextByLineWidth(text, 'invalid')).toThrow('lineWidth must be a positive number.');
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

	it('should throw an error for a null input', () => {
		expect(() => removeLinks(null)).toThrow();
	});

	it('should throw an error for an undefined input', () => {
		expect(() => removeLinks(undefined)).toThrow();
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

	it('should throw an error if the input is null', () => {
		const input = null;
		expect(() => removeEmojis(input)).toThrow();
	});

	it('should throw an error if the input is undefined', () => {
		const input = undefined;
		expect(() => removeEmojis(input)).toThrow();
	});

	it('should throw an error if the input is not a string', () => {
		const input = 123;
		expect(() => removeEmojis(input)).toThrow();
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
		const possibleStrings = [];
		expect(findStringStartingWith(startingString, possibleStrings)).toBeUndefined();
	});

	it('should throw error with null possible strings array', () => {
		const startingString = 'hello';
		const possibleStrings = null;
		expect(() => findStringStartingWith(startingString, possibleStrings)).toThrow();
	});

	it('should throw error with undefined possible strings array', () => {
		const startingString = 'hello';
		const possibleStrings = undefined;
		expect(() => findStringStartingWith(startingString, possibleStrings)).toThrow();
	});

	it('should throw error with non-string starting string', () => {
		const startingString = 123;
		const possibleStrings = ['hello', 'world', 'foo'];
		expect(() => findStringStartingWith(startingString, possibleStrings)).toThrow();
	});

	it('should throw error with non-array possible strings', () => {
		const startingString = 'hello';
		const possibleStrings = 'not an array';
		expect(() => findStringStartingWith(startingString, possibleStrings)).toThrow();
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

	it('should throw an error with a non-string input', () => {
		expect(() => incrementEndNumber(123)).toThrow();
  });

	it('should throw an error with a non-number increment amount', () => {
    expect(() => incrementEndNumber('hello', 'two')).toThrow();
  });

	it('should handle negative end number outputs', () => {
		expect(incrementEndNumber('hello', -2)).toBe('hello-1');
  });

	it('should handle confusing strings with many numeric characters', () => {
		expect(incrementEndNumber('10wordswith98syllables1234567890')).toBe('10wordswith98syllables1234567891');
  });
});