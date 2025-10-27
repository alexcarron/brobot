import { UpperSnakeCase, toUpperSnakeCase } from './string-casing-utilts';
import { Expand } from './types/generic-types';

export function toEnumFromStrings<
	EnumValues extends string
>(enumValues: EnumValues[]): {
	[EnumValue in EnumValues as UpperSnakeCase<EnumValue>]: EnumValue
}

export function toEnumFromStrings<
	EnumValues extends string
>(...enumValues: EnumValues[]): {
	[EnumValue in EnumValues as UpperSnakeCase<EnumValue>]: EnumValue
}

/**
 * Converts an array of strings into an enum object.
 * The strings are converted to upper snake case and used as the keys of the enum object.
 * The values of the enum object are the original strings.
 * @example
 * toEnumFromStrings('hello', 'world') // { HELLO: 'hello', WORLD: 'world' }
 * @param enumValues - An array of strings to convert into an enum object, or an array of arrays of strings to convert into an enum object.
 * @returns An enum object with the strings as keys and the original strings as values.
 */
export function toEnumFromStrings<
	EnumValues extends string
>(...enumValues: EnumValues[] | [EnumValues]): {
	[EnumValue in EnumValues as UpperSnakeCase<EnumValue>]: EnumValue
} {
	if (Array.isArray(enumValues[0])) enumValues = enumValues[0];

	return Object.freeze(
		enumValues.reduce(
			(enumObject, enumValue) => {
				const key = toUpperSnakeCase(enumValue);

				return {
					...enumObject,
					[key]: enumValue
				}
			},
			{} as any
		)
	);
}

export type EnumObject = Record<string, string>;

/**
 * The keys of an enum
 * @example
 * const Fruits = {APPLE: 'apple', BANANA: 'banana'};
 * type FruitsKeys = KeysOf<typeof Fruits>; // 'APPLE' | 'BANANA'
 */
export type KeysOfEnum<
	Enum extends Record<string, string>
> =
	keyof Enum


/**
 * The values of an enum
 * @example
 * const Fruits = {APPLE: 'apple', BANANA: 'banana'};
 * type FruitsValues = ValuesOf<typeof Fruits>; // 'apple' | 'banana'
 */
export type ValuesOf<
	Enum extends EnumObject
> = Enum[KeysOfEnum<Enum>]

/**
 * Checks if a value is part of an enum
 * @param enumObject - The enum to check against
 * @param value - The value to check
 * @returns Whether the value is part of the enum
 */
export function isInEnum<
	Enum extends EnumObject
>(enumObject: Enum, value: string): value is ValuesOf<Enum> {
	return Object.values(enumObject).includes(value);
}

/**
 * Checks if a given key is part of an enum
 * @param enumObject - The enum to check against
 * @param key - The key to check
 * @returns Whether the key is part of the enum
 * @example
 * const Fruits = {APPLE: 'apple', BANANA: 'banana'};
 * type FruitsKeys = KeysOf<typeof Fruits>; // 'APPLE' | 'BANANA'
 * isKeyInEnum(Fruits, 'APPLE'); // true
 * isKeyInEnum(Fruits, 'ORANGE'); // false
 */
export function isKeyInEnum<
	Enum extends EnumObject,
>(
	enumObject: Enum,
	key: string | number | symbol
): key is KeysOfEnum<Enum> {
	return Object.keys(enumObject).includes(key as any);
}

/**
 * Converts an array of objects into an enum object with the specified property the objects have used as the keys of the enum object.
 * The specified property values are converted to upper snake case and used as the keys of the enum object.
 * The values of the enum object are the original objects.
 * @example
 * const fruits = [{name: 'apple'}, {name: 'banana'}] as const;
 * const FruitsEnum: EnumifyObjects<typeof fruits, 'name'> = {
 * 	APPLE: {name: 'apple'},
 * 	BANANA: {name: 'banana'}
 * }
 */
export type EnumifyObjects<
  SpecificObjects extends readonly Record<string, any>[],
  EnumKeyProperty extends keyof SpecificObjects[number] & string
> = Expand<{
  [Key in SpecificObjects[number][EnumKeyProperty] as UpperSnakeCase<Extract<Key, string>>]:
    Extract<SpecificObjects[number], Record<EnumKeyProperty, Key>>
}>;

/**
 * Converts an array of objects into an enum object with the specified property of the objects used as the keys of the enum object.
 * The specified property values are converted to upper snake case and used as the keys of the enum object.
 * The values of the enum object are the original objects.
 * @param objects - An array of objects to convert into an enum object.
 * @param propertyForEnumKey - The property of the objects to use as the keys of the enum object.
 * @returns An enum object with the specified property values of the objects used as the keys of the enum object.
 * @example
 * const fruits = [{name: 'apple'}, {name: 'banana'}] as const;
 * const FruitsEnum: {
 * 	APPLE: {name: 'apple'},
 * 	BANANA: {name: 'banana'}
 * } = toEnumFromObjects(fruits, 'name');
 */
export function toEnumFromObjects<
	SpecificObjects extends readonly Record<string, any>[],
	EnumKeyProperty extends keyof SpecificObjects[number] & string
>(
	objects: SpecificObjects,
	propertyForEnumKey: EnumKeyProperty
): EnumifyObjects<SpecificObjects, EnumKeyProperty> {
	return objects.reduce(
		(enumObject, object) => ({
			...enumObject,
			[toUpperSnakeCase(object[propertyForEnumKey])]: object
		}),
		{} as any
	);
}