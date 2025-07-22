const { setNestedProperty, appendToNestedProperty, getShuffledArray, arraysHaveSameElements, getRandomElement, getCharacterDifferencesInStrings, getRandomWeightedElement } = require("./data-structure-utils");

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
		const propertyPath = [];
		const value = 'value';
		expect(() => setNestedProperty(object, propertyPath, value)).toThrow();
	});

	it('throws an error when setting a property with a null or undefined object', () => {
		const object = null;
		const propertyPath = ['property1'];
		const value = 'value';
		expect(() => setNestedProperty(object, propertyPath, value)).toThrow();
	});

	it('throws an error when setting a property with a non-array property path', () => {
		const object = {};
		const propertyPath = 'property1';
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

	it('throws an error if the object is not an object', () => {
		const object = 'not an object';
		const propertyPath = ['property1'];
		const value = 'value';
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrow('Object must be an object.');
	});

	it('throws an error if the property path is not an array', () => {
		const object = {};
		const propertyPath = 'not an array';
		const value = 'value';
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrow('Property path must be an array.');
	});

	it('throws an error if the property path is empty', () => {
		const object = {};
		const propertyPath = [];
		const value = 'value';
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrow('Property path must have at least one property.');
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


	it('should throw an error when given a non-array input', () => {
		expect(() => getShuffledArray('not an array')).toThrow();
	});

	it('should return an empty array when given an empty array input', () => {
		const originalArray = [];
		const shuffledArray = getShuffledArray(originalArray);
		expect(shuffledArray).toEqual([]);
	});
});

describe('arraysHaveSameElements()', () => {
	it('should throw an error if less than two arrays are passed', () => {
		expect(() => arraysHaveSameElements([1, 2, 3])).toThrow('At least two arrays must be passed.');
	});

	it('should throw an error if not all arguments are arrays', () => {
		expect(() => arraysHaveSameElements([1, 2, 3], 'hello')).toThrow('All arguments must be arrays.');
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

	it('should throw an error when the input is not an array', () => {
		expect(() => getRandomElement('hello')).toThrow('Given value must be an array. Received: string');
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

describe('getCharacterDifferencesInStrings()', () => {
	it('should return empty arrays for identical strings', () => {
		const originalString = 'hello';
		const modifiedString = 'hello';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: []
		});
	});

	it('should return extra characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'helloo';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: ['o']
		});
	});

	it('should return missing characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'hell';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['o'],
			extraCharacters: []
		});
	});

	it('should return both extra and missing characters in modified string', () => {
		const originalString = 'hello';
		const modifiedString = 'hxlloo';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['e'],
			extraCharacters: ['o', 'x']
		});
	});

	it('should return empty arrays for empty strings', () => {
		const originalString = '';
		const modifiedString = '';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: []
		});
	});

	it('should return extra character for single character strings', () => {
		const originalString = 'a';
		const modifiedString = 'b';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['a'],
			extraCharacters: ['b']
		});
	});

	it('should return correct differences for strings of different lengths', () => {
		const originalString = 'hello';
		const modifiedString = 'hello world';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: [],
			extraCharacters: [' ', 'd', 'l', 'o', 'r', 'w']
		});
	});

	it('should return correct differences for strings containing repeated characters', () => {
		const originalString = 'hello';
		const modifiedString = 'hellooo';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({ missingCharacters: [], extraCharacters: ['o', 'o'] });
	});

	it('should return correct differences for strings containing special characters', () => {
		const originalString = 'hello!';
		const modifiedString = 'hello@';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['!'],
			extraCharacters: ['@']
		});
	});

	it('should return correct differences for strings containing numbers', () => {
		const originalString = 'hello123';
		const modifiedString = 'hello456';
		const result = getCharacterDifferencesInStrings(originalString, modifiedString);
		expect(result).toEqual({
			missingCharacters: ['1', '2', '3'],
			extraCharacters: ['4', '5', '6']
		});
	});

	it('should throw an error for null input', () => {
		expect(() => getCharacterDifferencesInStrings(null, 'hello')).toThrow(TypeError);
	});

	it('should throw an error for undefined input', () => {
		expect(() => getCharacterDifferencesInStrings(undefined, 'hello')).toThrow(TypeError);
	});

	it('should throw an error for non-string input', () => {
		expect(() => getCharacterDifferencesInStrings(123, 'hello')).toThrow(TypeError);
	});
});

describe('getRandomWeightedElement()', () => {
  it('should return a random element from the object', () => {
    const elementToWeight = { a: 1, b: 2, c: 3 };
    const result = getRandomWeightedElement(elementToWeight);
    expect(Object.keys(elementToWeight)).toContain(result);
  });

  it('should throw an error when the input is not an object', () => {
    expect(() => getRandomWeightedElement('hello')).toThrow('getRandomWeightedElement: elementToWeight must be an object.');
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