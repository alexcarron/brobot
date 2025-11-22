import { makeSure } from "./jest/jest-utils";
import { boolean, InvalidTypeError, number, object, string } from "./runtime-types-utils";

describe('runtime-types-utils.test.ts', () => {
	describe('number', () => {
		it('asType() returns as a type', () => {
			const integerType = number.asType();

			const value: unknown = 10;
			const integer = integerType.from(value);

			makeSure(integer).is(10);
		});

		it('from() throws if not a number', () => {
			const integerType = number.asType();

			const value: unknown = '10';
			makeSure(() =>
				integerType.from(value)
			).throws(InvalidTypeError);
		});

		it('fromAll() throws if not a number', () => {
			const integerType = number.asType();

			const values: unknown[] = [10, '20'];
			makeSure(() =>
				integerType.fromAll(values)
			).throws(InvalidTypeError);
		});
	});

	describe('string', () => {
		it('asType() returns as a type', () => {
			const stringType = string.asType();

			const value: unknown = '10';
			const stringValue = stringType.from(value);

			makeSure(stringValue).is('10');
		});

		it('from() throws if not a string', () => {
			const stringType = string.asType();

			const value: unknown = 10;
			makeSure(() =>
				stringType.from(value)
			).throws(InvalidTypeError);
		});

		it('fromAll() throws if not a string', () => {
			const stringType = string.asType();

			const values: unknown[] = [10, 20];
			makeSure(() =>
				stringType.fromAll(values)
			).throws(InvalidTypeError);
		});
	});

	describe('boolean', () => {
		it('asType() returns as a type', () => {
			const booleanType = boolean.asType();

			const value: unknown = true;
			const booleanValue = booleanType.from(value);

			makeSure(booleanValue).is(true);
		});

		it('from() throws if not a boolean', () => {
			const booleanType = boolean.asType();

			const value: unknown = 'true';
			makeSure(() =>
				booleanType.from(value)
			).throws(InvalidTypeError);
		});
	});

	describe('object', () => {
		describe('asType()', () => {
			it('returns as a type with number properties', () => {
				const ageInfo = object.asType({
					age: number.asType(),
				});

				const value: unknown = { age: 10 };
				const { age } = ageInfo.from(value);

				makeSure(age).is(10);
			});

			it('returns as a type with boolean properties', () => {
				const isActiveInfo = object.asType({
					isActive: boolean.asType(),
				});

				const value: unknown = { isActive: true };
				const { isActive } = isActiveInfo.from(value);

				makeSure(isActive).is(true);
			});

			it('returns as a type with null properties', () => {
				const nullInfo = object.asType({
					nullProperty: null
				});

				const value: unknown = { nullProperty: null };
				const { nullProperty } = nullInfo.from(value);

				makeSure(nullProperty).is(null);
			});

			it('returns as a type with undefined properties', () => {
				const undefinedInfo = object.asType({
					undefinedProperty: undefined
				});

				const value: unknown = { undefinedProperty: undefined };
				const { undefinedProperty } = undefinedInfo.from(value);

				makeSure(undefinedProperty).is(undefined);
			});

			it('returns as a type with all properties', () => {
				const allInfo = object.asType({
					age: number.asType(),
					name: string.asType(),
					isActive: boolean.asType(),
					nullProperty: null,
					undefinedProperty: undefined
				});

				const value: unknown = { age: 10, name: 'John', isActive: true, nullProperty: null, undefinedProperty: undefined };
				const { age, name, isActive, nullProperty, undefinedProperty } = allInfo.from(value);

				makeSure(age).is(10);
				makeSure(name).is('John');
				makeSure(isActive).is(true);
				makeSure(nullProperty).is(null);
				makeSure(undefinedProperty).is(undefined);
			});
		});

		describe('from()', () => {
			it('returns the object', () => {
				const value: unknown = { age: 10, name: 'John', isActive: true, nullProperty: null, undefinedProperty: undefined };
				const result = object.from(value);
				makeSure(result).is(value);
			});

			it('throws if not an object', () => {
				const value: unknown = 10;
				makeSure(() =>
					object.from(value)
				).throws(InvalidTypeError);
			});

			it('throws if not an object with all properties', () => {
				const allInfo = object.asType({
					age: number.asType(),
					name: string.asType(),
					isActive: boolean.asType(),
					nullProperty: null,
					undefinedProperty: undefined
				});

				makeSure(() =>
					allInfo.from({
						age: '10',
						name: 'John',
						isActive: true,
						nullProperty: null,
						undefinedProperty: undefined
					})
				).throws(InvalidTypeError);

				makeSure(() =>
					allInfo.from({
						age: 10,
						name: 10,
						isActive: true,
						nullProperty: null,
						undefinedProperty: undefined
					})
				).throws(InvalidTypeError);

				makeSure(() =>
					allInfo.from({
						age: 10,
						name: 'John',
						isActive: null,
						nullProperty: null,
						undefinedProperty: undefined
					})
				).throws(InvalidTypeError);

				makeSure(() =>
					allInfo.from({
						age: 10,
						name: 'John',
						isActive: true,
						nullProperty: undefined,
						undefinedProperty: undefined
					})
				).throws(InvalidTypeError);

				makeSure(() =>
					allInfo.from({
						age: 10,
						name: 'John',
						isActive: true,
						nullProperty: null,
						undefinedProperty: null
					})
				).throws(InvalidTypeError);
			});
		});
	});
})