import {
	setNestedProperty,
	appendToNestedProperty,
	getShuffledArray,
	arraysHaveSameElements,
	getRandomElement,
	getCharacterDifferences,
	getRandomWeightedElement,
	mapToObject,
	sortByAscendingProperty,
	addToArrayMap,
} from "./data-structure-utils";
import { InvalidArgumentError } from "./error-utils";
import { makeSure } from "./jest/jest-utils";

describe('setNestedProperty', () => {
	it('sets a property directly', () => {
		const object = {};
		const propertyPath = ['property'];
		const value = 'value';
		setNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property: 'value' });
	});

	it('sets a nested property with existing path', () => {
		const object = {
			property1: {
				property2: {}
			}
		};
		const propertyPath = ['property1', 'property2', 'property3'];
		const value = 'value';
		setNestedProperty(object, propertyPath, value);
		expect(object).toEqual({
			property1: {
				property2: {
					property3: 'value'
				}
			}
		});
	});

	it('sets a nested property with non-existent path', () => {
		const object = {};
		const propertyPath = ['property1', 'property2', 'property3'];
		const value = 'value';
		setNestedProperty(object, propertyPath, value);
		expect(object).toEqual({
			property1: {
				property2: {
					property3: 'value'
				}
			}
		});
	});

	it('throws an error when setting a property with an empty property path', () => {
		const object = {};
		const propertyPath: string[] = [];
		const value = 'value';
		expect(() => setNestedProperty(object, propertyPath, value)).toThrow();
	});
});

describe('appendToNestedProperty', () => {
	it('appends a value to an existing property with existing elements', () => {
		const object = { property1: ['value1', 'value2'] };
		const propertyPath = ['property1'];
		const value = 'value3';
		appendToNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property1: ['value1', 'value2', 'value3'] });
	});

	it('appends a value to an existing property', () => {
		const object = { property1: [] };
		const propertyPath = ['property1'];
		const value = 'value';
		appendToNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property1: ['value'] });
	});

	it('creates a new property if it does not exist', () => {
		const object = {};
		const propertyPath = ['property1'];
		const value = 'value';
		appendToNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property1: ['value'] });
	});

	it('handles nested properties', () => {
		const object = { property1: {} };
		const propertyPath = ['property1', 'property2'];
		const value = 'value';
		appendToNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property1: { property2: ['value'] } });
	});

	it('handles multiple levels of nesting', () => {
		const object = { property1: {} };
		const propertyPath = ['property1', 'property2', 'property3'];
		const value = 'value';
		appendToNestedProperty(object, propertyPath, value);
		expect(object).toEqual({ property1: { property2: { property3: ['value'] } } });
	});
});

describe('getShuffledArray()', () => {
	it('should not modify the original array', () => {
		const originalArray = [1, 2, 3, 4, 5];
		getShuffledArray(originalArray);
		expect(originalArray).toEqual([1, 2, 3, 4, 5]);
	});

	it('should return an array with the same elements as the original array', () => {
		const originalArray = [1, 2, 3, 4, 5];
		const shuffledArray = getShuffledArray(originalArray);
		expect(shuffledArray.sort()).toEqual(originalArray.sort());
	});

	test('should return the same array when shuffling a single-element array', () => {
			expect(getShuffledArray([1])).toEqual([1]);
	});

	it('should return an empty array when given an empty array input', () => {
		const originalArray: number[] = [];
		const shuffledArray = getShuffledArray(originalArray);
		expect(shuffledArray).toEqual([]);
	});
});

describe('arraysHaveSameElements()', () => {
	it('should throw an error if less than two arrays are passed', () => {
		expect(() => arraysHaveSameElements([1, 2, 3])).toThrow('At least two arrays must be passed.');
	});

	it('should return false if arrays have different lengths', () => {
		expect(arraysHaveSameElements([1, 2, 3], [1, 2])).toBe(false);
	});

	it('should return true if arrays have the same elements but different order', () => {
		expect(arraysHaveSameElements([1, 2, 3], [3, 2, 1])).toBe(true);
	});

	it('should return false if arrays have different elements', () => {
		expect(arraysHaveSameElements([1, 2, 3], [1, 2, 4])).toBe(false);
	});

	it('should return true if arrays have duplicate elements and all arrays have the same number of duplicates', () => {
		expect(arraysHaveSameElements([1, 2, 2, 3], [3, 2, 2, 1])).toBe(true);
	});

	it('should return true if arrays have different types of elements but all arrays have the same elements', () => {
		const object = { property: 3 };
		const array1 = [ 1, '2', object, object ];
		const array2 = [ object, 1, object, '2' ];
		expect(arraysHaveSameElements(array1, array2)).toBe(true);
	});

	it('should return false if arrays have different types of elements representing similar values', () => {
		const array1 = [ 1, '2', {property: 3} ];
		const array2 = [ 3, '2', {property: 1} ];
		expect(arraysHaveSameElements(array1, array2)).toBe(false);
	});
});

