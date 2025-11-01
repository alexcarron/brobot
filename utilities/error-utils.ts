import { TypedNamedValue } from "./types/generic-types";

/**
 * Base class for all custom errors defined in this project
 */
export class CustomError extends Error {
	/**
	 * The name of the error class
	 * @example
	 * "ResourceNotFoundError"
	 */
	name: string;

	/**
	 * The internal developer message that describes the error
	 * @example
	 * 'changeCurrentName: Player with ID "invalid-id" not found.'
	 */
  message: string;

	/**
	 * A message describing the error that is safe to show to users
	 * @example
	 * "The given name is already taken"
	 */
  userFriendlyMessage?: string;

	/**
	 * The error that caused this error
	 */
  errorCausedBy?: Error;

	/**
	 * Any additional information that is relevant to the error
	 * @example
	 * {
	 *   "id": "invalid-id"
	 * }
	 */
  relevantData?: Record<string, unknown>;


  constructor(message: string);
  constructor(options: {
    message: string,
    userFriendlyMessage?: string,
    errorCausedBy?: Error,
    relevantData?: Record<string, unknown>
  });

	constructor(
		messageOrOptions: string | {
			message: string,
			userFriendlyMessage?: string,
			errorCausedBy?: Error,
			relevantData?: Record<string, unknown>
		}
	) {
		const isParameterString = typeof messageOrOptions === "string";
		const message = isParameterString ? messageOrOptions : messageOrOptions.message;

		super(message);
		this.message = message;
		this.name = this.constructor.name;

    if (!isParameterString) {
			const options = messageOrOptions;
      this.userFriendlyMessage = options.userFriendlyMessage;
      this.errorCausedBy = options.errorCausedBy;
      this.relevantData = options.relevantData;
    }

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}

		Object.setPrototypeOf(this, new.target.prototype);
	}


	toJSON() {
		return {
			name: this.name,
			message: this.message,
			userFriendlyMessage: this.userFriendlyMessage,
			relevantData: this.relevantData,
			errorCausedBy: this.errorCausedBy?.toString()
		};
	}
}

/**
 * Error thrown when a given argument is invalid.
 */
export class InvalidArgumentError extends CustomError {}

/**
 * Error thrown when a given argument has an invalid type
 * @example
 * throw new InvalidArgumentTypeError({
 *   functionName: "insertCharactersToDB",
 *   argumentName: "characters",
 *   expectedType: "Array",
 *   actualValue: characters
 * });
 */
export class InvalidArgumentTypeError extends InvalidArgumentError {
	constructor({
		functionName,
		argumentName,
		expectedType,
		actualValue,
	}: {
		functionName: string,
		argumentName: string,
		expectedType: string,
		actualValue: any
	}) {
		super({
			message: `Invalid type passed to argument ${argumentName} in function ${functionName}. Expected ${expectedType}, received ${typeof actualValue} with value ${actualValue}.`,
			relevantData: {
				functionName,
				argumentName,
				expectedType,
				actualValue
			}
		});
	}
}

/**
 * Asserts that the given argument is of the correct type.
 * @param functionName Name of the function to which the argument is being passed.
 * @param argumentName Name of the argument.
 * @param expectedType String representing the type of the argument, or a class.
 * @param actualValue The value of the argument.
 */
export const assertCorrectArgumentType = (
	functionName: string,
	argumentName: string,
	expectedType: string | (new (...args: any[]) => any),
	actualValue: any
) => {
	let isValid = true;

	if (typeof expectedType === "string") {
		if (expectedType.trim().toLowerCase() === "array") {
			if (!Array.isArray(actualValue)) {
				isValid = false;
			}
		}
		else if (typeof actualValue !== expectedType) {
			isValid = false;
		}
	}
	else {
		if (!(actualValue instanceof expectedType)) {
			isValid = false;
		}
		expectedType = expectedType.name;
	}

	if (!isValid) {
		throw new InvalidArgumentTypeError({
			functionName,
			argumentName,
			expectedType,
			actualValue
		});
	}
};

