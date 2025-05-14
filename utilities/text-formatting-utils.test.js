const { toTitleCase, createTextProgressBar, toNumericOrdinal, toWordOrdinal, createListFromWords, wrapTextByLineWidth, removeLinks, removeEmojis } = require("./text-formatting-utils");

describe('toTitleCase function', () => {
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
		expect(() => createTextProgressBar('a', 100, 20)).toThrowError();
		expect(() => createTextProgressBar(100, 'b', 20)).toThrowError();
		expect(() => createTextProgressBar(100, 100, 'c')).toThrowError();
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

describe('toNumericOrdinal function', () => {
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
		expect(() => toNumericOrdinal('a')).toThrowError('Input is not a valid number');
		expect(() => toNumericOrdinal(null)).toThrowError('Input is not a valid number');
		expect(() => toNumericOrdinal(undefined)).toThrowError('Input is not a valid number');
	});

	it('should throw an error for NaN inputs', () => {
		expect(() => toNumericOrdinal(NaN)).toThrowError('Input is not a valid number');
	});

	it('should handle edge cases (0, negative numbers, etc.)', () => {
		expect(toNumericOrdinal(0)).toBe('0th');
		expect(toNumericOrdinal(-1)).toBe('-1st');
		expect(toNumericOrdinal(-11)).toBe('-11th');
	});
});

describe('toWordOrdinal function', () => {
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
		expect(() => toWordOrdinal('a')).toThrowError('Input is not a valid number');
		expect(() => toWordOrdinal(null)).toThrowError('Input is not a valid number');
		expect(() => toWordOrdinal(undefined)).toThrowError('Input is not a valid number');
	});

	it('should throw an error for NaN input', () => {
		expect(() => toWordOrdinal(NaN)).toThrowError('Input is not a valid number');
	});

	it('should throw an error for too large input', () => {
		expect(() => toWordOrdinal(1000)).toThrowError('Number too large');
	});

	it('should handle 0', () => {
		expect(toWordOrdinal(0)).toBe('zeroth');
	});

	it('should throw an error for negative numbers', () => {
		expect(() => toWordOrdinal(-1)).toThrowError('Number should be non-negative');
		expect(() => toWordOrdinal(-10)).toThrowError('Number should be non-negative');
	});
});

describe('createListFromWords function', () => {
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

describe('wrapTextByLineWidth function', () => {
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
		expect(() => wrapTextByLineWidth(123, 10)).toThrowError('text must be a string.');
		expect(() => wrapTextByLineWidth(null, 10)).toThrowError('text must be a string.');
		expect(() => wrapTextByLineWidth(undefined, 10)).toThrowError('text must be a string.');
	});

	it('should throw an error for invalid line width', () => {
		const text = 'hello world';
		expect(() => wrapTextByLineWidth(text, -10)).toThrowError('lineWidth must be a positive number.');
		expect(() => wrapTextByLineWidth(text, 0)).toThrowError('lineWidth must be a positive number.');
		expect(() => wrapTextByLineWidth(text, 'invalid')).toThrowError('lineWidth must be a positive number.');
	});
});

describe('removeLinks function', () => {
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
		expect(() => removeLinks(null)).toThrowError();
	});

	it('should throw an error for an undefined input', () => {
		expect(() => removeLinks(undefined)).toThrowError();
	});
});

describe('removeEmojis function', () => {
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
		expect(() => removeEmojis(input)).toThrowError();
	});

	it('should throw an error if the input is undefined', () => {
		const input = undefined;
		expect(() => removeEmojis(input)).toThrowError();
	});

	it('should throw an error if the input is not a string', () => {
		const input = 123;
		expect(() => removeEmojis(input)).toThrowError();
	});
});