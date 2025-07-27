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

			it('returns the correct result when function succeeds', async () => {
				const result = await attempt(successFunction, 2, 3)
					.getReturnValue();

				makeSure(result).is(5);
			});

			it('handles callback function', async () => {
				const result = await attempt(() =>
					successFunction(2, 3)
				)
					.getReturnValue();

				makeSure(result).is(5);
			});

			it('throws error when function throws without error handler', async () => {
				makeSure(attempt(throwsRangeError).execute())
					.eventuallyThrowsAnError();
			});

			it('onError handles matching error type', async () => {
				const mockHandler = jest.fn();
				const result =
					await attempt(throwsRangeError)
						.onError(RangeError, mockHandler)
						.getReturnValue();

				makeSure(mockHandler).hasBeenCalledOnce();
				makeSure(mockHandler).hasBeenCalledWith(expect.any(RangeError));
			});

			it('onError does not handle non-matching error type', async () => {
				  const mockHandler = jest.fn();

					try {
						await attempt(throwsRangeError)
							.onError(TypeError, mockHandler)
							.getReturnValue();
					} catch (e) {
						expect(e).toBeInstanceOf(RangeError); // assert it's unhandled
					}

					expect(mockHandler).not.toHaveBeenCalled();
			});

			it('onError can be chained multiple times and only matching handlers run', async () => {
				const rangeHandler = jest.fn();
				const typeHandler = jest.fn();

				await attempt(throwsRangeError)
					.onError(TypeError, typeHandler)
					.onError(RangeError, rangeHandler)
					.onError(Error, () => {})
					.execute();

				makeSure(rangeHandler).hasBeenCalled(1);
				makeSure(typeHandler).hasNotBeenCalled();
			});

			it('does not call onError if no error was thrown', async () => {
				const handler = jest.fn();

				await attempt(successFunction, 1, 2)
					.onError(Error, handler)
					.execute();

				makeSure(handler).hasNotBeenCalled();
			});

			it('only returns result when calling getResult', async () => {
				const sum =
					await attempt(successFunction, 1, 2)
						.onError(Error, () => {})
						.getReturnValue();

				makeSure(sum).is(3);
			});

			describe('handles most complex use case', () => {
				const getResults = async (callbackFunction: (...args: any[]) => undefined | number) => {
					let results: Partial<{ result: number, message: string }> =
						{ result: undefined, message: undefined };

					try {
						results.message = "Not Executed";

						const result = await attempt(callbackFunction)
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

				it('on success', async () => {
					const results = await getResults(() => addsPositiveNumbers(1, 2));
					makeSure(results.result).is(3);
					makeSure(results.message).is("Not Executed");
				});

				it('on range error', async () => {
					const results = await getResults(() => addsPositiveNumbers(-1, 2));
					makeSure(results.result).isUndefined();
					makeSure(results.message).is("Range error");
				});

				it('on type error', async () => {
					const results = await getResults(() => addsPositiveNumbers("1", 2));
					makeSure(results.result).isUndefined();
					makeSure(results.message).is("Type error");
				});

				it('on unexpected error', async () => {
					makeSure(getResults(() => {
							addsPositiveNumbers(1, 2);
							throw new Error('Unexpected error');
						})
					).eventuallyThrowsAnError();
				});
			});
		});
	});
