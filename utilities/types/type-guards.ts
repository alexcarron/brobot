/**
 * @file type-guard.ts
 * @description
 * Contains type guard utilities for runtime type checking of objects.
 */

import { inspect } from "util";

/**
 * Checks if a given value is a string.
 * @param value - The value to check.
 * @returns If the value is a string.
 */
export function isString(
	value: unknown
): value is string {
	return typeof value === "string";
}

/**
 * Checks if a given value is a number.
 * @param value - The value to check.
 * @returns If the value is a number.
 */
export function isNumber(
	value: unknown
): value is number {
	return typeof value === "number";
}

/**
 * Checks if a given value is a boolean.
 * @param value - The value to check.
 * @returns If the value is a boolean.
 */
export function isBoolean(
	value: unknown
): value is boolean {
	return typeof value === "boolean";
}

/**
 * Checks if a given value is a BigInt.
 * @param value - The value to check.
 * @returns If the value is a BigInt.
 * @example
 * isBigint(123n) // true
 * isBigint(123) // false
 * isBigint("123") // false
 */
export function isBigint(
	value: unknown
): value is bigint {
	return typeof value === "bigint";
}

/**
 * Checks if a given value is a symbol.
 * @param value - The value to check.
 * @returns If the value is a symbol.
 */
export function isSymbol(
	value: unknown
): value is symbol {
	return typeof value === "symbol";
}

/**
 * Checks if a given value is null.
 * @param value - The value to check.
 * @returns If the value is null.
 */
export function isNull(
	value: unknown
): value is null {
	return value === null;
}

/**
 * Checks if a given value is undefined.
 * @param value - The value to check.
 * @returns If the value is undefined.
 */
export function isUndefined(
	value: unknown
): value is undefined {
	return value === undefined;
}

/**
 * Checks if a given value is not undefined.
 * @param value - The value to check.
 * @returns If the value is not undefined.
 * @example
 * expect(isNotUndefined(undefined)).toBe(false);
 * expect(isNotUndefined(null)).toBe(false);
 * expect(isNotUndefined(0)).toBe(true);
 */
export function isDefined<
  TypeOrUndefined
>(
	value: TypeOrUndefined
): value is Exclude<TypeOrUndefined, undefined> {
	return !isUndefined(value);
}

/**
 * Checks if a given value is neither null nor undefined.
 * @param value - The value to check.
 * @returns If the value is neither null nor undefined.
 * @example
 * expect(isNotNullable(undefined)).toBe(false);
 * expect(isNotNullable(null)).toBe(false);
 * expect(isNotNullable(0)).toBe(true);
 */
export function isNotNullable<
	TypeOrNullOrUndefined
>(
	value: TypeOrNullOrUndefined
): value is Exclude<TypeOrNullOrUndefined, null | undefined> {
	return !isNull(value) && !isUndefined(value);
}

/**
 * Checks if a given value is a primitive type.
 * Primitive types include string, number, boolean, bigint, symbol, null, and undefined.
 * @param value - The value to check.
 * @returns If the value is a primitive type.
 */
export function isPrimitive(
	value: unknown
): value is string | number | boolean | bigint | symbol | null | undefined {
	return (
		isString(value) ||
		isNumber(value) ||
		isBoolean(value) ||
		isBigint(value) ||
		isSymbol(value) ||
		isNull(value) ||
		isUndefined(value)
	);
}

/**
 * Checks if a given value is an array.
 * @param value - The value to check.
 * @returns If the value is an array.
 */
export function isArray(
	value: unknown
): value is unknown[] {
	return Array.isArray(value);
}

/**
 * Checks if a given value is an array of strings.
 * @param value - The value to check.
 * @returns If the value is an array of strings.
 */
export function isStrings(
	value: unknown
): value is string[] {
	return (
		isArray(value) &&
		value.every(value => isString(value))
	);
}

/**
 * Checks if a given value is an array containing a single object.
 * @param value - The value to check.
 * @returns If the value is an array containing a single object.
 * @example
 * expect(isArrayOfOneObject([{ foo: 'bar' }])).toBe(true);
 * expect(isArrayOfOneObject([{ foo: 'bar' }, { baz: 'qux' }])).toBe(false);
 */
export function isArrayOfOneObject(
	value: unknown
): value is [object] {
	return (
		isArray(value) &&
		value.length === 1 &&
		isObject(value[0])
	);
}