/**
 * Validates all arguments in a function.
 * @param functionName Name of the function to which the arguments are being passed.
 * @param typedArguments Array of objects, where each object has a key-value pair of the argument name and its value and a key-value pair of "type" and the expected type of the argument.
 * @example
 * validateArguments("insertCharactersToDB",
 *   {id, type: "number"},
 *   {value, type: "string"},
 *   {rarity, type: "number"}
 * )
 */
export const validateArguments = (
	functionName: string,
	...typedArguments: TypedNamedValue[]
) => {
	for (const typedArgument of typedArguments) {
		const nonTypeKeys = Object.keys(typedArgument).filter(
			key => key !== "type"
		)

		if (nonTypeKeys.length !== 1) {
			throw new InvalidArgumentError(
				`validateArguments: typedArguments must have a single key-value pair that is not "type", but has ${nonTypeKeys.length} key-value pairs: ${JSON.stringify(typedArgument)}.`
			);
		}

		const argumentName = nonTypeKeys[0];

		assertCorrectArgumentType(
			functionName,
			argumentName,
			typedArgument.type,
			typedArgument[argumentName]
		);
	}
}

/**
 * Error thrown when something required for a particular operation to run is not initialized properly
 */
export class InitializationError extends CustomError {}

/**
 * Error thrown when an error is caught and handled
 */
export class HandledError extends CustomError {}

/**
 * A class that represents an attempt to run a function and handle errors that occur.
 */
abstract class BaseAttempt<ReturnType> {
  private errorHandlers: {
    errorType: new (...args: any[]) => any;
    handleError: (error: any) => void | any | Promise<any>;
  }[] = [];
	private successHandler?: (returnValue: ReturnType) => any | Promise<any>;
  protected isExecuted = false;
  protected returnValue?: ReturnType;

	onError<ErrorType extends Error = Error>(
		handleError: (error: ErrorType) => any | Promise<any>
	): this;
	onError<ErrorType extends Error>(
		errorType: new (...args: any[]) => ErrorType,
		handleError: (error: ErrorType) => any | Promise<any>
	): this;

	/**
	 * Attaches an error handler for a specific error type to the current attempt chain.
	 * This handler will be executed if the function throws an error of the specified type.
	 * @param errorTypeOrHandleError - The constructor of the error type to handle.
	 * @param maybeHandleError - A function that handles the error. It receives the error as an argument.
	 * @returns The current instance of the attempt chain to allow for method chaining.
	 * @throws When attempting to attach an error handler after the function has been executed.
	 */
  onError<ErrorType extends Error>(
    errorTypeOrHandleError:
			| (new (...args: any[]) => ErrorType)
			| ((error: Error) => any | Promise<any>),
    maybeHandleError?: (error: ErrorType) => any | Promise<any>
  ): this {
    if (this.isExecuted)
			throw new Error("Cannot attach onError after function has been executed.");

		let errorType: new (...args: any[]) => ErrorType;
    let handleError: (error: ErrorType) => any | Promise<any>;

		if (maybeHandleError !== undefined) {
			errorType = errorTypeOrHandleError as new (...args: any[]) => ErrorType;
			handleError = maybeHandleError;
		}
		else {
			errorType = Error as any;
			handleError = errorTypeOrHandleError as (error: Error) => any | Promise<any>;
		}

    this.errorHandlers.push({
			errorType,
			handleError
		});

    return this;
  }

	/**
	 * Ignores a given error type if the function throws it.
	 * @param errorType The error type to ignore.
	 * @returns The current instance of the attempt chain to allow for method chaining.
	 */
	ignoreError<ErrorType extends Error>(
		errorType?: new (...args: any[]) => ErrorType
	) {
		if (errorType === undefined)
			return this.onError(() => {});
		else
			return this.onError(errorType, () => {});
	}

	/**
	 * Attaches a success handler to the current attempt chain.
	 * This handler will be executed if the function does not throw an error.
	 * @param successHandler - A function that handles the return value of the function. It receives the return value as an argument.
	 * @returns The current instance of the attempt chain to allow for method chaining.
	 */
	onSuccess(
		successHandler: (returnValue: ReturnType) => any | Promise<any>
	): this {
		this.successHandler = successHandler;
		return this;
	}

