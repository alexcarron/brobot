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
	ObjectType extends object,
	KeyType extends string | number | symbol
>(
	object: ObjectType,
	key: KeyType
): object is ObjectType & Record<KeyType, unknown> {
	return key in object;
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