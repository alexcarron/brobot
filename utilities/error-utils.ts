import { BooleanIfKnown, TypedNamedValue } from "./types/generic-types";

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
 *
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

type MaybePromise<Type> = Type | Promise<Type>;
type MaybeAsyncFunction<ReturnType> =
	(...args: any[]) => MaybePromise<ReturnType>;

/**
 * A class that represents an attempt to run a function and handle errors that occur.
 */
abstract class BaseAttempt<ReturnType> {
  private errorHandlers: {
    errorType: new (...args: any[]) => any;
    handleError: (error: any) => void | any | Promise<any>;
  }[] = [];
  protected isExecuted = false;
  protected returnValue?: ReturnType;

	onError<ErrorType extends Error = Error>(
		handleError: (error: Error) => any | Promise<any>
	): this;
	onError<ErrorType extends Error>(
		errorType: new (...args: any[]) => ErrorType,
		handleError: (error: ErrorType) => any | Promise<any>
	): this;

	/**
	 * Attaches an error handler for a specific error type to the current attempt chain.
	 * This handler will be executed if the function throws an error of the specified type.
	 *
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
		errorType: new (...args: any[]) => ErrorType
	) {
		return this.onError(errorType, () => {});
	}

  protected dispatchError(error: unknown, awaitErrorHandlers: true): Promise<void>;
  protected dispatchError(error: unknown, awaitErrorHandlers?: false): void;

  /**
   * Dispatches an error to the appropriate error handler in the current attempt chain.
   * If the error matches a specified error type, its corresponding handler is executed.
   * If `awaitErrorHandlers` is true, the handler is awaited.
   *
   * @param error - The error object that may be dispatched to a handler.
   * @param awaitErrorHandlers - Boolean indicating if the error handler should be awaited.
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
          return Promise.resolve(handleError(error))
            .then(possibleError => {
              if (possibleError instanceof Error)
								throw possibleError;
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
    }
		catch (error: any) {
			this.dispatchError(error, false);
    }
  }

  /**
   * Executes the function and returns the result if it hasn't been executed before, or just returns the result if it has been executed before.
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
    }
		catch (error: any) {
			await this.dispatchError(error, true);
    }
  }

  /**
   * Executes the function and returns the result if it hasn't been executed before, or just returns the result if it has been executed before.
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
 *
 * @example
 * // Asynchronous function
 * await attempt(waitSeconds(10))
 *   .onError((error) => {
 *     console.warn("The result is out of range.");
 *   })
 *   .execute();
 *
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
	function noArgsFunction() {
		return func(...args)
	}
	return new Attempt(noArgsFunction);
}