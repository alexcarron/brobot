const { toTitleCase, createTextProgressBar } = require("./text-formatting-utils");

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