  protected dispatchError(error: unknown, awaitErrorHandlers: true): Promise<void>;
  protected dispatchError(error: unknown, awaitErrorHandlers?: false): void;

	/**
	 * Dispatches an error to the appropriate error handler in the current attempt chain.
	 * If the error matches a specified error type, its corresponding handler is executed.
	 * If `awaitErrorHandlers` is true, the handler is awaited.
	 * @param error - The error object that may be dispatched to a handler.
	 * @param awaitErrorHandlers - Boolean indicating if the error handler should be awaited.
	 * @returns A Promise<void> if `awaitErrorHandlers` is true, otherwise void.
	 * @throws If no matching error handler is found, the error is re-thrown.
	 */
  protected dispatchError(
    error: unknown,
    awaitErrorHandlers = false
  ): void | Promise<void> {
		let wasHandled = false;

    for (const { errorType, handleError } of this.errorHandlers) {
      if (
				error instanceof errorType ||
				errorType === Error
			) {
				wasHandled = true;

        if (awaitErrorHandlers) {
          // eslint-disable-next-line promise/no-promise-in-callback
          return Promise.resolve(handleError(error))
            .then(possibleError => {
              if (possibleError instanceof Error)
								throw possibleError;

							return undefined;
            });
        }
				else {
          const possibleError = handleError(error);
          if (possibleError instanceof Error)
						throw possibleError;
        }

				return;
      }
    }

		if (!wasHandled) {
			throw error;
		}
  }

  /**
   * Dispatches a successful return value to any registered success handler.
   * @param returnedValue - The value returned by the function.
   */
	protected dispatchSuccess(returnedValue: ReturnType): void {
		if (this.successHandler) {
			this.successHandler(returnedValue);
		}
	}
}

/**
 * A class that represents an attempt to run a synchronous function and handle errors that occur.
 */
class Attempt<ReturnType> extends BaseAttempt<ReturnType> {
  private func: (...args: any[]) => ReturnType;

  /**
   * Constructs a new Attempt object.
   * @param func - The function to run.
   */
  constructor(func: (...args: any[]) => ReturnType) {
		super();
    this.func = func;
  }

  /**
   * Executes the function and executes the correct error handlers if an error is thrown.
   * If no error handlers are attached, the error is re-thrown.
   * If the function has already been executed, this does nothing.
   */
  execute(): void {
    this.isExecuted = true;

    try {
			this.returnValue = this.func();
			this.dispatchSuccess(this.returnValue);
    }
		catch (error: any) {
			this.dispatchError(error, false);
    }
  }

	/**
	 * Executes the function and returns the result if it hasn't been executed before, or just returns the result if it has been executed before.
	 * @returns The result of the function.
	 */
  getReturnValue(): ReturnType {
    if (!this.isExecuted) this.execute();
    return this.returnValue as ReturnType;
  }
}

/**
 * A class that represents an attempt to run an asynchronous function and handle errors that occur.
 */
class AsyncAttempt<ReturnType> extends BaseAttempt<ReturnType> {
  private func: (...args: any[]) => Promise<ReturnType>;

  /**
   * Constructs a new Attempt object.
   * @param func - The function to run.
   */
  constructor(func: (...args: any[]) => Promise<ReturnType>) {
		super();
    this.func = func;
  }

  /**
   * Executes the function and executes the correct error handlers if an error is thrown.
   * If no error handlers are attached, the error is re-thrown.
   * If the function has already been executed, this does nothing.
   */
  async execute(): Promise<void> {
    this.isExecuted = true;

    try {
			this.returnValue = await this.func();
			this.dispatchSuccess(this.returnValue);
    }
		catch (error: any) {
			await this.dispatchError(error, true);
    }
  }

	/**
	 * Executes the function and returns the result if it hasn't been executed before, or just returns the result if it has been executed before.
	 * @returns The result of the function.
	 */
  async getReturnValue(): Promise<ReturnType> {
    if (!this.isExecuted) await this.execute();
    return this.returnValue as ReturnType;
  }
}


export function attempt<ReturnType>(
	promise: Promise<ReturnType>
): AsyncAttempt<ReturnType>;
export function attempt<ReturnType>(
	func: (...args: any[]) => ReturnType,
	...args: any[]
): Attempt<ReturnType>;

