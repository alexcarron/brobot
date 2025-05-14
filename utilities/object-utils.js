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

	let highestProperty = propertyPath[0];

	console.log({
		object,
		propertyPath,
		value,
		highestProperty
	});

	// If the property path only has one element, we can set the property directly.
	if (propertyPath.length <= 1) {
		object[highestProperty] = value;
		console.log({object});
		return object;
	}

	// If the highest property does not exist, create it.
	if (object[highestProperty] === undefined) {
		object[highestProperty] = {};
	}

	// Recursively call the function to set the nested property.
	setNestedProperty(
		object[highestProperty],
		propertyPath.slice(1),
		value
	);
}

module.exports = { setNestedProperty };