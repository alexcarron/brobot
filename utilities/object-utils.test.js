const { setNestedProperty } = require("./object-utils");

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