/**
 * Creates an Attempt object from a synchronous or asynchronous function that may throw an error or return a value.
 * The created Attempt object allows you to handle errors that may be thrown by the function.
 * @param functionOrPromise - A function that may throw an error or return a value. If the function is asynchronous, it should return a Promise.
 * @param args - The arguments to pass to the function.
 * @returns An Attempt object that allows you to handle errors that may be thrown by the function.
 * @example
 * // Synchronous function
 * const sum = attempt(addNumbers, 1, 2)
 *   .onError(RangeError, (error) => {
 *     console.warn("The result is out of range.");
 *   })
 *   .onError(TypeError, (error) => {
 *     console.warn("The result is not a number.");
 *   })
 *   .getReturnValue();
 * @example
 * // Asynchronous function
 * await attempt(waitSeconds(10))
 *   .onError((error) => {
 *     console.warn("The result is out of range.");
 *   })
 *   .execute();
 * @example
 * // ❌ Invalid usage ❌
 * await attempt(asyncFunction)
 *   .onError(() => console.warn("There was an error"))
 *   .execute();
 */
export function attempt<ReturnType>(
	functionOrPromise:
		| Promise<ReturnType>
		| ((...args: any[]) => ReturnType),
	...args: any[]
): Attempt<ReturnType> | AsyncAttempt<ReturnType> {
	const isPromise = functionOrPromise instanceof Promise;

	if (isPromise) {
		const promise = functionOrPromise as Promise<ReturnType>;
		if (args.length !== 0)
			throw new InvalidArgumentError("attempt: asynchronous functions cannot have arguments.");

		return new AsyncAttempt(async () => await promise);
	}

	const func = functionOrPromise as (...args: any[]) => ReturnType;
		/**
		 * A wrapper function that calls the given function with the arguments given when attempt was called.
		 * This is used to create a new function that takes no arguments, so that the same Attempt class can
		 * be used for both synchronous and asynchronous functions.
		 * @returns The return value of the given function.
		 */
	function noArgsFunction() {
		return func(...args)
	}
	return new Attempt(noArgsFunction);
}

/**
 * Throws the given value if it is not an instance of the built-in Error class.
 * After calling this, the value is known to be an Error.
 * @param error - The value to check.
 * @throws {unknown} - Throws the value if it's not an Error.
 * @example
 * try {
 *   const money = praseInt(moneyInput)
 * }
 * catch (maybeError) {
 *   throwIfNotError(maybeError);
 *   const error: Error = error
 * }
 */
export function throwIfNotError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) throw error;
}

/**
 * Throws the given value if it is an instance of the built-in Error class.
 * After calling this, the value is known to not be an Error.
 * @param valueOrError - The value to check.
 * @throws {unknown} - Throws the value if it's an Error.
 * @example
 * const maybeMoney: number | Error = calculateMoney();
 * throwIfError(maybeMoney);
 * const money: number = maybeMoney;
 */
export function throwIfError<GivenType>(
	valueOrError: GivenType
): asserts valueOrError is Exclude<GivenType, Error> {
	if (valueOrError instanceof Error) throw valueOrError;
}



/**
 * Returns the given value if it is not an instance of the built-in Error class.
 * If the given value is an instance of the built-in Error class, it is thrown.
 * After calling this, the value is known to not be an Error.
 * @param valueOrError - The value to check.
 * @returns The given value if it is not an Error.
 * @throws {unknown} - Throws the value if it's an Error.
 * @example
 * const calculateMoney = () => {
 * 	if (Math.random() < 0.5) return new Error("Money not found.");
 * 	return 100;
 * };
 * const money: number = returnIfNotError(calculateMoney());
 */
export function returnIfNotError<GivenType>(
	valueOrError: GivenType
): Exclude<GivenType, Error> {
	if (valueOrError instanceof Error) throw valueOrError;
	return valueOrError as Exclude<GivenType, Error>;
}


