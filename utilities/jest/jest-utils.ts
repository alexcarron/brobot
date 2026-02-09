/**
 * @file jest-utils.js
 * @description Centralized test utility functions to make writing Jest unit tests easier, more consistent, and discoverable—especially for new developers.
 */

import { addDuration, Duration, getMillisecondsOfDuration } from "../date-time-utils";
import { InvalidArgumentError } from "../error-utils";
import { Class, ElementOfArray, ErrorClass } from "../types/generic-types";
import { isArray, isNumberOrBigInt, isObject, isStrings } from "../types/type-guards";


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
		 * Asserts that the actual value is in between the given min and max values, inclusive.
		 * @param minValue - The minimum value of the range.
		 * @param maxValue - The maximum value of the range.
		 * @example
		 * makeSure(actualResultValue).isBetween(1, 10);
		 */
		isBetween(minValue: number, maxValue: number): void {
			baseExpect.toBeGreaterThanOrEqual(minValue);
			baseExpect.toBeLessThanOrEqual(maxValue);
		},

		/**
		 * Asserts that the actual value is greater than the expected value.
		 * @param expectedValue - The expected value to check against. Must be a number or bigint.
		 * @throws {Error} - Throws if the expected value is not a number or bigint.
		 * @example
		 * makeSure(actualResultValue).isGreaterThan(expectedValue);
		 */
		isGreaterThan(expectedValue: unknown): void {
			if (!isNumberOrBigInt(expectedValue)) {
				throw new Error(`Expected value must be a number or bigint, but got: ${expectedValue}`);
			}

			baseExpect.toBeGreaterThan(expectedValue);
		},

		/**
		 * Asserts that the actual value is greater than or equal to the expected value.
		 * @param expectedValue - The expected value to check against. Must be a number or bigint.
		 * @throws {Error} - Throws if the expected value is not a number or bigint.
		 * @example
		 * makeSure(actualResultValue).isGreaterThanOrEqualTo(expectedValue);
		 */
		isGreaterThanOrEqualTo(expectedValue: unknown): void {
			if (!isNumberOrBigInt(expectedValue)) {
				throw new Error(`Expected value must be a number or bigint, but got: ${expectedValue}`);
			}

			baseExpect.toBeGreaterThanOrEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is less than the expected value.
		 * @param expectedValue - The expected value to check against. Must be a number or bigint.
		 * @throws {Error} - Throws if the expected value is not a number or bigint.
		 * @example
		 * makeSure(actualResultValue).isLessThan(expectedValue);
		 */
		isLessThan(expectedValue: unknown): void {
			if (!isNumberOrBigInt(expectedValue)) {
				throw new Error(`Expected value must be a number or bigint, but got: ${expectedValue}`);
			}

			baseExpect.toBeLessThan(expectedValue);
		},

		/**
		 * Asserts that the actual value is less than or equal to the expected value.
		 * @param expectedValue - The expected value to check against. Must be a number or bigint.
		 * @throws {Error} - Throws if the expected value is not a number or bigint.
		 * @example
		 * makeSure(actualResultValue).isLessThanOrEqualTo(expectedValue);
		 */
		isLessThanOrEqualTo(expectedValue: unknown): void {
			if (!isNumberOrBigInt(expectedValue)) {
				throw new Error(`Expected value must be a number or bigint, but got: ${expectedValue}`);
			}

			baseExpect.toBeLessThanOrEqual(expectedValue);
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
			if (actualValue instanceof Map)
				expect(actualValue.size).toBe(expectedLength);
			else
				baseExpect.toHaveLength(expectedLength);
		},

		hasSizeof(expectedLength: number): void {
			if (!isObject(actualValue))
				throw new Error(`Expected actual value to be an object, but got: ${actualValue}`);

			if ('size' in actualValue === false)
				throw new Error(`Expected actual value to have a size property, but got: ${actualValue}`);

			expect(actualValue.size).toBe(expectedLength);
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

		containsOnly(...expectedValues: unknown[]): void {
			for (const expectedValue of expectedValues) {
				baseExpect.toContainEqual(expectedValue);
			}

			expect(
				[...new Set(actualValue as unknown[])].sort()
			).toEqual(
				[...new Set(expectedValues)].sort()
			);
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
		hasNoItemWhere(predicate: (item: ElementOfArray<ActualType>) => boolean): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			for (const item of actualValue) {
				if (predicate(item as ElementOfArray<ActualType>))
					throw new Error(`Expected no items in the array to satisfy the predicate, but got: ${actualValue}`);
			}
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
		 * Asserts that the object has the given properties
		 * OR
		 * Asserts that the object contains the expected properties with the given values
		 * @param properties - The names of the properties that the object should have or the expected properties and values that the object should contain.
		 * @example
		 * makeSure([{ id: 1 }]).hasProperties('id');
		 * makeSure({id: 1, name: 'John Doe', age: 30}).includesObject({ id: 1 });
		 */
		hasProperties(...properties: string[] | [Partial<ActualType>]): void {
			if (!isObject(actualValue))
				throw new Error(`Expected actual value to be an object, but got: ${actualValue}`);

			if (isStrings(properties)) {
				const propertyNames = properties;
				propertyNames.forEach(propertyName => {
					expect(actualValue).toHaveProperty(propertyName);
				});
			}
			else {
				const expectedObjectSubset = properties[0];
				expect(actualValue).toEqual(
					expect.objectContaining(expectedObjectSubset)
				);
			}
		},

		/**
		 * Asserts that the object has ONLY the given properties
		 * OR
		 * Asserts that the object contains ONLY the expected properties with the given values
		 * @param properties - The names of the properties that the object should have or the expected properties and values that the object should ONLY contain.
		 * @example
		 * makeSure({ id: 1, name: 'John Doe' }).hasOnlyProperties('id');
		 * makeSure({ id: 1, name: 'John Doe', age: 30 }).hasOnlyProperties({ id: 1, name: 'John Doe' });
		 */
		hasOnlyProperties(...properties: string[] | [Partial<ActualType>]): void {
			if (!isObject(actualValue))
				throw new Error(`Expected actual value to be an object, but got: ${actualValue}`);

			if (isStrings(properties)) {
				const propertyNames = properties;
				propertyNames.forEach(propertyName => {
					expect(actualValue).toHaveProperty(propertyName);
				});

				const otherProperties = Object.keys(actualValue).filter(
					propertyName => !propertyNames.includes(propertyName)
				);
				if (otherProperties.length > 0)
					throw new Error(
						`Expected object to only have properties: ${propertyNames}, but it has properties: ${otherProperties}`
					);
			}
			else {
				const expectedObjectSubset = properties[0];
				expect(actualValue).toEqual(
					expect.objectContaining(expectedObjectSubset)
				);

				const otherProperties = Object.keys(actualValue).filter(
					propertyName => !Object.keys(expectedObjectSubset).includes(propertyName)
				);
				if (otherProperties.length > 0)
					throw new Error(
						`Expected object to only have properties: ${Object.keys(expectedObjectSubset)}, but it has properties: ${otherProperties}`
					);
			}
		},

		/**
		 * Asserts that the actual array contains objects that have the given properties.
		 * @param properties - The names of the properties that each object should have or the expected properties and values that each object should contain.
		 * @example
		 * makeSure([{ id: 1 }, { id: 2 }]).haveProperties('id');
		 */
		haveProperties(...properties:
			| string[]
			| [Partial<
					(ActualType extends object[]
						? ActualType[number]
						: never)
				>]
		): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			actualValue.forEach(object => {
				if (!isObject(object))
					throw new Error(`Expected each item in the array to be an object, but got: ${object}`);

				if (isStrings(properties)) {
					const propertyNames = properties;
					propertyNames.forEach(propertyName => {
						expect(object).toHaveProperty(propertyName);
					});
				}
				else {
					const expectedObjectSubset = properties[0];
					expect(object).toEqual(
						expect.objectContaining(expectedObjectSubset)
					);
				}
			});
		},

		haveOnlyProperties(...properties:
			| string[]
			| [Partial<
					(ActualType extends object[]
						? ActualType[number]
						: never)
				>]
		): void {
			if (!isArray(actualValue))
				throw new Error(`Expected actual value to be an array, but got: ${actualValue}`);

			actualValue.forEach(object => {
				if (!isObject(object))
					throw new Error(`Expected each item in the array to be an object, but got: ${object}`);

				if (isStrings(properties)) {
					const propertyNames = properties;
					propertyNames.forEach(propertyName => {
						expect(object).toHaveProperty(propertyName);
					});

					const otherProperties = Object.keys(object).filter(
						propertyName => !propertyNames.includes(propertyName)
					);
					if (otherProperties.length > 0)
						throw new Error(
							`Expected object to only have properties: ${propertyNames}, but it has properties: ${otherProperties}`
						);
				}
				else {
					const expectedObjectSubset = properties[0];
					expect(object).toEqual(
						expect.objectContaining(expectedObjectSubset)
					);

					const otherProperties = Object.keys(object).filter(
						propertyName => !Object.keys(expectedObjectSubset).includes(propertyName)
					);
					if (otherProperties.length > 0)
						throw new Error(
							`Expected object to only have properties: ${Object.keys(expectedObjectSubset)}, but it has properties: ${otherProperties}`
						);
				}
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
		 * Asserts that the actual function throws an error.
		 * @example
		 * makeSure(() => { throw new Error('Error!'); }).throwsAnError();
		 */
		throwsAnError(): void {
			baseExpect.toThrow();
		},

		/**
		 * Asserts that the actual function does not throw an error.
		 * @example
		 * makeSure(() => { return 'Success!'; }).doesNotThrow();
		 */
		doesNotThrow(): void {
			baseExpect.not.toThrow();
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

/**
 * Fails a test with the given message.
 * @param message - The message to include in the error.
 * @example
 * failTest('Test failed due to invalid input.');
 * @throws {Error} - Always throws an error, which will cause the test to fail.
 */
export function failTest(message: string): never {
	throw new Error(`Jest test explicitly failed: ${message}`);
}


/**
 * Repeats a given function a specified number of times, spaced out over a given duration.
 * The function will be called with an incrementing index starting from 0.
 * Assumes jest fake timers are used to simulate the passage of time.
 * @param numRepeats - The number of times to repeat the function.
 * @param duration - The duration object to use for spacing out the function calls.
 * @param functionToRepeat - The function to repeat.
 * @example
 * repeatOverDuration(5, { seconds: 10 }, (index) => console.log(index));
 * // Calls the function 5 times, spaced out over 10 seconds.
 */
export function repeatOverDuration(
	numRepeats: number,
	duration: Duration,
	functionToRepeat: (index: number) => void,
): void {
	const startDate = new Date();
	const endDate = addDuration(startDate, duration);

	for (let index = 0; index < numRepeats; index++) {
		functionToRepeat(index);
		
		if (index < numRepeats - 1) {
			const millisecondsTillEnd = endDate.getTime() - new Date().getTime();
			const numRepeatsLeft = numRepeats - index - 1;
			const millisecondsToAdvance = millisecondsTillEnd / numRepeatsLeft;
			jest.advanceTimersByTime(millisecondsToAdvance);
		}
	}
}

/**
 * Repeats a given function at a specified interval until a given end date.
 * The function will be called with an incrementing index starting from 0.
 * Assumes jest fake timers are used to simulate the passage of time.
 * @param intervalDuration - The duration object to use for spacing out the function calls.
 * @param endDate - The date at which to stop repeating the function.
 * @param functionToRepeat - The function to repeat.
 * @example
 * repeatEveryIntervalUntil({ seconds: 10 }, new Date(Date.now() + 10000), (index) => console.log(index));
 * // Calls the function every 10 seconds until 10 seconds have passed.
 */
export function repeatEveryIntervalUntil(
	intervalDuration: Duration,
	endDate: Date,
	functionToRepeat: (index: number) => void,
): void {
	const startDate = new Date();

	if (startDate.getTime() > endDate.getTime()) {
		throw new Error(`Expected start date (${startDate.toISOString()}) to be before end date (${endDate.toISOString()}).`);
	}
	
	let now = startDate;
	let index = 0;
	while (now.getTime() < endDate.getTime()) {
		functionToRepeat(index);
		
		jest.advanceTimersByTime(getMillisecondsOfDuration(intervalDuration));

		index++;
		now = new Date();
	}

	jest.setSystemTime(endDate);
}

/**
 * Sets jest to use fake timers and executes a given function at the start date.
 * If the function is called with a date, it will be used as the start date.
 * If the function is called with a function, the function will be executed at the current date.
 * If a callback function is not provided, an error will be thrown.
 * After the callback function is executed, jest will be set back to use real timers.
 * @param startDateOrCallback - The date to use as the start date, or a function to execute at the current date.
 * @param callback - The function to execute at the start date.
 */
export function withFakeTimers(
	startDateOrCallback: Date | (() => void),
	callback?: () => void,
): void {
	let startDate: Date = new Date();
	if (typeof startDateOrCallback === 'function') {
		callback = startDateOrCallback;	
	}
	else {
		startDate = startDateOrCallback;
	}

	if (callback === undefined) {
		throw new InvalidArgumentError('withFakeTimers() function expected callback function to be provided, but it was not provided.');
	}

	jest.useFakeTimers({ now: startDate });
	callback();
	jest.useRealTimers();
}