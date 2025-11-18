/**
 * @file jest-utils.js
 * @description Centralized test utility functions to make writing Jest unit tests easier, more consistent, and discoverable—especially for new developers.
 */

import { Class, ElementOfArray, ErrorClass } from "../types/generic-types";
import { isArray, isObject } from "../types/type-guards";


/**
 * Wraps an actual result value, letting you check if it matches the expected value by attaching methods that describe the expected outcome
 * Wraps Jest's `expect()`
 * @param actualValue - The actual value you want to check matches an expected condition.
 * @returns A set of methods that let you check if the actual result value matches an expected condition
 * @example
 * makeSure(actualResultValue).is(expectedValue);
 */
export function makeSure<
	ActualType
>(actualValue: ActualType) {
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
		 * Asserts that the actual value is a number.
		 * @example
		 * makeSure(actualResultValue).isANumber();
		 */
		isANumber(): void {
			if (typeof actualValue !== 'number') {
				throw new Error(`Expected actual value to be a number, but got: ${actualValue}`);
			}
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
		 * Asserts that the actual value is not a string.
		 * @example
		 * makeSure(actualResultValue).isNotAString();
		 */
		isNotAString(): void {
			if (typeof actualValue === 'string') {
				throw new Error(`Expected actual value to NOT be a string, but got string: ${actualValue}`);
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
		 * Asserts that the actual value is not undefined.
		 * @example
		 * makeSure(actualResultValue).isNotUndefined();
		 */
		isNotUndefined(): void {
			baseExpect.not.toBe(undefined);
		},

		/**
		 * Asserts that the actual value is null.
		 * @example
		 * makeSure(actualResultValue).isNull();
		 */
		isNull(): void {
			baseExpect.toBe(null);
		},

		/**
		 * Asserts that the actual value is not null.
		 * @example
		 * makeSure(actualResultValue).isNotNull();
		 */
		isNotNull(): void {
			baseExpect.not.toBe(null);
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
		 * Asserts that the actual date is within the given tolerance of the expected date.
		 * @param expectedDate - The expected date to check against.
		 * @param toleranceMs - The tolerance in milliseconds.
		 * @example
		 * makeSure(actualDate).isCloseToDate(expectedDate, 500); // within 500ms
		 */
		isCloseToDate(expectedDate: Date, toleranceMs: number = 1000): void {
			if (
				actualValue instanceof Date === false
			) {
				throw new Error(`Expected actual value to be a Date, but got: ${actualValue}`);
			}

			const actualTime = actualValue.getTime();
			const expectedTime = expectedDate.getTime();
			const timeDifference = Math.abs(actualTime - expectedTime);

			if (timeDifference > toleranceMs) {
				throw new Error(
					`Expected ${actualValue} to be within ${toleranceMs}ms of ${expectedDate}, but difference was ${timeDifference}ms.`
				);
			}
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
		 * Asserts that the actual value is an array.
		 * @example
		 * makeSure([1, 2, 3]).isArray();
		 */
		isAnArray(): void {
			if (!isArray(actualValue)) {
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);
			}
		},

		isAnObject(): void {
			if (!isObject(actualValue)) {
				throw new Error(`Expected actual value to be an object, but got: ${actualValue}`);
			}
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
		 * Asserts that the actual array or string is not empty.
		 * @example
		 * makeSure([1, 2, 3]).isNotEmpty();
		 */
		isNotEmpty(): void {
			if (typeof actualValue === 'number') {
				throw Error(
					`makeSure(${actualValue}).isNotEmpty() was called with a number.\n` +
					`Instead, call it with an array or anything with a length property.`
				);
			}

			baseExpect.not.toHaveLength(0);
		},

		/**
		 * Asserts that the actual array contains all of the expected values.
		 * @param expectedValues - The values that the actual array should contain.
		 * @example
		 * makeSure([1, 2, 3]).contains(2, 3);
		 */
		contains(...expectedValues: unknown[]): void {
			for (const expectedValue of expectedValues) {
				baseExpect.toContainEqual(expectedValue);
			}
		},

		/**
		 * Asserts that the actual array does not contain any of the given values.
		 * @param unexpectedValues - The values that the actual array should not contain.
		 * @example
		 * makeSure([1, 2, 3]).doesNotContain(4);
		 */
		doesNotContain(...unexpectedValues: unknown[]): void {
			for (const unexpectedValue of unexpectedValues) {
				baseExpect.not.toContainEqual(unexpectedValue);
			}
		},

		/**
		 * Asserts that all values in the array are different.
		 * @example
		 * makeSure([1, 2, 3]).areAllDifferent();
		 */
		areAllDifferent(): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			const uniqueValues = new Set(actualValue);
			if (uniqueValues.size !== actualValue.length) {
				throw new Error(`Expected all values in the array to be different, but got: ${actualValue}`);
			}
		},

		/**
		 * Asserts that the actual array does not contain any of the given values.
		 * @param unexpectedValue - The value that the actual array should not contain.
		 * @example
		 * makeSure([1, 2, 3]).areAllNot(4);
		 */
		areAllNot(unexpectedValue: unknown): void {
			baseExpect.not.toContain(unexpectedValue);
		},

		/**
		 * Asserts that at least one item in the array satisfies the given predicates. For each predicate, there must be at least one item that satisfies it.
		 * @param predicates - Functions that takes an item from the array and returns true or false.
		 * @example
		 * makeSure([1, 2, 3]).hasAnItemWhere(item => item % 2 === 0);
		 */
		hasAnItemWhere(
			...predicates: Array<(item: ElementOfArray<ActualType>) => boolean>
		): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			if (actualValue.length === 0)
				throw new Error(`Expected at least one item in the array, but got an empty array`);

			let allPredicatesSatisfied = true;
			for (const predicate of predicates) {
				let foundItem = false;

				for (const item of actualValue) {
					if (predicate(item as ElementOfArray<ActualType>))
						foundItem = true;
				}

				if (!foundItem) {
					allPredicatesSatisfied = false;
					break;
				}
			}

			if (!allPredicatesSatisfied)
				throw new Error(`Expected at least one item in the array to satisfy the predicate, but got: ${actualValue}`);
		},

		/**
		 * Asserts that no items in the array satisfy the given predicate.
		 * @param predicate - A function that takes an item from the array and returns true or false.
		 * @example
		 * makeSure([1, 2, 3]).hasNoItemsWhere(item => item % 2 === 0);
		 */
		hasNoItemsWhere(predicate: (item: ElementOfArray<ActualType>) => boolean): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			for (const item of actualValue) {
				if (predicate(item as ElementOfArray<ActualType>))
					throw new Error(`Expected no items in the array to satisfy the predicate, but got: ${actualValue}`);
			}
		},

		/**
		 * Asserts that each item in the array has the given properties.
		 * @param propertyNames - The names of the properties that each item in the array should have.
		 * @example
		 * makeSure([{ id: 1 }, { id: 2 }]).hasProperties('id');
		 */
		hasProperties(...propertyNames: string[]): void {
			if (!isObject(actualValue))
				throw new Error(`Expected each item in the array to be an object, but got: ${actualValue}`);

			propertyNames.forEach(propertyName => {
				expect(actualValue).toHaveProperty(propertyName);
			});
		},

	/**
	 * Asserts that the actual value has a property with the given name and optional value.
	 * @param propertyName - The name of the property that the actual value should have.
	 * @param value - The value that the actual value's property should have.
	 * @example
	 * makeSure({ name: 'John' }).hasProperty('name');
	 * makeSure({ id: 1 }).hasProperty('id', 1);
	 */
		hasProperty(
			propertyName: string,
			value?: unknown
		): void {
			if (value === undefined)
				expect(actualValue).toHaveProperty(propertyName);
			else
				expect(actualValue).toHaveProperty(propertyName, value);
		},

		/**
		 * Asserts that the actual array contains objects that have the given properties.
		 * @param propertyNames - The names of the properties that each object should have.
		 * @example
		 * makeSure([{ id: 1 }, { id: 2 }]).haveProperties('id');
		 */
		haveProperties(...propertyNames: string[]): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			actualValue.forEach(object => {
				if (!isObject(object))
					throw new Error(`Expected each item in the array to be an object, but got: ${object}`);

				propertyNames.forEach(propertyName => {
					expect(object).toHaveProperty(propertyName);
				});
			});
		},

		/**
		 * Asserts that each item in the array has a property with the given name and optional value.
		 * @param propertyName - The name of the property that each item in the array should have.
		 * @param value - The value that each item in the array's property should have.
		 * @example
		 * makeSure([{ id: 1 }, { id: 2 }]).haveProperty('id');
		 * makeSure([{ id: 1 }, { id: 2 }]).haveProperty('id', 1);
		 */
		haveProperty(propertyName: string, value?: unknown): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			actualValue.forEach(object => {
				expect(object).toHaveProperty(propertyName, value);
			});
		},

		/**
		 * Asserts that the actual object contains the expected object subset in it.
		 * @param expectedObjectSubset - The expected object subset that the actual object should contain.
		 * @example
		 * makeSure({id: 1, name: 'John Doe', age: 30}).includesObject({ id: 1 });
		 */
		containsProperties(expectedObjectSubset: Partial<ActualType>): void {
			expect(actualValue).toEqual(
				expect.objectContaining(expectedObjectSubset)
			);
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
