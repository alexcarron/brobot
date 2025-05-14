/**
 * Calculates the Greatest Common Divisor (GCD) of two numbers.
 * @param {number} number1 - The first number.
 * @param {number} number2 - The second number.
 * @returns {number} - The GCD of the two numbers.
 * @throws Will throw an error if any of the inputs are not numbers.
 */
const getGreatestCommonDivisor = (number1, number2) => {
	// Validate inputs to ensure they are numbers
	if (typeof number1 !== 'number')
		throw new Error('number1 must be a number.');

	if (typeof number2 !== 'number')
		throw new Error('number2 must be a number.');

	if (Number.isInteger(number1) === false)
		throw new Error('number1 must be an integer.');

	if (Number.isInteger(number2) === false)
		throw new Error('number2 must be an integer.');

	if (number1 < 0) number1 *= -1;
	if (number2 < 0) number2 *= -1;

	// Base case: if number2 is 0, GCD is number1
	if (number2 === 0) return number1;

	// Recursive case: compute GCD of number2 and the remainder of number1 divided by number2
	return getGreatestCommonDivisor(number2, number1 % number2);
}

/**
 * Calculates the Least Common Multiple (LCM) of two numbers.
 * @param {number} number1 - The first number.
 * @param {number} number2 - The second number.
 * @returns {number} - The LCM of the two numbers.
 * @throws Will throw an error if any of the inputs are not numbers.
 */
const getLeastCommonMultiple = (number1, number2) => {
	// Validate inputs to ensure they are numbers
	if (typeof number1 !== 'number')
		throw new Error('number1 must be a number.');

	if (typeof number2 !== 'number')
		throw new Error('number2 must be a number.');

	if (Number.isInteger(number1) === false)
		throw new Error('number1 must be an integer.');

	if (Number.isInteger(number2) === false)
		throw new Error('number2 must be an integer.');

	return (
		(number1 * number2) /
		getGreatestCommonDivisor(number1, number2)
	);
};

module.exports = { getGreatestCommonDivisor, getLeastCommonMultiple };