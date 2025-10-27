import { Collection } from "discord.js";
import { InvalidArgumentError } from "./error-utils";
import { isStringToUnknownRecord, isArray } from "./types/type-guards";

/**
 * Sets a nested property in an object.
 * @param object - The object that contains the property to be set.
 * @param propertyPath - The path to the property to be set, as an array of strings.
 * @param value - The value to be set for the property.
 */
export const setNestedProperty = (
	object: Record<string, unknown>,
	propertyPath: string[],
	value: unknown
) => {
	if (typeof object !== 'object')
		throw new Error('Object must be an object.');

	if (!Array.isArray(propertyPath))
		throw new Error('Property path must be an array.');

	if (propertyPath.length === 0)
		throw new Error('Property path must have at least one property.');

	const topLevelProperty = propertyPath[0];

	// If the property path only has one element, we can set the property directly.
	if (propertyPath.length <= 1) {
		object[topLevelProperty] = value;
		return;
	}

	// If the highest property does not exist, create it.
	if (object[topLevelProperty] === undefined) {
		object[topLevelProperty] = {};
	}

	if (!isStringToUnknownRecord(object[topLevelProperty])) {
		throw new InvalidArgumentError(`setNestedProperty: Value of property "${topLevelProperty}" is not an object.`);
	}

	setNestedProperty(
		object[topLevelProperty],
		propertyPath.slice(1),
		value
	);
}

/**
 * Appends a value to a nested property in an object. If the property does not exist, it is created.
 * @param object - The object that contains the property to be set.
 * @param propertyPath - The path to the property to be set, as an array of strings.
 * @param value - The value to be appended to the property.
 */
export const appendToNestedProperty = (
	object: Record<string, unknown>,
	propertyPath: string[],
	value: unknown
) => {
	if (typeof object !== 'object')
		throw new Error('Object must be an object.');

	if (!Array.isArray(propertyPath))
		throw new Error('Property path must be an array.');

	if (propertyPath.length === 0)
		throw new Error('Property path must have at least one property.');

	const topLevelProperty = propertyPath[0];

	if (propertyPath.length == 1) {
		if (object[topLevelProperty]) {
			if (isArray(object[topLevelProperty]))
				object[topLevelProperty].push(value);
			else
				throw new InvalidArgumentError(`appendToNestedProperty: Value of property "${topLevelProperty}" is not an array.`);
		} else {
			object[topLevelProperty] = [value];
		}

		return;
	}

	// If the highest property does not exist, create it.
	if (object[topLevelProperty] === undefined) {
		object[topLevelProperty] = {};
	}

	if (!isStringToUnknownRecord(object[topLevelProperty])) {
		throw new InvalidArgumentError(`appendToNestedProperty: Value of property "${topLevelProperty}" is not an object.`);
	}

	// Go one level deeper in the object
	appendToNestedProperty(
		object[topLevelProperty],
		propertyPath.slice(1),
		value
	);
}

/**
 * Swaps the elements at the two given indices in the given array.
 * @param array {unknown[]} - The array to be modified.
 * @param index1 {number} - The index of the first element to be swapped.
 * @param index2 {number} - The index of the second element to be swapped.
 */
export const swapArrayElements = (
	array: unknown[],
	index1: number,
	index2: number
) => {
	const valueOfIndex1 = array[index1];
	const valueOfIndex2 = array[index2];
	array[index1] = valueOfIndex2;
	array[index2] = valueOfIndex1;
}

/**
 * Returns a copy of the given array, shuffled randomly.
 * @param array - The array to be shuffled.
 * @returns A shuffled copy of the given array.
 */
