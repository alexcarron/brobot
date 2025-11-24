import { makeSure } from "./jest/jest-utils";
import { boolean, InvalidTypeError, number, object, string, zeroOrOne } from "./runtime-types-utils";

describe('runtime-types-utils.test.ts', () => {
	describe('number', () => {
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

		describe('asRawType()', () => {
			it('transforms to and from domain object', () => {
				const dbPerkType = object.asRawType('Perk', {
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
				const dbPerkType = object.asRawType('Perk', {
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
				const dbPerkType = object.asRawType('Perk', {
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
				const dbType = object.asRawType('User', {
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
})