/**
 * Returns the given value if it is not null. If the given value is null, it is thrown as an error.
 * @param value - The value to check.
 * @param errorToThrow - The error to throw if the value is null.
 * @returns The given value if it is not null.
 * @throws {Error} - Throws the value if it's null.
 * @example
 * const maybeMoney: number | null = calculateMoney();
 * const money: number = returnIfNotNull(maybeMoney); // throws if maybeMoney is null
 */
export function returnIfNotNull<GivenType, ErrorType extends Error>(
	value: GivenType,
	errorToThrow?: ErrorType
): Exclude<GivenType, null> {
	if (value === null) {
		if (errorToThrow === undefined)
			throw new Error("Expected value to not be null, but got null.");

		throw errorToThrow;
	}

	return value as Exclude<GivenType, null>;
}

export function hasFailed<ReturnType>(
	promise: Promise<ReturnType>
): Promise<boolean>;


export function hasFailed<ReturnType>(
	func: (...args: any[]) => ReturnType,
	...args: any[]
): boolean;

/**
 * Returns a boolean indicating whether the given function or promise has failed.
 * If the given argument is a promise, it will be resolved or rejected and the
 * result will be returned. If the given argument is a function, it will be
 * called with the given arguments and the result will be returned. If the
 * function throws, the result will be true. If the function does not throw, the
 * result will be false.
 * @param functionOrPromise - The function or promise to check.
 * @param args - The arguments to pass to the function, if the given argument is a function.
 * @returns A boolean indicating whether the given function or promise has failed.
 * @example
 * // Synchronous function
 * const result = hasFailed(addNumbers, 1, 2);
 * const result = hasFailed(() => addNumbers(1, 2)));
 * @example
 * // Asynchronous function
 * const result = await hasFailed(waitSeconds(10));
 */
export function hasFailed<ReturnType>(
	functionOrPromise:
		| Promise<ReturnType>
		| ((...args: any[]) => ReturnType),
	...args: any[]
) {
	const isPromise = functionOrPromise instanceof Promise;

	if (isPromise) {
		const promise = functionOrPromise as Promise<ReturnType>;
		if (args.length !== 0)
			throw new InvalidArgumentError("Asynchronous functions cannot have arguments.");

		return new Promise<boolean>((resolve) =>
			promise
				.then(() => resolve(false))
				.catch(() => resolve(true))
		);
	}

	const func = functionOrPromise as (...args: any[]) => ReturnType;

	try {
		func(...args);
		return false;
	}
	catch {
		return true;
	}
}

export function toNullOnError<ReturnType>(
	promise: Promise<ReturnType>
): Promise<ReturnType | null>;

export function toNullOnError<ReturnType>(
	func: (...args: any[]) => ReturnType,
	...args: any[]
): ReturnType | null;

/**
 * Runs a function or a promise and returns null if an error is thrown or encountered.
 * If the function or promise returns a value, that value is returned.
 * @param functionOrPromise - The function or promise to run.
 * @param args - The arguments to pass to the function if it is synchronous.
 * @returns The return value of the function or promise, or null if an error was thrown or encountered.
 */
export function toNullOnError<ReturnType>(
	functionOrPromise:
		| Promise<ReturnType>
		| ((...args: any[]) => ReturnType),
	...args: any[]
) {
	const isPromise = functionOrPromise instanceof Promise;

	if (isPromise) {
		const promise = functionOrPromise as Promise<ReturnType>;
		if (args.length !== 0)
			throw new InvalidArgumentError("Asynchronous functions cannot have arguments.");

		return new Promise<ReturnType | null>((resolve) =>
			promise
				.then((result) => resolve(result))
				.catch(() => resolve(null))
		);
	}

	const func = functionOrPromise as (...args: any[]) => ReturnType;

	try {
		return func(...args);
	}
	catch {
		return null;
	}
}

export function ignoreError(
	originalFunction: (...args: any[]) => any,
	...args: any[]
): void;

export function ignoreError(
	promise: Promise<any>
): Promise<void>;

/**
 * Runs a function or a promise whose return value is ignored and does nothing if an error is thrown or encountered.
 * If the function or promise returns a value, that value is ignored.
 * @param functionOrPromise - The function or promise to run.
 * @param args - The arguments to pass to the function if it is synchronous.
 * @returns A promise that resolves or rejects without doing anything.
 */