describe('getRandomElement()', () => {
	it('should return a random element from a non-empty array', () => {
		const array = [1, 2, 3, 4, 5];
		const randomElement = getRandomElement(array);
		expect(array.includes(randomElement)).toBe(true);
	});

	it('should throw an error when the array is empty', () => {
		expect(() => getRandomElement([])).toThrow('Array must have at least one element.');
	});

	it('should not modify the original array', () => {
		const array = [1, 2, 3, 4, 5];
		getRandomElement(array);
		expect(array).toEqual([1, 2, 3, 4, 5]);
	});
});

describe('getCharacterDifferences()', () => {
	it('should return empty arrays for identical strings', () => {
		const originalString = 'hello';
		const modifiedString = 'hello';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: []
		});
	});

	it('should return extra characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'helloo';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: ['o']
		});
	});

	it('should return missing characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'hell';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['o'],
			extraCharacters: []
		});
	});

	it('should return both extra and missing characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'hxlloo';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['e'],
			extraCharacters: ['o', 'x']
		});
	});

	it('should return empty arrays for empty strings', () => {
		const originalString = '';
		const modifiedString = '';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: []
		});
	});

	it('should return extra character for single character strings', () => {
		const originalString = 'a';
		const modifiedString = 'b';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['a'],
			extraCharacters: ['b']
		});
	});

	it('should return correct differences for strings of different lengths', () => {
		const originalString = 'hello';
		const modifiedString = 'hello world';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: [' ', 'd', 'l', 'o', 'r', 'w']
		});
	});

	it('should return correct differences for strings containing repeated characters', () => {
		const originalString = 'hello';
		const modifiedString = 'hellooo';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({ missingCharacters: [], extraCharacters: ['o', 'o'] });
	});

	it('should return correct differences for strings containing special characters', () => {
		const originalString = 'hello!';
		const modifiedString = 'hello@';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['!'],
			extraCharacters: ['@']
		});
	});

	it('should return correct differences for strings containing numbers', () => {
		const originalString = 'hello123';
		const modifiedString = 'hello456';
		const result = getCharacterDifferences(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['1', '2', '3'],
			extraCharacters: ['4', '5', '6']
		});
	});
});

describe('getRandomWeightedElement()', () => {
  it('should return a random element from the object', () => {
    const elementToWeight = { a: 1, b: 2, c: 3 };
    const result = getRandomWeightedElement(elementToWeight);
    expect(Object.keys(elementToWeight)).toContain(result);
  });

  it('should throw an error when any of the weights is not a positive number', () => {
    const elementToWeight = { a: -1, b: 2, c: 3 };
    expect(() => getRandomWeightedElement(elementToWeight)).toThrow('getRandomWeightedElement: Invalid weight: -1');
  });

  it('should throw an error when the total weight is not greater than 0', () => {
    const elementToWeight = { a: 0, b: 0, c: 0 };
    expect(() => getRandomWeightedElement(elementToWeight)).toThrow('getRandomWeightedElement: total weight must be > 0');
  });

  it('should return a random element from the object with multiple elements', () => {
    const elementToWeight = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const result = getRandomWeightedElement(elementToWeight);
    expect(Object.keys(elementToWeight)).toContain(result);
  });

  it('should return a random element from the object with a single element', () => {
    const elementToWeight = { a: 1 };
    const result = getRandomWeightedElement(elementToWeight);
    expect(result).toBe('a');
  });
});