/**
 * Checks if a given value is an object.
 * @param value - The value to check.
 * @returns If the value is an object.
 */
export function isObject(
	value: unknown
): value is object {
	if (typeof value !== "object") return false;
	if (value === null) return false;

	return true;
}

/**
 * Checks if a given value is an object with all string keys.
 * @param value - The value to check.
 * @returns If the value is an object with all string keys.
 */
export function isStringToUnknownRecord(
	value: unknown
): value is Record<string, unknown> {
	if (!isObject(value)) return false;
	const object = value;

	return Object.keys(object).every(
		key => isString(key)
	);
}

/**
 * Checks if a given value is an object with all string values.
 * @param value - The value to check.
 * @returns If the value is an object with all string values.
 */
export function isStringToStringRecord(
	value: unknown
): value is Record<string, string> {
	if (!isStringToUnknownRecord(value)) return false;

  return Object.values(value).every(
		value => isString(value)
	);
}

/**
 * Checks if a given value is an object with all string array values.
 * @param value - The value to check.
 * @returns If the value is an object with all string array values.
 */
export function isStringToStringsRecord(
	value: unknown
): value is Record<string, string[]> {
	if (!isStringToUnknownRecord(value)) return false;

	return Object.values(value).every(
		value => isStrings(value)
	);
}

/**
 * Checks if a given value is an object with all number values.
 * @param value - The value to check.
 * @returns If the value is an object with all number values.
 */
export function isStringToNumberRecord(
	value: unknown
): value is Record<string, number> {
	if (!isStringToUnknownRecord(value)) return false;

	return Object.values(value).every(
		value => isNumber(value)
	);
}

/**
 * Checks if an object has a property with the given key.
 * @param object - The object to check.
 * @param key - The key to check for.
 * @returns If the object has a property with the given key.
 */
export function hasProperty<
	ObjectType,
	KeyType extends string | number | symbol
>(
	object: ObjectType,
	key: KeyType
): object is ObjectType extends object
	? ObjectType & Record<KeyType, unknown>
	: never
{
	return (
		isObject(object) &&
		key in object
	);
}

/**
 * Checks if a given value is an instance of the built-in Error class.
 * @param value - The value to check.
 * @returns If the value is an instance of the built-in Error class.
 */
export function isError(
	value: unknown
): value is Error {
	return value instanceof Error;
}

/**
 * Checks if a given value is a function.
 * @param value - The value to check.
 * @returns If the value is a function.
 * @example
 * const add = (a: number, b: number) => number;
 * expect(isFunction(add)).toBe(true);
 */
export function isFunction(
	value: unknown
): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}

/**
 * Creates a function that throws an error if the given value does not match the given type guard.
 * @param isType - A type guard function that takes a value and returns if it matches the expected type.
 * @param customError - An optional error to throw if the value does not match the expected type.
 * @returns A function that takes a value and checks it against the given type guard.
 * @throws {Error} - If the given value does not match the expected type.
 * @example
 * const isString = (value: unknown): value is string => typeof value === 'string';
 * const throwIfNotString = throwIfNot(isString);
 * throwIfNotString('hello'); // no error
 * throwIfNotString(123); // throws an error
 * throwIfNot(isString)(123); // throws an error
 */
export function throwIfNot<ExpectedType>(
	isType: (value: unknown) => value is ExpectedType,
	customError?: Error
) {
  return function throwIfValueIsNotType(value: unknown): asserts value is ExpectedType {
    if (!isType(value)) {
			if (customError !== undefined)
				throw customError;

      const guardName = isType.name || null;
      const valueString = inspect(value, {
				depth: 5,
				colors: true,
				compact: false,
			});
      const actualType = typeof value;
			const guardNamePart = guardName ? ` in ${guardName}` : '';

      throw new Error(
        `Type check failed${guardNamePart}.` +
        ` Received: ${valueString} (typeof ${actualType})`
      );
    }
  };
}

export function throwIfThisIsNot<
	ThisType,
	ExpectedType extends ThisType
>(
	isThisType: (this: ThisType) => this is ExpectedType,
	customError?: Error
) {
	const isType = (value: unknown): value is ExpectedType => {
    return isThisType.call(value as ThisType) as boolean;
  };

	return throwIfNot(isType, customError);
}
