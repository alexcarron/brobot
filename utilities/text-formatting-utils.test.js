const { toTitleCase, createTextProgressBar, toNumericOrdinal } = require("./text-formatting-utils");

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