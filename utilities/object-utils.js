/**
 * Sets a nested property in an object.
 * @param {Object} object - The object that contains the property to be set.
 * @param {Array<string>} propertyPath - The path to the property to be set, as an array of strings.
 * @param {*} value - The value to be set for the property.
 */
const setNestedProperty = (object, propertyPath, value) => {
	if (typeof object !== 'object')
		throw new Error('Object must be an object.');

	if (!Array.isArray(propertyPath))
		throw new Error('Property path must be an array.');

	if (propertyPath.length === 0)
		throw new Error('Property path must have at least one property.');

	let topLevelProperty = propertyPath[0];

	// If the property path only has one element, we can set the property directly.
	if (propertyPath.length <= 1) {
		object[topLevelProperty] = value;
		console.log({object});
		return object;
	}

	// If the highest property does not exist, create it.
	if (object[topLevelProperty] === undefined) {
		object[topLevelProperty] = {};
	}

	// Go one level deeper in the object
	setNestedProperty(
		object[topLevelProperty],
		propertyPath.slice(1),
		value
	);
}

/**
 * Appends a value to a nested property in an object. If the property does not exist, it is created.
 * @param {Object} object - The object that contains the property to be set.
 * @param {Array<string>} propertyPath - The path to the property to be set, as an array of strings.
 * @param {*} value - The value to be appended to the property.
 */
const appendToNestedProperty = (object, propertyPath, value) => {
	if (typeof object !== 'object')
		throw new Error('Object must be an object.');

	if (!Array.isArray(propertyPath))
		throw new Error('Property path must be an array.');

	if (propertyPath.length === 0)
		throw new Error('Property path must have at least one property.');

	let topLevelProperty = propertyPath[0];

	if (propertyPath.length == 1) {
		if (object[topLevelProperty]) {
			object[topLevelProperty].push(value);
		} else {
			object[topLevelProperty] = [value];
		}

		return object;
	}

	// If the highest property does not exist, create it.
	if (object[topLevelProperty] === undefined) {
		object[topLevelProperty] = {};
	}

	// Go one level deeper in the object
	appendToNestedProperty(
		object[topLevelProperty],
		propertyPath.slice(1),
		value
	);
}

module.exports = { setNestedProperty, appendToNestedProperty };