export function ignoreError(
	functionOrPromise:
		| Promise<any>
		| ((...args: any[]) => any),
	...args: any[]
) {
	const isPromise = functionOrPromise instanceof Promise;

	if (isPromise) {
		const promise = functionOrPromise as Promise<any>;
		if (args.length !== 0)
			throw new InvalidArgumentError("Asynchronous functions cannot have arguments.");

		return new Promise<void>((resolve) =>
			promise
				.then(() => resolve())
				.catch(() => resolve())
		);
	}

	const func = functionOrPromise as (...args: any[]) => any;

	try {
		func(...args);
	}
	catch {
		// Do nothing
	}
}

export function doOnError<ReturnType, ErrorType extends Error>(
	originalFunction: (...args: any[]) => ReturnType,
	errorType: new (...args: any[]) => ErrorType,
	handleError: (error: ErrorType) => any | Promise<any>,
): ReturnType;

export function doOnError<ReturnType, ErrorType extends Error>(
	promise: Promise<ReturnType>,
	errorType: new (...args: any[]) => ErrorType,
	handleError: (error: ErrorType) => any | Promise<any>,
): Promise<ReturnType>;

/**
 * Runs a function or a promise and if an error of the given type is thrown or encountered, it will be handled by the given handler.
 * If the function or promise returns a value, that value will be returned.
 * @param functionOrPromise - The function or promise to run.
 * @param errorType - The error type to handle.
 * @param handleError - A function that handles the error. It receives the error as an argument.
 * @returns A promise that resolves or rejects with the return value of the function or promise, or the result of the error handler if an error is thrown or encountered.
 */
export function doOnError<ReturnType, ErrorType extends Error>(
	functionOrPromise:
		| Promise<ReturnType>
		| ((...args: any[]) => ReturnType),
	errorType: new (...args: any[]) => ErrorType,
	handleError: (error: ErrorType) => any | Promise<any>,
) {
	const isPromise = functionOrPromise instanceof Promise;

	if (isPromise) {
		const promise = functionOrPromise as Promise<ReturnType>;

		return new Promise<ReturnType>((resolve, reject) =>
			promise
				.then((result) => resolve(result))
				.catch(async (error) => {
					if (error instanceof errorType) {
						const result = await handleError(error);
						resolve(result);
						return;
					}
					reject(error);
				})
		);
	}

	const func = functionOrPromise as (...args: any[]) => ReturnType;

	try {
		const result = func();
		if (result instanceof Promise) {
			return result.catch(async (error) => {
				if (error instanceof errorType)
					return await handleError(error);
				throw error;
			});
    }
    return result;
	}
	catch (error) {
		if (error instanceof errorType)
			handleError(error);

		throw error;
	}
}

/**
 * Throws a given error instead of the error that is thrown by the given function or promise.
 * @param functionOrPromise - The function or promise to check.
 * @param errorToThrowInstead - The error to throw instead of the error that is thrown by the given function or promise.
 * @returns A new promise that throws the given error instead of the error that is thrown by the given function or promise.
 * @example
 * const result = throwInsteadOnError(someAsyncFunction(), new TypeError('Error!'));
 */
export function throwInsteadOnError(
	functionOrPromise:
		| Promise<any>
		| ((...args: any[]) => any),
	errorToThrowInstead: Error
) {
	if (functionOrPromise instanceof Promise)
		return doOnError(functionOrPromise, Error, () => {
			throw errorToThrowInstead;
		});
	else
		return doOnError(functionOrPromise, Error, () => {
			throw errorToThrowInstead;
		});
}

/**
 * Throws an error if the given value is null.
 * @param unknownValue - The value to check.
 * @param error - The error to throw.
 */
export function throwIfNull<
	UnknownType,
	ErrorType extends Error
>(
	unknownValue: UnknownType,
	error?: ErrorType
): asserts unknownValue is Exclude<UnknownType, null> {
	if (unknownValue === null) {
		if (error === undefined) {
			throw new Error("Expected value to not be null, but got null.");
		}

		throw error;
	}
}
