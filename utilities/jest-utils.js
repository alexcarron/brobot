/**
 * @file jest-utils.js
 * @description Centralized test utility functions to make writing Jest unit tests easier, more consistent, and discoverable—especially for new developers.
 */

/**
 * Defines a group of related tests to be run.
 * Wraps Jest's `describe()`
 * @param {string} groupName - The name of the group of tests
 * @param {() => void} defineTestsOrSubgroups - The function that defines all the related tests or sub-groups of tests.
 * @example
 * groupTests('addition', () => {
 *   defineTest('should return correct sum', () => {
 *     expect(add(1, 2)).toBe(3);
 *   });
 })
 */
function groupTests(groupName, defineTestsOrSubgroups) {
	// eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
	describe(groupName, defineTestsOrSubgroups);
}

/**
 * Defines a group of related expected behaviors for a specific entity (e.g. class, function, component)
 * Wraps Jest's `describe()`
 * @param {string} entityTesting - A description of the entity being tested.
 * @param {() => void} defineTestsOrSubgroups - The function that defines all the related expected behaviors or sub-groups of expected behaviors.
 * @example
 * the('PlayerService class', () => {
 *   should('create an instance', () => {
 *     expect(new PlayerService()).toBeInstanceOf(PlayerService);
 *   });
 * })
 */
function the(entityTesting, defineTestsOrSubgroups) {
	// eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
	describe(`the ${entityTesting}`, defineTestsOrSubgroups);
}

/**
 * Defines a group of entities to test that a container entity contains.
 * Wraps Jest's `describe()`
 * @param {string} containerEntity - A description of the entity that contains the entities being tested
 * @param {() => void} defineEntitiesTesting - The function that defines all the entities being tested.
 * @example
 * inThe('Arithemetic class', () => {
 *   the('sum() method', () => {
 *     should('add two numbers', () => {
 *       makeSure(sum(1, 2)).is(3);
 *     });
 *   });
 * })
 */
function inThe(containerEntity, defineEntitiesTesting) {
	// eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
	describe(`in the ${containerEntity}`, defineEntitiesTesting);
}

/**
 * Defines a group of related entities to test within a given container entity.
 * Wraps Jest's `describe()`
 * @param {string} containerEntity - A description of the entity that contains the entities being tested.
 * @param {() => void} defineEntitiesTesting - The function that defines all the entities being tested.
 * @example
 * inside('arithmetic.js', () => {
 *   the('addition function', () => {
 *     should('add two numbers', () => {
 *       expect(add(1, 2)).toBe(3);
 *     });
 *   });
 * })
 */
function inside(containerEntity, defineEntitiesTesting) {
	// eslint-disable-next-line jest/valid-describe-callback, jest/valid-title
	describe(`inside ${containerEntity}`, defineEntitiesTesting);
}

/**
 * Defines a test case to be run.
 * Wraps Jest's `test()`
 * @param {string} expectedBehaviorDescription - A description of the expected behavior of the test. (e.g. "should return correct sum")
 * @param {() => void} runTestScenario - A function that runs the test scenario.
 */
function defineTest(expectedBehaviorDescription, runTestScenario) {
	// eslint-disable-next-line jest/expect-expect, jest/valid-title
	test(expectedBehaviorDescription, runTestScenario);
}

/**
 * Defines a test case to be run using the "should" verb.
 * Wraps Jest's `test()`
 * @param {string} expectedBehaviorDescription - A description of the expected behavior of the test. (e.g. "should return correct sum")
 * @param {() => void} runTestScenario - A function that runs the test scenario.
 */
function should(expectedBehaviorDescription, runTestScenario) {
	// eslint-disable-next-line jest/expect-expect, jest/valid-title
	test(`should ${expectedBehaviorDescription}`, runTestScenario);
}

/**
 * Defines a function to be run before each test is run.
 * Wraps Jest's `beforeEach()`
 * @param {() => void} functionToRun - The function to run before each test.
 * @example
 * runBeforeEach(() => {
 *   initializeTestState();
 * })
 */
function runBeforeEachTest(functionToRun) {
	beforeEach(functionToRun);
}

