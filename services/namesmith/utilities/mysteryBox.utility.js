/**
 * Checks if a given value is an object where each key is a character and each value is a number representing the odds of the character being in a mystery box.
 * @param {any} value - The value to check.
 * @returns {boolean} If the value is an object with character keys and number values.
 */
const isCharacterOdds = (value) => (
	value !== null &&
	typeof value === 'object' &&
	Object.keys(value).length > 0 &&
	Object.keys(value).every((characterValue) =>
		typeof characterValue === 'string' &&
		typeof value[characterValue] === 'number'
	)
)

/**
 * Checks if a given value is a mystery box object with the given properties.
 * @param {any} value - The value to check.
 * @param {object} [options] - An object with an optional properties that specify the expected properties of the mystery box object.
 * @param {boolean} [options.hasCharacterOdds] - If true, the mystery box object must have a characterOdds property.
 * @returns {boolean} If the value is a mystery box object with the given properties.
 */
const isMysteryBox = (value, {hasCharacterOdds = false} = {}) => (
	value !== null &&
	typeof value === 'object' &&
	'id' in value &&
	typeof value.id === 'number' &&
	'name' in value &&
	typeof value.name === 'string' &&
	'tokenCost' in value &&
	typeof value.tokenCost === 'number' &&
	(hasCharacterOdds ?
		(
			'characterOdds' in value &&
			isCharacterOdds(value.characterOdds)
		) :
		true
	)
);

module.exports = {isCharacterOdds, isMysteryBox};