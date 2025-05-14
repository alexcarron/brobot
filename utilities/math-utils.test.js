const { getGreatestCommonDivisor, getLeastCommonMultiple } = require("./math-utils");

describe('getGreatestCommonDivisor function', () => {
	it('should calculate GCD of two positive numbers', () => {
		expect(getGreatestCommonDivisor(12, 8)).toBe(4);
		expect(getGreatestCommonDivisor(24, 30)).toBe(6);
	});

	it('should calculate GCD of two negative numbers', () => {
		expect(getGreatestCommonDivisor(-12, -8)).toBe(4);
		expect(getGreatestCommonDivisor(-24, -30)).toBe(6);
	});

	it('should calculate GCD of a positive and a negative number', () => {
		expect(getGreatestCommonDivisor(12, -8)).toBe(4);
		expect(getGreatestCommonDivisor(-24, 30)).toBe(6);
	});

	it('should calculate GCD of two numbers where one is zero', () => {
		expect(getGreatestCommonDivisor(12, 0)).toBe(12);
		expect(getGreatestCommonDivisor(0, 8)).toBe(8);
	});

	it('should calculate GCD of two numbers where both are zero', () => {
		expect(getGreatestCommonDivisor(0, 0)).toBe(0);
	});

	it('should throw an error with non-numeric inputs', () => {
		expect(() => getGreatestCommonDivisor('a', 8)).toThrowError('number1 must be a number.');
		expect(() => getGreatestCommonDivisor(12, 'b')).toThrowError('number2 must be a number.');
		expect(() => getGreatestCommonDivisor(null, 8)).toThrowError('number1 must be a number.');
		expect(() => getGreatestCommonDivisor(12, undefined)).toThrowError('number2 must be a number.');
	});

	it('should throw an error with non-integer inputs', () => {
		expect(() => getGreatestCommonDivisor(12.5, 8)).toThrowError('number1 must be an integer.');
		expect(() => getGreatestCommonDivisor(12, 8.5)).toThrowError('number2 must be an integer.');
	});
});

describe('getLeastCommonMultiple function', () => {
	it('should return the correct LCM for positive integers', () => {
		expect(getLeastCommonMultiple(2, 3)).toBe(6);
		expect(getLeastCommonMultiple(4, 5)).toBe(20);
	});

	it('should return the correct LCM for negative integers', () => {
		expect(getLeastCommonMultiple(-2, -3)).toBe(6);
		expect(getLeastCommonMultiple(-4, -5)).toBe(20);
	});

	it('should return the correct LCM for zero', () => {
		expect(getLeastCommonMultiple(0, 5)).toBe(0);
		expect(getLeastCommonMultiple(5, 0)).toBe(0);
	});

	it('should throw an error for non-numeric inputs', () => {
		expect(() => getLeastCommonMultiple('a', 2)).toThrowError('number1 must be a number.');
		expect(() => getLeastCommonMultiple(2, 'b')).toThrowError('number2 must be a number.');
		expect(() => getLeastCommonMultiple(null, 2)).toThrowError('number1 must be a number.');
		expect(() => getLeastCommonMultiple(2, null)).toThrowError('number2 must be a number.');
		expect(() => getLeastCommonMultiple(undefined, 2)).toThrowError('number1 must be a number.');
		expect(() => getLeastCommonMultiple(2, undefined)).toThrowError('number2 must be a number.');
	});

	it('should return the correct LCM for 1 and another number', () => {
		expect(getLeastCommonMultiple(1, 2)).toBe(2);
		expect(getLeastCommonMultiple(2, 1)).toBe(2);
	});

	it('should return the correct LCM for two identical numbers', () => {
		expect(getLeastCommonMultiple(2, 2)).toBe(2);
		expect(getLeastCommonMultiple(5, 5)).toBe(5);
	});

	it('should throw an error for non-integer inputs', () => {
		expect(() => getLeastCommonMultiple(2.5, 3)).toThrowError('number1 must be an integer.');
		expect(() => getLeastCommonMultiple(4, 3.5)).toThrowError('number2 must be an integer.');
	});
});