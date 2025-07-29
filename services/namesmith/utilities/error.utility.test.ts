import { attempt, HandledError } from "../../../utilities/error-utils";
import { makeSure } from "../../../utilities/jest-utils";
import { logWarning } from "../../../utilities/logging-utils";

describe('error.utility', () => {
	describe('attempt', () => {
		function successFunction(a: number, b: number) {
			return a + b;
		}

		function throwsRangeError() {
			throw new RangeError('Range error occurred');
		}

		function throwsTypeError() {
			throw new TypeError('Type error occurred');
		}

		function addsPositiveNumbers(a: any, b: any) {
			if (typeof a !== 'number' || typeof b !== 'number')
				throw new TypeError('Arguments must be numbers.');

			if (a < 0 || b < 0)
				throw new RangeError('Cannot add negative numbers.');

			return a + b;
		}

		it('returns the correct result when function succeeds', () => {
			const result = attempt(successFunction, 2, 3)
				.getReturnValue();

			makeSure(result).is(5);
		});

		it('handles callback function', () => {
			const result = attempt(() =>
				successFunction(2, 3)
			)
				.getReturnValue();

			makeSure(result).is(5);
		});

		it('throws error when function throws without error handler', async () => {
			makeSure(() => attempt(throwsRangeError).execute())
				.throwsAnError();
		});

		it('onError handles matching error type', () => {
			const mockHandler = jest.fn();
			attempt(throwsRangeError)
					.onError(RangeError, mockHandler)
					.getReturnValue();

			makeSure(mockHandler).hasBeenCalledOnce();
			makeSure(mockHandler).hasBeenCalledWith(expect.any(RangeError));
		});

		it('onError does not handle non-matching error type', () => {
				const mockHandler = jest.fn();

				try {
					attempt(throwsRangeError)
						.onError(TypeError, mockHandler)
						.getReturnValue();
				} catch (e) {
					expect(e).toBeInstanceOf(RangeError); // assert it's unhandled
				}

				expect(mockHandler).not.toHaveBeenCalled();
		});

		it('onError can be chained multiple times and only matching handlers run', () => {
			const rangeHandler = jest.fn();
			const typeHandler = jest.fn();

			attempt(throwsRangeError)
				.onError(TypeError, typeHandler)
				.onError(RangeError, rangeHandler)
				.onError(Error, () => {})
				.execute();

			makeSure(rangeHandler).hasBeenCalled(1);
			makeSure(typeHandler).hasNotBeenCalled();
		});

		it('does not call onError if no error was thrown', () => {
			const handler = jest.fn();

			attempt(successFunction, 1, 2)
				.onError(Error, handler)
				.execute();

			makeSure(handler).hasNotBeenCalled();
		});

		it('only returns result when calling getResult', () => {
			const sum =
				attempt(successFunction, 1, 2)
					.onError(Error, () => {})
					.getReturnValue();

			makeSure(sum).is(3);
		});

		describe('handles most complex use case', () => {
			const getResults = (callbackFunction: (...args: any[]) => undefined | number) => {
				let results: Partial<{ result: number, message: string }> =
					{ result: undefined, message: undefined };

				try {
					results.message = "Not Executed";

					const result = attempt(callbackFunction)
						.onError(RangeError, () => {
							console.log("Range error");
							results.message = "Range error";
							throw new HandledError(results.message);
						})
						.onError(TypeError, () => {
							console.log("Type error");
							results.message = "Type error";
							throw new HandledError(results.message);
						})
						.getReturnValue();

					console.log("Not Executed");

					results.result = result;
				}
				catch (error) {
					if (error instanceof HandledError) {
						logWarning(error.message);
					}
					else {
						throw error;
					}
				}

				return results;
			}

			it('on success', () => {
				const results = getResults(() => addsPositiveNumbers(1, 2));
				makeSure(results.result).is(3);
				makeSure(results.message).is("Not Executed");
			});

			it('on range error', () => {
				const results = getResults(() => addsPositiveNumbers(-1, 2));
				makeSure(results.result).isUndefined();
				makeSure(results.message).is("Range error");
			});

			it('on type error', () => {
				const results = getResults(() => addsPositiveNumbers("1", 2));
				makeSure(results.result).isUndefined();
				makeSure(results.message).is("Type error");
			});

			it('on unexpected error', () => {
				makeSure(() =>getResults(() => {
						addsPositiveNumbers(1, 2);
						throw new Error('Unexpected error');
					})
				).throwsAnError();
			});
		});
	});
});
