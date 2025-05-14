const { createRandomHexColor } = require("./color-utils");

describe('createRandomHexColor', () => {
	it('returns a string', () => {
		const result = createRandomHexColor();
		expect(typeof result).toBe('string');
	});

	it('returns a string of length 6', () => {
		const result = createRandomHexColor();
		expect(result.length).toBe(6);
	});

	it('returns a string containing only valid hex characters', () => {
		const result = createRandomHexColor();
		const validHexChars = '0123456789ABCDEF';
		for (let i = 0; i < result.length; i++) {
			expect(validHexChars.includes(result[i])).toBe(true);
		}
	});
});