/**
 * Defines a function to be run after each test is run.
 * @param {() => void} functionToRun - The function to run after each test.
 * @example
 * runAfterEach(() => {
 *   cleanupTestState();
 * })
 */
function runAfterEachTest(functionToRun) {
	afterEach(functionToRun);
}

/**
 * Defines a function to be run after all tests in this file have been run.
 * @param {() => void} functionToRun - The function to run after all tests.
 * @example
 * runAfterAllTests(() => {
 *   cleanUpResources();
 * })
 */
function runAfterAllTests(functionToRun) {
	afterAll(functionToRun);
}

/**
 * Defines a function to be run before all tests in this file have been run.
 * Wraps Jest's `beforeAll()`
 * @param {() => void} functionToRun - The function to run before all tests.
 * @example
 * runBeforeAllTests(() => {
 *   setupResources();
 * })
 */
function runBeforeAllTests(functionToRun) {
	beforeAll(functionToRun);
}


/**
 * @typedef {object} MakeSure
 * @property {(expectedValue: any) => void} isSameInstanceAs
 *   Asserts the actual value is the same instance as the expected value (shallow comparison).
 * @property {(expectedValue: any) => void} is
 *   Asserts the actual value is the expected value (deep comparison).
 * @property {(expectedValue: any) => void} isEqualTo
 *   Asserts the actual value is equal to the expected value (Deep comparison).
 * @property {(expectedClass: Function) => void} isAnInstanceOf
 *   Asserts the actual value is an instance of the expected class.
 * @property {() => void} isNotANumber
 *   Asserts the actual value is not a number.
 * @property {() => void} isTrue
 *   Asserts the actual value is true.
 * @property {() => void} isFalse
 *   Asserts the actual value is false.
 * @property {(expectedLength: number) => void} hasLengthOf
 *   Asserts the actual value has the expected number of elements.
 * @property {() => void} isEmpty
 *   Asserts the actual value has no elements.
 * @property {(expectedValue: any) => void} contains
 *   Asserts the actual array or string contains the expected value.
 * @property {() => void} throwsAnError
 *   Asserts the actual value throws an error.
 * @property {(substringInErrorMessage: string) => void} throwsAnErrorWith
 *   Asserts the actual value throws an error with the expected substring in the error message.
 * @property {() => Promise<void>} eventuallyThrowsAnError
 *   Asserts the actual value eventually throws an error.
 * @property {(substringInErrorMessage: string) => Promise<void>} eventuallyThrowsAnErrorWith
 *   Asserts the actual value eventually throws an error with the expected substring in the error message.
 * @property {jest.JestMatchers<any>} turnsOut
 *   Returns the original Jest expect matcher for this value (for advanced usage).
 */

/**
 * Wraps an actual result value, letting you check if it matches the expected value by attaching methods that describe the expected outcome
 * Wraps Jest's `expect()`
 * @param {any} actualValue - The actual value you want to check matches an expected condition.
 * @returns {MakeSure} A set of methods that let you check if the actual result value matches an expected condition
 * @example
 * makeSure(actualResultValue).is(expectedValue);
 */
