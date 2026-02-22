/**
 * @file type-assertions.ts
 * @description
 * Contains type assertion utilities for runtime type checking of objects.
 */

import { InvalidArgumentTypeError } from "../error-utils";
import { isString } from "./type-guards";

/**
 * Asserts that the given value is a string and returns it as a string.
 * Throws an InvalidArgumentTypeError if the given value is not a string.
 * @param value The value to assert and return as a string.
 * @returns The given value if it is a string.
 * @throws {InvalidArgumentTypeError} - If the given value is not a string.
 */
export function asString(value: unknown): string {
	if (!isString(value)) 
		throw new InvalidArgumentTypeError({
			functionName: "asString",
			argumentName: "value",
			expectedType: "string",
			actualValue: value,
		});
		
	return value;
}