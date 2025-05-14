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

const swapArrayElements = (array, index1, index2) => {
	let valueOfIndex1 = array[index1];
	let valueOfIndex2 = array[index2];
	array[index1] = valueOfIndex2;
	array[index2] = valueOfIndex1;
}


/**
 * Returns a copy of the given array, shuffled randomly.
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} A shuffled copy of the given array.
 */
const getShuffledArray = (array) => {
	if (!Array.isArray(array))
		throw new Error('Given value must be an array.');

	const arrayCopy = [...array];
	let currentIndex = arrayCopy.length;
	let randomIndex;

	// While there are remaining elements to shuffle.
	while (currentIndex !== 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		// Decrease current index by one.
		currentIndex--;

		// Swap the current element with the randomly picked element.
		swapArrayElements(arrayCopy, currentIndex, randomIndex);
	}

	// Return the shuffled array.
	return arrayCopy;
}

module.exports = { setNestedProperty, appendToNestedProperty, getShuffledArray };