function makeSure(actualValue) {
	// eslint-disable-next-line jest/valid-expect
	const baseExpect = expect(actualValue);

	return {
		// Existing Jest matchers can be used as-is
		...baseExpect,

		/**
		 * Asserts that the actual value is the same instance as the expected value (shallow comparison).
		 * @param {*} expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).isSameInstanceAs(expectedValue);
		 */
		isSameInstanceAs(expectedValue) {
			baseExpect.toBe(expectedValue);
		},

		/**
		 * Asserts that the actual value is the expected value (Deep comparison).
		 * @param {*} expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).is(expectedValue);
		 */
		is(expectedValue) {
			baseExpect.toEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is equal to the expected value (Deep comparison).
		 * @param {*} expectedValue - The expected value to check against.
		 * @example
		 * makeSure(actualResultValue).isEqualTo(expectedValue);
		 */
		isEqualTo(expectedValue) {
			baseExpect.toEqual(expectedValue);
		},

		/**
		 * Asserts that the actual value is an instance of the expected class.
		 * @param {Function} expectedClass - The class that the actual value should be an instance of
		 * @example
		 * makeSure(actualResultValue).isAnInstanceOf(PlayerService);
		 */
		isAnInstanceOf(expectedClass) {
			baseExpect.toBeInstanceOf(expectedClass);
		},

		/**
		 * Asserts that the actual value is not a number.
		 * @example
		 * makeSure(actualResultValue).isNotANumber();
		 */
		isNotANumber() {
			if (
				typeof actualValue === 'number' &&
				!Number.isNaN(actualValue)
			) {
				throw new Error(`Expected actual value to NOT be a number, but got number: ${actualValue}`);

			}
		},

		/**
		 * Asserts that the actual value is true.
		 * @example
		 * makeSure(actualResultValue).isTrue();
		 */
		isTrue() {
			baseExpect.toBe(true);
		},

		/**
		 * Asserts that the actual value is false.
		 * @example
		 * makeSure(actualResultValue).isFalse();
		 */
		isFalse() {
			baseExpect.toBe(false);
		},

		/**
		 * Asserts that the actual array or string has the expected length.
		 * @param {number} expectedLength - The expected length of the actual array or string.
		 * @example
		 * makeSure([1, 2, 3]).hasLengthOf(3);
		 */
		hasLengthOf(expectedLength) {
			baseExpect.toHaveLength(expectedLength);
		},

		/**
		 * Asserts that the actual array or string has no elements.
		 * @example
		 * makeSure([]).isEmpty();
		 */
		isEmpty() {
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
		 * @param {*} expectedValue - The value that the actual array or string should contain.
		 * @example
		 * makeSure([1, 2, 3]).contains(2);
		 */
		contains(expectedValue) {
			baseExpect.toContainEqual(expectedValue);
		},

		/**
		 * Asserts that the actual function throws an error.
		 * @example
		 * makeSure(() => { throw new Error('Error!'); }).throwsAnError();
		 */
		throwsAnError() {
			baseExpect.toThrow();
		},

		/**
		 * Asserts that the actual function throws an error with a message containing the given substring.
		 * @param {string} substringInErrorMessage - The substring that the error message thrown by the actual function should contain.
		 * @example
		 * makeSure(() => { throw new Error('Error!'); }).throwsAnErrorWith('Error');
		 */
		throwsAnErrorWith(substringInErrorMessage) {
			baseExpect.toThrow(substringInErrorMessage);
		},

		/**
		 * Asserts that a promise will eventually reject with an error.
		 * This is useful for testing asynchronous functions that are expected to throw errors.
		 * @returns {Promise<void>} A promise that resolves when the error has been thrown.
		 * @example
		 * await makeSure(someAsyncFunction()).eventuallyThrowsAnError();
		 */
		async eventuallyThrowsAnError() {
			await baseExpect.rejects.toThrow();
		},

		/**
		 * Asserts that a promise will eventually reject with an error with a message containing the given substring.
		 * This is useful for testing asynchronous functions that are expected to throw errors.
		 * @param {string} substringInErrorMessage - The substring that the error message thrown by the actual function should contain.
		 * @returns {Promise<void>} A promise that resolves when the error has been thrown.
		 * @example
		 * await makeSure(someAsyncFunction()).eventuallyThrowsAnErrorWith('Error');
		 */
		async eventuallyThrowsAnErrorWith(substringInErrorMessage) {
			await baseExpect.rejects.toThrow(substringInErrorMessage);
		},

		/**
		 * Returns the original Jest expect matcher for this value (for advanced usage).
		 * If you need more advanced functionality than what's provided by `makeSure()`, you can use this to gain direct access to the underlying Jest expect object.
		 * @returns {jest.JestMatchers<any>} The original Jest expect matcher for this value.
		 * @example
		 * makeSure(actualResultValue).turnsOut.toBe(expectedValue);
		 */
		get turnsOut() {
			return baseExpect;
		},
	};
}

// eslint-disable-next-line jest/no-export
module.exports = {
	groupTests, the, inThe, inside,
	defineTest, should,
	runBeforeEachTest,
	runAfterEachTest,
	runBeforeAllTests,
	runAfterAllTests,
	makeSure,
};
