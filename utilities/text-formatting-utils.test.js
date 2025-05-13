const { toTitleCase } = require("./text-formatting-utils");

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