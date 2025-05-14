const { setNestedProperty, appendToNestedProperty, getShuffledArray, arraysHaveSameElements, getRandomElement } = require("./data-structure-utils");

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
		expect(() => setNestedProperty(object, propertyPath, value)).toThrowError();
	});

	it('throws an error when setting a property with a null or undefined object', () => {
		const object = null;
		const propertyPath = ['property1'];
		const value = 'value';
		expect(() => setNestedProperty(object, propertyPath, value)).toThrowError();
	});

	it('throws an error when setting a property with a non-array property path', () => {
		const object = {};
		const propertyPath = 'property1';
		const value = 'value';
		expect(() => setNestedProperty(object, propertyPath, value)).toThrowError();
	});
});

describe('appendToNestedProperty', () => {
	it('appends a value to an existing property with existing ele	', () => {
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
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrowError('Object must be an object.');
	});

	it('throws an error if the property path is not an array', () => {
		const object = {};
		const propertyPath = 'not an array';
		const value = 'value';
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrowError('Property path must be an array.');
	});

	it('throws an error if the property path is empty', () => {
		const object = {};
		const propertyPath = [];
		const value = 'value';
		expect(() => appendToNestedProperty(object, propertyPath, value)).toThrowError('Property path must have at least one property.');
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
		expect(() => getShuffledArray('not an array')).toThrowError();
	});

	it('should return an empty array when given an empty array input', () => {
		const originalArray = [];
		const shuffledArray = getShuffledArray(originalArray);
		expect(shuffledArray).toEqual([]);
	});
});

describe('arraysHaveSameElements()', () => {
	it('should throw an error if less than two arrays are passed', () => {
		expect(() => arraysHaveSameElements([1, 2, 3])).toThrowError('At least two arrays must be passed.');
	});

	it('should throw an error if not all arguments are arrays', () => {
		expect(() => arraysHaveSameElements([1, 2, 3], 'hello')).toThrowError('All arguments must be arrays.');
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
		expect(() => getRandomElement('hello')).toThrowError('Given value must be an array. Received: string');
	});

	it('should throw an error when the array is empty', () => {
		expect(() => getRandomElement([])).toThrowError('Array must have at least one element.');
	});

	it('should not modify the original array', () => {
		const array = [1, 2, 3, 4, 5];
		getRandomElement(array);
		expect(array).toEqual([1, 2, 3, 4, 5]);
	});
});