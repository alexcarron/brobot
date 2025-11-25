import { string, zeroOrOne } from "../../../utilities/runtime-types-utils";

/**
 * Converts a boolean value into a 0 or 1 value that can be inserted into the database.
 * @param value - The boolean value to be converted.
 * @returns 0 if the value is false, 1 if the value is true.
 */
export function toDBBool(value?: boolean): 0 | 1 {
	if (value === undefined) return 0;
	if (value === true) return 1;
	if (value === false) return 0;

	throw Error(`Invalid boolean value: ${value}`);
}

/**
 * Converts a boolean value into a 0 or 1 value that can be inserted into the database, or undefined if the value is undefined.
 * Used when you want to preserve undefined values when fields are optional.
 * @param value - The boolean value to be converted.
 * @returns 0 if the value is false, 1 if the value is true, undefined if the value is undefined.
 */
export function toOptionalDBBool(value?: boolean): 0 | 1 | undefined {
	if (value === undefined) return undefined;
	return toDBBool(value);
}

/**
 * Converts a boolean value stored in the database (0 or 1) into a boolean value.
 * @param value - The boolean value stored in the database to be converted.
 * @returns The boolean value converted from the database value.
 * @throws {Error} If the database value is not 0 or 1.
 */
export function fromDBBoolean(value: 0 | 1): boolean {
	if (value === 0) return false;
	if (value === 1) return true;

	throw Error(`Invalid db boolean value: ${value}`);
}

/**
 * A transformable runtime type representing a boolean value stored in the database (0 or 1).
 */
export const DBBoolean = zeroOrOne
	.to(oneOrZero => oneOrZero === 1)
	.from(boolean => boolean ? 1 : 0);

/**
 * A transformable runtime type representing a date stored in the database as a string.
 */
export const DBDate = string
	.to(string => new Date(Number(string)))
	.from(date => date.getTime().toString());