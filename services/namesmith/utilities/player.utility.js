/**
 * Checks if a given value is an object with the properties of a player.
 * @param {any} value - The value to check.
 * @returns {boolean} If the value is an object with the properties of a player.
 */
const isPlayer = (value) => (
	value !== null &&
	typeof value === 'object' &&
	'id' in value &&
	typeof value.id === 'string' &&
	'currentName' in value &&
	typeof value.currentName === 'string' &&
	'publishedName' in value &&
	(
		value.publishedName === null ||
		typeof value.publishedName === 'string'
	) &&
	'tokens' in value &&
	typeof value.tokens === 'number' &&
	'role' in value &&
	(
		value.role === null ||
		typeof value.role === 'string'
	) &&
	'inventory' in value &&
	typeof value.inventory === 'string'
);

module.exports = { isPlayer };