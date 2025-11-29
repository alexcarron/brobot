import { makeSure } from "./jest/jest-utils";
import { boolean, date, InvalidTypeError, number, object, string, strings, zeroOrOne } from './runtime-types-utils';

describe('runtime-types-utils.test.ts', () => {
	describe('number', () => {
		it('orNull returns a runtime type of number or null', () => {
			const nullValue: unknown = null;
			const numberValue: unknown = 10;
			makeSure(number.orNull.isType(nullValue)).is(true);
			makeSure(number.orNull.isType(numberValue)).is(true);
			makeSure(number.orNull.from(nullValue)).is(null);
			makeSure(number.orNull.from(numberValue)).is(10);
			makeSure(number.orNull.fromAll([numberValue, nullValue])).is([10, null]);
		});

		it('asType() returns as a type', () => {
			const value: unknown = 10;
			const integer = number.from(value);

			makeSure(integer).is(10);
		});

		it('from() throws if not a number', () => {
			const value: unknown = '10';
			makeSure(() =>
				number.from(value)
			).throws(InvalidTypeError);
		});

		it('fromAll() throws if not a number', () => {
			const values: unknown[] = [10, '20'];
			makeSure(() =>
				number.fromAll(values)
			).throws(InvalidTypeError);
		});

		it('fromAll() accepts only numbers', () => {
			const numbers: unknown[] = [1, 2, 3];
			const result = number.fromAll(numbers);
			makeSure(result).is([1, 2, 3]);
		});

		it('fromAll() throws if any value is invalid', () => {
			const values: unknown[] = [1, '2', 3];
			makeSure(() => number.fromAll(values)).throws(InvalidTypeError);
		});
	});

	describe('string', () => {
		it('asType() returns as a type', () => {
			const value: unknown = '10';
			const stringValue = string.from(value);

			makeSure(stringValue).is('10');
		});

		it('from() throws if not a string', () => {
			const value: unknown = 10;
			makeSure(() =>
				string.from(value)
			).throws(InvalidTypeError);
		});

		it('fromAll() throws if not a string', () => {
			const values: unknown[] = [10, 20];
			makeSure(() =>
				string.fromAll(values)
			).throws(InvalidTypeError);
		});

		it('fromAll() accepts only strings', () => {
			const strings: unknown[] = ['a', 'b', 'c'];
			const result = string.fromAll(strings);
			makeSure(result).is(['a', 'b', 'c']);
		});

		it('fromAll() throws if any value is invalid', () => {
			const values: unknown[] = ['a', 2, 'c'];
			makeSure(() => string.fromAll(values)).throws(InvalidTypeError);
		});

		it('to() and from() provides a transformable type', () => {
			const rawUserID = string
				.to(stringID => Number(stringID))
				.from(numberID => numberID.toString());

			makeSure(rawUserID.fromDomain(10)).is('10');
			makeSure(rawUserID.fromDomains([10, 20])).is(['10', '20']);

			const unknownString: unknown = '10';
			makeSure(rawUserID.toDomain(unknownString)).is(10);
			makeSure(rawUserID.toDomain('10')).is(10);
			makeSure(rawUserID.toDomains([unknownString, unknownString])).is([10, 10]);
			makeSure(rawUserID.toDomains(['10', '20'])).is([10, 20]);
		});

		it('toDomain() and toDomains() throw if value isn\'t a string', () => {
			const rawUserID = string
				.to(stringID => Number(stringID))
				.from(numberID => numberID.toString());

			makeSure(() => rawUserID.toDomain(10)).throws(InvalidTypeError);
			makeSure(() => rawUserID.toDomains(['10', 20])).throws(InvalidTypeError);
		});
	});

	describe('strings', () => {
		const Colors = strings('red', 'green', 'blue');

		describe('isType()', () => {
			it('returns true if value is a string in the list of strings', () => {
				const value: unknown = 'red';
				makeSure(Colors.isType(value)).is(true);
			});

			it('returns false if value is not a string in the list of strings', () => {
				const value: unknown = 'cheese';
				makeSure(Colors.isType(value)).is(false);
			});
		});

		describe('from()', () => {
			it('does not throw and returns value if it is in the list of strings', () => {
				const value: unknown = 'red';
				const result = Colors.from(value);
				makeSure(result).is('red');
			});

			it('throws if not a in the list of strings', () => {
				const value: unknown = 'cheese';
				makeSure(() =>
					Colors.from(value)
				).throws(InvalidTypeError);
			});
		});

		describe('fromAll()', () => {
			it('does not throw and returns values if they are in the list of strings', () => {
				const values: unknown[] = ['red', 'green', 'blue'];
				const result = Colors.fromAll(values);
				makeSure(result).is(['red', 'green', 'blue']);
			});

			it('throws if any value is not in the list of strings', () => {
				const values: unknown[] = ['red', 'cheese', 'blue'];
				makeSure(() =>
					Colors.fromAll(values)
				).throws(InvalidTypeError);
			})
		});

		describe('asTransformableType()', () => {
			it('allows you to transfer a union of strings into a different type', () => {
				const ColorNames = Colors.asTransformableType(
					'RGBValue',
					(color) => {
						switch (color) {
							case 'red':
								return [255, 0, 0];
							case 'green':
								return [0, 255, 0];
							case 'blue':
								return [0, 0, 255];
						}
					},
					(rgbValues) => {
						if (rgbValues[0] === 255 && rgbValues[1] === 0 && rgbValues[2] === 0) {
							return 'red';
						}
						else if (rgbValues[0] === 0 && rgbValues[1] === 255 && rgbValues[2] === 0) {
							return 'green';
						}
						else {
							return 'blue';
						}
					}
				);

				makeSure(ColorNames.toRGBValue('red')).is([255, 0, 0]);
				makeSure(ColorNames.fromRGBValue([255, 0, 0])).is('red');
				makeSure(ColorNames.toRGBValues(['red', 'green', 'blue'])).is([[255, 0, 0], [0, 255, 0], [0, 0, 255]]);
				makeSure(ColorNames.fromRGBValues([[255, 0, 0], [0, 255, 0], [0, 0, 255]])).is(['red', 'green', 'blue']);
			});
		});

		describe('to() and from()', () => {
			it('to() and from() provides accureate toDomain, toDomains, fromDomain, and fromDomains types', () => {
				const ColorNames = Colors
					.to(color => color.toUpperCase())
					.from(COLOR => COLOR.toLowerCase() as any);

				makeSure(ColorNames.toDomain('red')).is('RED');
				makeSure(ColorNames.fromDomain('RED')).is('red');
				makeSure(ColorNames.toDomains(['red', 'green', 'blue'])).is(['RED', 'GREEN', 'BLUE']);
				makeSure(ColorNames.fromDomains(['red', 'green', 'blue'])).is(['red', 'green', 'blue']);
			});
		});
	});

	describe('boolean', () => {
		it('asType() returns as a type', () => {
			const value: unknown = true;
			const booleanValue = boolean.from(value);

			makeSure(booleanValue).is(true);
		});

		it('from() throws if not a boolean', () => {
			const value: unknown = 'true';
			makeSure(() =>
				boolean.from(value)
			).throws(InvalidTypeError);
		});

		it('fromAll() accepts only booleans', () => {
			const bools: unknown[] = [true, false];
			const result = boolean.fromAll(bools);
			makeSure(result).is([true, false]);
		});

		it('fromAll() throws if any value is invalid', () => {
			const values: unknown[] = [true, 'false'];
			makeSure(() => boolean.fromAll(values)).throws(InvalidTypeError);
		});
	});

	describe('zeroOrOne', () => {
		it('from() accepts 0 or 1', () => {
			makeSure(zeroOrOne.from(0)).is(0);
			makeSure(zeroOrOne.from(1)).is(1);
		});

		it('from() throws on other numbers', () => {
			makeSure(() => zeroOrOne.from(2)).throws(InvalidTypeError);
			makeSure(() => zeroOrOne.from(-1)).throws(InvalidTypeError);
		});

		it('toDomain and fromDomain transformation', () => {
			const dbBoolean = zeroOrOne
				.to(zeroOrOne => zeroOrOne === 1)
				.from(boolean => boolean ? 1 : 0);

			const unknownNumber: unknown = 1;

			makeSure(dbBoolean.toDomain(unknownNumber)).is(true);
			makeSure(dbBoolean.toDomain(1)).is(true);
			makeSure(dbBoolean.toDomain(0)).is(false);
			makeSure(dbBoolean.toDomains([1, 0])).is([true, false]);
			makeSure(dbBoolean.toDomains([unknownNumber, unknownNumber])).is([true, true]);
			makeSure(dbBoolean.fromDomain(true)).is(1);
			makeSure(dbBoolean.fromDomain(false)).is(0);
			makeSure(dbBoolean.fromDomains([true, false])).is([1, 0]);
		});

		it('toDomain() and toDomains() throw if value isn\'t 0 or 1', () => {
			const dbBoolean = zeroOrOne
				.to(zeroOrOne => zeroOrOne === 1)
				.from(boolean => boolean ? 1 : 0);

			makeSure(() => dbBoolean.toDomain(2)).throws(InvalidTypeError);
			makeSure(() => dbBoolean.toDomains([0, 15])).throws(InvalidTypeError);
		});

		it('fromAll() accepts only 0 or 1', () => {
			const values: unknown[] = [0, 1, 1, 0];
			const result = zeroOrOne.fromAll(values);
			makeSure(result).is([0, 1, 1, 0]);
		});

		it('fromAll() throws if invalid numbers exist', () => {
			const values: unknown[] = [0, 1, 2];
			makeSure(() => zeroOrOne.fromAll(values)).throws(InvalidTypeError);
		});
	});

	describe('date', () => {
		describe('isType()', () => {
			it('returns true for valid dates', () => {
				makeSure(date.isType(new Date())).is(true);
			});

			it('returns false for invalid dates', () => {
				makeSure(date.isType(new Date('invalid'))).is(false);
			});

			it('returns false for non-dates', () => {
				makeSure(date.isType('not a date')).is(false);
			});
		});

		describe('from()', () => {
			it('returns a date', () => {
				const value: unknown = new Date();
				const dateValue = date.from(value);
				makeSure(dateValue).isAnInstanceOf(Date);
			});

			it('throws if not a date', () => {
				const value: unknown = 'not a date';
				makeSure(() => date.from(value)).throws(InvalidTypeError);
			})
		});

		describe('fromAll()', () => {
			it('returns an array of dates', () => {
				const values: unknown[] = [new Date(), new Date()];
				const dateValues = date.fromAll(values);
				makeSure(dateValues).isAnInstanceOf(Array);
				makeSure(dateValues[0]).isAnInstanceOf(Date);
				makeSure(dateValues[1]).isAnInstanceOf(Date);
			});

			it('throws if any value is not a date', () => {
				const values: unknown[] = [new Date(), 'not a date'];
				makeSure(() => date.fromAll(values)).throws(InvalidTypeError);
			})
		});
	})

	describe('object', () => {
		describe('asType()', () => {
			it('returns as a type with number properties', () => {
				const ageInfo = object.asType({
					age: number,
				});

				const value: unknown = { age: 10 };
				const { age } = ageInfo.from(value);

				makeSure(age).is(10);
			});

			it('returns as a type with boolean properties', () => {
				const isActiveInfo = object.asType({
					isActive: boolean,
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
					age: number,
					name: string,
					isActive: boolean,
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
					age: number,
					name: string,
					isActive: boolean,
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

		describe('asTransformableType()', () => {
			it('transforms to and from domain object', () => {
				const dbPerkType = object.asTransformableType('Perk', {
					id: number,
					name: string,
					wasOffered: zeroOrOne
						.to(z => z === 1)
						.from(b => b ? 1 : 0),
				});

				const rawPerk: unknown = {
					id: 1,
					name: 'Speed',
					wasOffered: 1
				};
				const perk = dbPerkType.toPerk(rawPerk);

				makeSure(perk).is({
					id: 1,
					name: 'Speed',
					wasOffered: true
				});

				const backToRaw = dbPerkType.fromPerk(perk);
				makeSure(backToRaw).is(rawPerk);
			});

			it('Works with toPerks and fromPerks', () => {
				const dbPerkType = object.asTransformableType('Perk', {
					id: number,
					name: string,
					wasOffered: zeroOrOne
						.to(z => z === 1)
						.from(b => b ? 1 : 0),
				});

				const rawPerks: unknown[] = [
					{ id: 1, name: 'Speed', wasOffered: 1 },
					{ id: 2, name: 'Strength', wasOffered: 0 }
				];
				const perks = dbPerkType.toPerks(rawPerks);

				makeSure(perks).is([
					{ id: 1, name: 'Speed', wasOffered: true },
					{ id: 2, name: 'Strength', wasOffered: false }
				]);

				const backToRaw = dbPerkType.fromPerks(perks);
				makeSure(backToRaw).is(rawPerks);
			});

			it('toPerk() and toPerks() throw if value isn\'t a db perk', () => {
				const dbPerkType = object.asTransformableType('Perk', {
					id: number,
					name: string,
					wasOffered: zeroOrOne
						.to(z => z === 1)
						.from(b => b ? 1 : 0),
				});

				makeSure(() => dbPerkType.toPerk({
					id: 1,
					name: 'Speed',
					wasOffered: true
				})).throws(InvalidTypeError);

				makeSure(() => dbPerkType.toPerks([
					{ id: 1, name: 'Speed', wasOffered: 0 },
					{ id: 2, name: 'Strength', wasOffered: false }
				])).throws(InvalidTypeError);
			});


			it('works with null and undefined properties', () => {
				const dbType = object.asTransformableType('User', {
					id: number,
					name: string,
					note: null,
					flag: undefined
				});

				const raw = { id: 1, name: 'Test', note: null, flag: undefined };
				const domain = dbType.toUser(raw);

				makeSure(domain).is(raw); // same structure

				const back = dbType.fromUser(domain);
				makeSure(back).is(raw);
			});
		});

		describe('fromAll()', () => {

			it('fromAll() accepts multiple valid objects', () => {
				const values: unknown[] = [
					{ a: 1 },
					{ a: 2 }
				];
				const type = object.asType({ a: number, });
				const result = type.fromAll(values);
				makeSure(result).is(values);
			});

			it('fromAll() throws if any object is invalid', () => {
				const values: unknown[] = [
					{ a: 1 },
					{ a: '2' }
				];
				const type = object.asType({ a: number });
				makeSure(() => type.fromAll(values)).throws(InvalidTypeError);
			});
		});
	});

	describe('orNull property (nullable variants)', () => {
		it('primitive runtime types: number.orNull works for isType, from, fromAll', () => {
			const nullValue: unknown = null;
			const numValue: unknown = 5;

			makeSure(number.orNull.isType(nullValue)).is(true);
			makeSure(number.orNull.isType(numValue)).is(true);
			makeSure(number.orNull.from(nullValue)).is(null);
			makeSure(number.orNull.from(numValue)).is(5);
			makeSure(number.orNull.fromAll([nullValue, numValue])).is([null, 5]);

			// invalid non-null still throws
			makeSure(() => number.orNull.from('x' as unknown)).throws(InvalidTypeError);
		});

		it('transformable primitive: string.to(...).from(...).orNull supports toDomain/fromDomain and arrays', () => {
			const rawUserID = string
				.to((stringID) => Number(stringID))
				.from((numberID) => numberID.toString());

			const nullable = rawUserID.orNull;

			// null handling
			makeSure(nullable.isType(null)).is(true);
			makeSure(nullable.from(null)).is(null);
			makeSure(nullable.toDomain(null)).is(null);
			makeSure(nullable.toDomains([null, '10'])).is([null, 10]);
			makeSure(nullable.fromDomains([null, 10])).is([null, '10']);

			// valid non-null still works
			makeSure(nullable.toDomain('20')).is(20);
			makeSure(nullable.fromDomain(20)).is('20');

			// invalid non-null still throws
			makeSure(() => nullable.toDomain(42)).throws(InvalidTypeError);
			makeSure(() => nullable.toDomains([null, 42])).throws(InvalidTypeError);
		});

		it('named transformable (strings.asTransformableType) .orNull provides named methods that accept null', () => {
			const ColorNames = strings('red', 'green', 'blue').asTransformableType(
				'RGB',
				(color) => {
					switch (color) {
						case 'red': return [255, 0, 0] as const;
						case 'green': return [0, 255, 0] as const;
						default: return [0, 0, 255] as const;
					}
				},
				(rgb) => {
					if (rgb[0] === 255) return 'red';
					if (rgb[1] === 255) return 'green';
					return 'blue';
				}
			);

			const NullableColor = ColorNames.orNull;

			makeSure(NullableColor.toRGB(null)).is(null);
			makeSure(NullableColor.fromRGB(null)).is(null);
			makeSure(NullableColor.toRGBs([null, 'red'])).is([null, [255, 0, 0]]);
			makeSure(NullableColor.fromRGBs([null, [0, 255, 0]])).is([null, 'green']);

			// invalid non-null still throws (e.g., passing object to toRGB)
			makeSure(() => NullableColor.toRGB(123)).throws(InvalidTypeError);
		});

		it('object.asTransformableType .orNull returns nullable named transformable methods', () => {
			const dbPerkType = object.asTransformableType('Perk', {
				id: number,
				name: string,
				wasOffered: zeroOrOne
					.to(z => z === 1)
					.from(b => b ? 1 : 0),
			});

			const rawPerk: unknown = { id: 1, name: 'Speed', wasOffered: 1 };
			const nullablePerk = dbPerkType.orNull as any;

			// null => null
			makeSure(nullablePerk.toPerk(null)).is(null);
			makeSure(nullablePerk.fromPerk(null)).is(null);

			// arrays with nulls
			const rawPerks: unknown[] = [null, rawPerk];
			const converted = nullablePerk.toPerks(rawPerks);
			makeSure(converted).is([null, { id: 1, name: 'Speed', wasOffered: true }]);
			const back = nullablePerk.fromPerks(converted);
			makeSure(back).is([null, rawPerk]);

			// invalid shapes still throw when non-null
			makeSure(() => nullablePerk.toPerk({ id: 'x', name: 'N', wasOffered: 1 })).throws(InvalidTypeError);
		});

		it('object.asTransformableType with transformable property .orNull preserves nested nullable transformable behavior', () => {
			// make wasOffered nullable transformable
			const wasOfferedTT = zeroOrOne
				.to(z => z === 1)
				.from(b => b ? 1 : 0)
				.orNull;

			const dbPerkType = object.asTransformableType('Perk', {
				id: number,
				name: string,
				wasOffered: wasOfferedTT,
			});

			const raw1: unknown = { id: 1, name: 'Speed', wasOffered: null };
			const domain1 = dbPerkType.toPerk(raw1);
			makeSure(domain1).is({ id: 1, name: 'Speed', wasOffered: null });

			const raw2: unknown = { id: 2, name: 'Strength', wasOffered: 1 };
			const domain2 = dbPerkType.toPerk(raw2);
			makeSure(domain2).is({ id: 2, name: 'Strength', wasOffered: true });

			// roundtrip
			const back1 = dbPerkType.fromPerk(domain1);
			makeSure(back1).is(raw1);
			const back2 = dbPerkType.fromPerk(domain2);
			makeSure(back2).is(raw2);

			// invalid non-null in nested still throws
			makeSure(() => dbPerkType.toPerk({ id: 3, name: 'X', wasOffered: 5 })).throws(InvalidTypeError);
		});

		it('orNull property is idempotent and safe to chain (accessing multiple times does not throw / behaves same)', () => {
			const rawUserID = string
				.to((s) => Number(s))
				.from((n) => n.toString());

			const a = rawUserID.orNull;
			const b = (a as any).orNull; // second access
			const c = (b as any).orNull; // third access

			makeSure(a.isType(null)).is(true);
			makeSure(b.isType(null)).is(true);
			makeSure(c.isType(null)).is(true);

			makeSure(a.from(null)).is(null);
			makeSure(b.from(null)).is(null);
			makeSure(c.from(null)).is(null);
		});

		it('nullable transformable toDomain/fromDomain throws for invalid non-null inputs but accepts null', () => {
			const dbBoolean = zeroOrOne
				.to(z => z === 1)
				.from(b => b ? 1 : 0);

			const nullableDbBoolean = dbBoolean.orNull;

			// valid
			makeSure(nullableDbBoolean.toDomain(1)).is(true);
			makeSure(nullableDbBoolean.toDomain(null)).is(null);

			// invalid non-null should throw
			makeSure(() => nullableDbBoolean.toDomain('x' as unknown)).throws(InvalidTypeError);
			makeSure(() => nullableDbBoolean.toDomains([null, 'x' as unknown])).throws(InvalidTypeError);
		});

		it('compound arrays mapping/roundtrip with mixed nulls and values', () => {
			const rawUserID = string
				.to((s) => Number(s))
				.from((n) => n.toString());

			const nullable = rawUserID.orNull;

			const inputs: unknown[] = ['1', null, '2'];
			const domains = nullable.toDomains(inputs);
			makeSure(domains).is([1, null, 2]);

			const back = nullable.fromDomains(domains);
			makeSure(back).is(['1', null, '2']);
		});
	});

	describe('.default()', () => {
		it('.from() returns the default value when undefined is given for a primitive runtime type', () => {
			const ageType = number.default(18);
			makeSure(ageType.from(undefined)).is(18);

			const nameType = string.default('John Doe');
			makeSure(nameType.from(undefined)).is('John Doe');

			const configToggleType = boolean.default(false);
			makeSure(configToggleType.from(undefined)).is(false);
		});

		it('.fromAll() returns the default value when undefined is given in the array for a primitive runtime type', () => {
			const ageType = number.default(18);
			makeSure(
				ageType.fromAll([undefined, 10, undefined])
			).is([18, 10, 18]);

			const nameType = string.default('John Doe');
			makeSure(
				nameType.fromAll([undefined, 'Jane Doe', undefined])
			).is(['John Doe', 'Jane Doe', 'John Doe']);

			const configToggleType = boolean.default(false);
			makeSure(
				configToggleType.fromAll([undefined, true, undefined])
			).is([false, true, false]);
		});

		it('.isType() does not incorrect treat undefined as the correct type for a primitive runtime type', () => {
			const ageType = number.default(18);
			makeSure(ageType.isType(undefined)).is(false);

			const nameType = string.default('John Doe');
			makeSure(nameType.isType(undefined)).is(false);

			const configToggleType = boolean.default(false);
			makeSure(configToggleType.isType(undefined)).is(false);
		});

		it('from() returns the default value when undefined is given for properties on an object runtime type', () => {
			const infoType = object.asType({
				age: number.default(18),
				name: string.default('John Doe'),
				configToggle: boolean.default(false)
			});

			makeSure(infoType.from(undefined)).is({
				age: 18,
				name: 'John Doe',
				configToggle: false
			});

			makeSure(infoType.from({})).is({
				age: 18,
				name: 'John Doe',
				configToggle: false
			});
		});

		it('from() returns default values for some properties of an object type', () => {
			const infoType = object.asType({
				age: number,
				name: string.default('John Doe'),
				configToggle: boolean.default(false)
			});

			makeSure(infoType.from({
				age: 12
			})).is({
				age: 12,
				name: 'John Doe',
				configToggle: false
			});

			makeSure(() => infoType.from({})).throws(InvalidTypeError);
			makeSure(() => infoType.from(undefined)).throws(InvalidTypeError);
		});

		it('fromAll() converts given values using logic from all previous test scenarios', () => {
			const infoType = object.asType({
				age: number,
				name: string.default('John Doe'),
				configToggle: boolean.default(false)
			});

			makeSure(infoType.fromAll([
				{
					age: 12,
					configToggle: true
				},
				{ age: 8 }
			])).is([
				{
					age: 12,
					name: 'John Doe',
					configToggle: true
				},
				{
					age: 8,
					name: 'John Doe',
					configToggle: false
				}
			]);
		});

		it('toDomain() and fromDomain() converts undefined values to default values and then to domain value if default is before the conversion', () => {
			const dbPerkType = object.asTransformableType('Perk', {
				id: number,
				name: string,
				description: string,
				wasOffered: zeroOrOne.default(0)
					.to(zeroOrOne => zeroOrOne === 1)
					.from(boolean => boolean ? 1 : 0),
				isBeingOffered: zeroOrOne.default(0)
					.to(zeroOrOne => zeroOrOne === 1)
					.from(boolean => boolean ? 1 : 0),
			});

			makeSure(dbPerkType.toPerk({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: 1,
			})).is({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: true,
				isBeingOffered: false
			});

			makeSure(dbPerkType.fromPerk({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: true,
			})).is({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: 1,
				isBeingOffered: 0
			});
		});

		it('toDomain() and fromDomain() converts undefined values to default value not converting them  to the domain value if the default method is after the conversion', () => {
			const dbPerkType = object.asTransformableType('Perk', {
				id: number,
				name: string,
				description: string,
				wasOffered: zeroOrOne
					.to(zeroOrOne => zeroOrOne === 1)
					.from(boolean => boolean ? 1 : 0)
					.default(false),
				isBeingOffered: zeroOrOne
					.to(zeroOrOne => zeroOrOne === 1)
					.from(boolean => boolean ? 1 : 0)
					.default(false),
			});

			makeSure(dbPerkType.toPerk({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: 1,
			})).is({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: true,
				isBeingOffered: false
			});

			makeSure(dbPerkType.fromPerk({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: true,
			})).is({
				id: 10,
				name: 'Name Here',
				description: 'Description',
				wasOffered: 1,
				isBeingOffered: 0
			});
		});
	});
});