const { getIDfromCharacterValue, getCharacterValueFromID } = require("./character.utility");

describe('character.utility', () => {
	it('should export the expected functions', () => {
		expect(typeof getIDfromCharacterValue).toBe('function');
		expect(typeof getCharacterValueFromID).toBe('function');
	});

	describe('getIDfromCharacterValue()', () => {
		it('should return the code point value of the character', () => {
			const character = 'a';
			const result = getIDfromCharacterValue(character);
			expect(result).toBe(97);
		});

		it('should throw an error if the input is not a string', () => {
			const character = 1;
			expect(() => getIDfromCharacterValue(character)).toThrow();
		});

		it('should throw an error if the input is not a single character', () => {
			const character = 'ab';
			expect(() => getIDfromCharacterValue(character)).toThrow();
		});

		it('should throw an error if the input is an empty string', () => {
			const character = '';
			expect(() => getIDfromCharacterValue(character)).toThrow();
		});
	});

	describe('getCharacterValueFromID()', () => {
		it('should return the character value from the code point value', () => {
			const codePointValue = 97;
			const result = getCharacterValueFromID(codePointValue);
			expect(result).toBe('a');
		});

		it('should throw an error if the input is not a number', () => {
			const codePointValue = 'a';
			expect(() => getCharacterValueFromID(codePointValue)).toThrow();
		});

		it('should throw an error if the input is a negative number', () => {
			const codePointValue = -1;
			expect(() => getCharacterValueFromID(codePointValue)).toThrow();
		});

		it('should throw an error if the input is a float', () => {
			const codePointValue = 97.5;
			expect(() => getCharacterValueFromID(codePointValue)).toThrow();
		});
	});
})