export const getShuffledArray = <ElementType>(
	array: ElementType[]
): ElementType[] => {
	if (!Array.isArray(array))
		throw new Error('Given value must be an array.');

	const arrayCopy: ElementType[] = [...array];
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
 * @param arrays - The arrays to be compared.
 * @returns True if all arrays have the same elements, false otherwise.
 */
export const arraysHaveSameElements = (...arrays: unknown[][]): boolean => {
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
 * @param array - The array to get a random element from.
 * @returns A random element from the passed array.
 * @throws If the given value is not an array.
 * @throws If the array is empty.
 */
export const getRandomElement = <ElementType>(array: ElementType[]): ElementType => {
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
 * @param originalString The original string for comparison.
 * @param differentString The other string to compare against the original.
 * @returns An object containing two arrays: `missingCharacters` (characters present in the original but missing in the modified) and `extraCharacters` (characters present in the modified but not in the original).
 */
export const getCharacterDifferences = (
	originalString: string,
	differentString: string
) => {
	if (typeof originalString !== 'string' || typeof differentString !== 'string') {
		throw new TypeError('Both the original and modified strings arguments must be strings.');
	}
	// Check if extra or missing characters
	const sortedOriginalString = [...originalString].sort();
	const sortedModifiedString = [...differentString].sort();

	let originalCharacterIndex = 0;
	let newCharacterIndex = 0;
	const missingCharacters = [];
	const extraCharacters = [];

	let charactersLeftToCompare = true;
	while (charactersLeftToCompare) {
		if (originalCharacterIndex >= sortedOriginalString.length) {
			const restOfNewCharacters = sortedModifiedString.slice(newCharacterIndex);
			extraCharacters.push(
				...restOfNewCharacters
			);
			charactersLeftToCompare = false;
		}
		else if (newCharacterIndex >= sortedModifiedString.length) {
			const restOfOriginalCharacters = sortedOriginalString.slice(originalCharacterIndex);
			missingCharacters.push(
				...restOfOriginalCharacters
			);
			charactersLeftToCompare = false;
		}
		else {
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
	}

	return { missingCharacters, extraCharacters };
}

/**
 * Converts a Discord.js Collection into an array
 * @param collection Discord.js Collection
 * @returns Array of values from the Collection
 */
export function discordCollectionToArray<KeyType, ValueType>(
	collection: Collection<KeyType, ValueType>
): ValueType[] {
	return Array.from(collection.values());
}

/**
 * Returns a random element from a given object where the property values are used as weights.
 * @param elementToWeight An object where the property values are used as weights.
 * @returns The selected element.
 * @throws If the elementToWeight is not an object.
 * @throws If any of the weights is not a positive number.
 * @throws If the total weight is not greater than 0.
 */
export const getRandomWeightedElement = (elementToWeight: Record<string, number>): string => {
	if (typeof elementToWeight !== 'object') {
		throw new Error('getRandomWeightedElement: elementToWeight must be an object.');
	}

	const elementToWeightEntries = Object.entries(elementToWeight);
	const totalWeight = elementToWeightEntries.reduce((accumulatedWeight, [, weight]) => {
    if (typeof weight !== 'number' || weight < 0) {
      throw new Error(`getRandomWeightedElement: Invalid weight: ${weight}`);
    }
    return accumulatedWeight + weight;
  }, 0);


  if (totalWeight <= 0) {
    throw new Error('getRandomWeightedElement: total weight must be > 0');
  }

	const randomWeight = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const [element, weight] of elementToWeightEntries) {
    cumulativeWeight += weight;
    if (randomWeight < cumulativeWeight) return element;
  }

	throw new Error('getRandomWeightedElement failed: no element selected.');
}

/**
 * Maps an array to a single object by merging the results of a mapping function.
 *
 * Each element is passed to `getPropertyFromItem`, which must return an object
 * (commonly with a single property). These objects are then merged (left to right)
 * into one result object.
 * @param array The array to map into an object.
 * @param getPropertyFromItem A function that maps each item to an object.
 * @returns The merged object containing properties from all items.
 */
export function mapToObject<
	ItemType,
	ObjectType extends Record<string, unknown>
>(
	array: readonly ItemType[],
	getPropertyFromItem: (item: ItemType) => ObjectType
): ObjectType {
  const result = array.reduce<Partial<ObjectType>>(
    (object: Partial<ObjectType>, item: ItemType) => {
			const property = getPropertyFromItem(item);

			for (const key of Object.keys(property)) {
				if (key in object) {
					throw new InvalidArgumentError(
						`mapToObject: The given getPropertyFromItem function must return an object with unique keys. Duplicate key: ${key}`
					);
				}
			}

			return Object.assign(object, property)
		},
    {}
  );

	return result as ObjectType;
}

/**
 * Maps an array of objects to an array of their property values.
 * @template SpecificObject - The type of the objects in the array.
 * @template PropertyName - The name of the property to extract from each object.
 * @param object - The array of objects to map.
 * @param propertyName - The name of the property to extract.
 * @returns An array of the property values.
 */
export function toPropertyValues<
	SpecificObjects extends Record<string, unknown>[],
	PropertyName extends keyof SpecificObjects[number]
>(
	object: SpecificObjects,
	propertyName: PropertyName,
): {
	[Index in keyof SpecificObjects]:
		SpecificObjects[Index][PropertyName]
}
{
	return object
		.map(object => object[propertyName as string]) as any;
}