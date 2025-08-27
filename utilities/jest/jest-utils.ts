/**
 * @file jest-utils.js
 * @description Centralized test utility functions to make writing Jest unit tests easier, more consistent, and discoverable—especially for new developers.
 */

import { Class, ErrorClass } from "../types/generic-types";


/**
 * Wraps an actual result value, letting you check if it matches the expected value by attaching methods that describe the expected outcome
 * Wraps Jest's `expect()`
 * @param actualValue - The actual value you want to check matches an expected condition.
 * @returns A set of methods that let you check if the actual result value matches an expected condition
 * @example
 * makeSure(actualResultValue).is(expectedValue);
 */
export function makeSure(actualValue: unknown) {
	// eslint-disable-next-line jest/valid-expect
	const baseExpect = expect(actualValue);

	return {
		// Existing Jest matchers can be used as-is
		...baseExpect,

		/**
		 * Asserts that the actual value is the same instance as the expected value (shallow comparison).
		 * @param expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).isSameInstanceAs(expectedValue);
		 */
		isSameInstanceAs(expectedValue: unknown): void {
			baseExpect.toBe(expectedValue);
		},

		/**
		 * Asserts that the actual value is the expected value (Deep comparison).
		 * @param expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).is(expectedValue);
		 */
		is(expectedValue: unknown): void {
			baseExpect.toEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is not the expected value (Deep comparison).
		 * @param expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).isNot(expectedValue);
		 */
		isNot(expectedValue: unknown): void {
			baseExpect.not.toEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is equal to the expected value (Deep comparison).
		 * @param expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).isEqualTo(expectedValue);
		 */
		isEqualTo(expectedValue: unknown): void {
			baseExpect.toEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is an instance of the expected class.
		 * @param expectedClass - The class that the actual value should be an instance of
		 * @example
		 * makeSure(actualResultValue).isAnInstanceOf(PlayerService);
		 */
		isAnInstanceOf(expectedClass: Class): void {
			baseExpect.toBeInstanceOf(expectedClass);
		},

		/**
		 * Asserts that the actual value is not a number.
		 * @example
		 * makeSure(actualResultValue).isNotANumber();
		 */
		isNotANumber(): void {
			if (
				typeof actualValue === 'number' &&
				!Number.isNaN(actualValue)
			) {
				throw new Error(`Expected actual value to NOT be a number, but got number: ${actualValue}`);

			}
		},

		/**
		 * Asserts that the actual value is undefined.
		 * @example
		 * makeSure(actualResultValue).isUndefined();
		 */
		isUndefined(): void {
			baseExpect.toBe(undefined);
		},

		/**
		 * Asserts that the actual value is true.
		 * @example
		 * makeSure(actualResultValue).isTrue();
		 */
		isTrue(): void {
			baseExpect.toBe(true);
		},

		/**
		 * Asserts that the actual value is false.
		 * @example
		 * makeSure(actualResultValue).isFalse();
		 */
		isFalse(): void {
			baseExpect.toBe(false);
		},


		/**
		 * Asserts that the actual string has the same characters as the expected string, regardless of order.
		 * @param expectedValue - The string that the actual string should have the same characters as.
		 * @throws Will throw an error if the actual value is not a string.
		 * @example
		 * makeSure('abc').hasSameCharactersAs('cab'); // Passes
		 * makeSure('abc').hasSameCharactersAs('abcd'); // Fails
		 */
		hasSameCharactersAs(expectedValue: string): void {
			if (typeof actualValue !== "string") {
				expect(actualValue).toBeInstanceOf(String);
				throw new Error(`Expected actual value to be a string, but got: ${actualValue}`);
			}

			const sortedActualValue = [...actualValue].sort().join("");
			const sortedExpectedValue = [...expectedValue].sort().join("");

			expect(sortedActualValue)
				.toEqual(sortedExpectedValue);
		},

		/**
		 * Asserts that the actual array or string has the expected length.
		 * @param expectedLength - The expected length of the actual array or string.
		 * @example
		 * makeSure([1, 2, 3]).hasLengthOf(3);
		 */
		hasLengthOf(expectedLength: number): void {
			baseExpect.toHaveLength(expectedLength);
		},

		/**
		 * Asserts that the actual array or string has no elements.
		 * @example
		 * makeSure([]).isEmpty();
		 */
		isEmpty(): void {
			if (typeof actualValue === 'number') {
				throw Error(
					`makeSure(${actualValue}).isEmpty() was called with a number.\n` +
					`Instead, call it with an array or anything with a length property.`
				);
			}
			baseExpect.toHaveLength(0);
		},

		/**
		 * Asserts that the actual array or string contains the expected value.
		 * @param expectedValue - The value that the actual array or string should contain.
		 * @example
		 * makeSure([1, 2, 3]).contains(2);
		 */
		contains(expectedValue: unknown): void {
			baseExpect.toContainEqual(expectedValue);
		},

		/**
		 * Asserts that the actual function throws an error.
		 * @example
		 * makeSure(() => { throw new Error('Error!'); }).throwsAnError();
		 */
		throwsAnError(): void {
			baseExpect.toThrow();
		},

		/**
		 * Asserts that the actual function throws an error that is an instance of the given error type.
		 * @param errorType - The error type that the actual function should throw.
		 * @example
		 * makeSure(() => { throw new TypeError('Error!'); }).throws(TypeError);
		 */
		throws(errorType: ErrorClass): void {
			baseExpect.toThrow(errorType);
		},

		/**
		 * Asserts that the actual function throws an error with a message containing the given substring.
		 * @param substringInErrorMessage - The substring that the error message thrown by the actual function should contain.
		 * @example
		 * makeSure(() => { throw new Error('Error!'); }).throwsAnErrorWith('Error');
		 */
		throwsAnErrorWith(substringInErrorMessage: string): void {
			baseExpect.toThrow(substringInErrorMessage);
		},

		/**
		 * Asserts that a promise will eventually reject with an error.
		 * This is useful for testing asynchronous functions that are expected to throw errors.
		 * @example
		 * await makeSure(someAsyncFunction()).eventuallyThrowsAnError();
		 */
		async eventuallyThrowsAnError(): Promise<void> {
			await baseExpect.rejects.toThrow();
		},

		/**
		 * Asserts that a promise will eventually reject with an error that is an instance of the given error type.
		 * This is useful for testing asynchronous functions that are expected to throw errors.
		 * @param errorType - The error type that the actual function should throw.
		 * @example
		 * await makeSure(someAsyncFunction()).eventuallyThrows(TypeError);
		 */
		async eventuallyThrows(errorType: ErrorClass): Promise<void> {
			await baseExpect.rejects.toThrow(errorType);
		},

		/**
		 * Asserts that a promise will eventually reject with an error with a message containing the given substring.
		 * This is useful for testing asynchronous functions that are expected to throw errors.
		 * @param substringInErrorMessage - The substring that the error message thrown by the actual function should contain.
		 * @example
		 * await makeSure(someAsyncFunction()).eventuallyThrowsAnErrorWith('Error');
		 */
		async eventuallyThrowsAnErrorWith(substringInErrorMessage: string): Promise<void> {
			await baseExpect.rejects.toThrow(substringInErrorMessage);
		},

		/**
		 * Asserts that a mock function has been called.
		 * If a number is provided, it asserts that the function has been called that specific number of times.
		 * @param [numTimesCalled] - The number of times the function is expected to have been called. If not provided, asserts that the function has been called at least once.
		 * @example
		 * makeSure(mockFunction).hasBeenCalled();
		 * makeSure(mockFunction).hasBeenCalled(3);
		 */
		hasBeenCalled(numTimesCalled?: number): void {
			if (numTimesCalled === undefined) {
				baseExpect.toHaveBeenCalled();
			}
			else {
				baseExpect.toHaveBeenCalledTimes(numTimesCalled);
			}
		},

		/**
		 * Asserts that a mock function has not been called.
		 * If a number is provided, it asserts that the function has not been called that specific number of times.
		 * @param numTimesCalled - The number of times the function is expected not to have been called. If not provided, asserts that the function has not been called at all.
		 * @example
		 * makeSure(mockFunction).hasNotBeenCalled();
		 * makeSure(mockFunction).hasNotBeenCalled(3);
		 */
		hasNotBeenCalled(numTimesCalled?: number) {
			if (numTimesCalled === undefined) {
				baseExpect.not.toHaveBeenCalled();
			}
			else {
				baseExpect.not.toHaveBeenCalledTimes(numTimesCalled);
			}
		},

		/**
		 * Asserts that a mock function has been called once.
		 * @example
		 * makeSure(mockFunction).hasBeenCalledOnce();
		 */
		hasBeenCalledOnce(): void {
			baseExpect.toHaveBeenCalledTimes(1);
		},

		/**
		 * Asserts that a mock function has been called with the given arguments.
		 * @param args - The arguments that the mock function should have been called with.
		 * @example
		 * makeSure(mockFunction).hasBeenCalledWith(expect.any(Number), 'arg2');
		 */
		hasBeenCalledWith(...args: unknown[]): void {
			baseExpect.toHaveBeenCalledWith(...args);
		},

		/**
		 * Returns the original Jest expect matcher for this value (for advanced usage).
		 * If you need more advanced functionality than what's provided by `makeSure()`, you can use this to gain direct access to the underlying Jest expect object.
		 * @returns The original Jest expect matcher for this value.
		 * @example
		 * makeSure(actualResultValue).turnsOut.toBe(expectedValue);
		 */
		get turnsOut(): jest.JestMatchers<any> {
			return baseExpect;
		},
	};
}
