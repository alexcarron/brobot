const { setNestedProperty, appendToNestedProperty } = require("./data-structure-utils");

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