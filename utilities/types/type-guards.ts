/**
 * @file type-guard.ts
 * @description
 * Contains type guard utilities for runtime type checking of objects.
 */

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