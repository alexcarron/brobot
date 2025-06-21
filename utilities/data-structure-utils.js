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

/**
 * Checks if all given arrays have the same elements.
 * @param {...Array} arrays - The arrays to be compared.
 * @returns {boolean} True if all arrays have the same elements, false otherwise.
 */
const arraysHaveSameElements = (...arrays) => {
	if (arrays.length < 2)
		throw new Error('At least two arrays must be passed.');

	if (arrays.some(array => !Array.isArray(array)))
		throw new Error('All arguments must be arrays.');

	// Check if all arrays have the same length.
	const firstArray = arrays[0];
	if (arrays.some(array => array.length !== firstArray.length))
		return false;

	// Count the number of occurances of each element in the first array.
	const elementToNumOccurances = new Map();
	for (const element of firstArray) {
		const numOccurances = elementToNumOccurances.get(element) || 0;

		elementToNumOccurances.set(element,
			numOccurances + 1
		);
	}

	// Check if the same elements occur in all other arrays, with the same number of occurances.
	for (const otherArray of arrays.slice(1)) {
		const elementToNumOccurancesCopy = new Map(elementToNumOccurances);

    for (const element of otherArray) {
        if (!elementToNumOccurancesCopy.has(element))
					return false;

				const numOccurances = elementToNumOccurancesCopy.get(element);
        elementToNumOccurancesCopy.set(element,
					numOccurances - 1
				);
        if (elementToNumOccurancesCopy.get(element) === 0) elementToNumOccurancesCopy.delete(element);
    }

		return elementToNumOccurancesCopy.size === 0;
	}

	return true;
}


/**
 * Gets a random element from an array.
 * @param {Array} array - The array to get a random element from.
 * @returns {*} A random element from the passed array.
 * @throws {Error} If the given value is not an array.
 * @throws {Error} If the array is empty.
 */
const getRandomElement = (array) => {
	if (!Array.isArray(array)) {
		throw new Error(`Given value must be an array. Received: ${typeof array}`);
	}

	if (array.length === 0) {
		throw new Error('Array must have at least one element.');
	}

	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}

/**
 * Identifies the differences between two strings by comparing their characters.
 * It determines which characters are extra or missing in the modified string compared to the original string.
 *
 * @param {string} originalString - The original string for comparison.
 * @param {string} modifiedString - The modified string to compare against the original.
 * @returns {Object} An object containing two arrays: `missingCharacters` (characters present in the original but missing in the modified) and `extraCharacters` (characters present in the modified but not in the original).
 */
const getCharacterDifferencesInStrings = (originalString, modifiedString) => {
	if (typeof originalString !== 'string' || typeof modifiedString !== 'string') {
		throw new TypeError('Both the original and modified strings arguments must be strings.');
	}
	// Check if extra or missing characters
	const sortedOriginalString = [...originalString].sort();
	const sortedModifiedString = [...modifiedString].sort();

	let originalCharacterIndex = 0;
	let newCharacterIndex = 0;
	const missingCharacters = [];
	const extraCharacters = [];

	// Find specific missing or extra characters
	while (true) {
		if (originalCharacterIndex >= sortedOriginalString.length) {
			const restOfNewCharacters = sortedModifiedString.slice(newCharacterIndex);
			extraCharacters.push(
				...restOfNewCharacters
			);
			break;
		}
		else if (newCharacterIndex >= sortedModifiedString.length) {
			const restOfOriginalCharacters = sortedOriginalString.slice(originalCharacterIndex);
			missingCharacters.push(
				...restOfOriginalCharacters
			);
			break;
		}

		const originalCharacter = sortedOriginalString[originalCharacterIndex];
		const newCharacter = sortedModifiedString[newCharacterIndex];
		// ab efjjklllmnop
		// abcefj  lll

		if (originalCharacter === newCharacter) {
			originalCharacterIndex += 1;
			newCharacterIndex += 1;
		}
		else if (newCharacter < originalCharacter) {
			newCharacterIndex += 1;
			extraCharacters.push(newCharacter);
		}
		else if (newCharacter > originalCharacter) {
			originalCharacterIndex += 1;
			missingCharacters.push(originalCharacter);
		}
	}

	return { missingCharacters, extraCharacters };
}

module.exports = { setNestedProperty, appendToNestedProperty, getShuffledArray, arraysHaveSameElements, getRandomElement, getCharacterDifferencesInStrings };