describe('mapToObject()', () => {
	const players = [
		{
			id: 1,
			name: 'John Doe',
			age: 30,
		},
		{
			id: 2,
			name: 'Jane Doe',
			age: 25
		},
		{
			id: 3,
			name: 'Bob Smith',
			age: 30
		}
	]

	it('merges an array of objects with unique keys into a single object', () => {
		makeSure(
			mapToObject(players, player => ({ [player.id]: player }))
		)
		.is({
			1: {id: 1, name: 'John Doe', age: 30},
			2: {id: 2, name: 'Jane Doe', age: 25},
			3: {id: 3, name: 'Bob Smith', age: 30}
		})
	})

	it('returns an empty object when given an empty array', () => {
		const idObjects: {id: number}[]	= [];
		makeSure(
			mapToObject(idObjects, object => ({ [object.id]: object }))
		)
		.is({})
	})

	// Array with objects having overlapping keys: last one wins
	it('throws error when multiple objects have the same key', () => {
		makeSure(() =>
			mapToObject(players, player => ({ [player.age]: player }))
		)
		.throws(InvalidArgumentError);
	})

	it('returns the same object when the array contains a single object', () => {
		makeSure(
			mapToObject([{ id: 1, name: 'John Doe', age: 30 }], player => player)
		)
		.is({
			id: 1,
			name: 'John Doe',
			age: 30
		})
	})

	it('merges nested objects as values, but does not deep merge them', () => {
		makeSure(
			mapToObject(
				[
					{
						id: 1,
						name: 'John Doe',
						car: {
							name: 'Ford',
							year: 2019
						}
					},
					{
						id: 2,
						name: 'Jane Doe',
						car: {
							name: 'Toyota',
							year: 2020
						}
					}
				],
				player => ({ [player.id]: player })
			)
		)
		.is({
			1: {
				id: 1,
				name: 'John Doe',
				car: {
					name: 'Ford',
					year: 2019
				}
			},
			2: {
				id: 2,
				name: 'Jane Doe',
				car: {
					name: 'Toyota',
					year: 2020
				}
			}
		})
	})

	it('handles objects with dynamic keys generated from array items', () => {
		const numbers = [1, 2, 3, 4, 5];
		makeSure(
			mapToObject(numbers, number => ({ [`key${number}`]: number }))
		)
		.is({
			key1: 1,
			key2: 2,
			key3: 3,
			key4: 4,
			key5: 5
		})
	})
});

describe('sortAscendingByProperty()', () => {
	it('should sort an array of objects by a given string property in ascending order', () => {
		const objects = [
			{ id: 1, name: 'John Doe' },
			{ id: 2, name: 'Jane Doe' },
			{ id: 3, name: 'Bob Smith' },
		];
		const sortedObjects = sortByAscendingProperty(objects, 'name');
		makeSure(sortedObjects).is([
			{ id: 3, name: 'Bob Smith' },
			{ id: 2, name: 'Jane Doe' },
			{ id: 1, name: 'John Doe' },
		]);
	});

	it('should sort an array of objects by a given number property in ascending order', () => {
		const objects = [
			{ id: 1, age: 30 },
			{ id: 2, age: 25 },
			{ id: 3, age: 35 },
		];
		const sortedObjects = sortByAscendingProperty(objects, 'age');
		makeSure(sortedObjects).is([
			{ id: 2, age: 25 },
			{ id: 1, age: 30 },
			{ id: 3, age: 35 },
		]);
	});

	it('should sort an array of objects by a given date property in ascending order', () => {
		const objects = [
			{ id: 1, date: new Date('2022-01-01') },
			{ id: 2, date: new Date('2022-02-01') },
			{ id: 3, date: new Date('2022-03-01') },
		];
		const sortedObjects = sortByAscendingProperty(objects, 'date');
		makeSure(sortedObjects).is([
			{ id: 1, date: new Date('2022-01-01') },
			{ id: 2, date: new Date('2022-02-01') },
			{ id: 3, date: new Date('2022-03-01') },
		]);
	});
});

describe('addToArrayMap()', () => {
	it('should create a new array and add an item to it if the key does not exist in the Map', () => {
		const map = new Map<string, string[]>();
		addToArrayMap(map, 'key', 'item');
		expect(map.get('key')).toEqual(['item']);
	});

	it('should add an item to an array associated with a key in a Map', () => {
		const map = new Map<string, string[]>([['key', ['item1']]]);
		addToArrayMap(map, 'key', 'item2');
		expect(map.get('key')).toEqual(['item1', 'item2']);
	});
});