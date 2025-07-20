import { TypedNamedValue } from "../services/namesmith/types/generic-types";

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
class Attempt<ReturnType> {
  private func: MaybeAsyncFunction<ReturnType>;
  private errorHandlers: {
		errorType: new (...args: any[]) => any;
		handleError: (error: any) => void | any
	}[] = [];
  private isExecuted = false;
  private returnValue?: ReturnType;

  /**
   * Constructs a new Attempt object.
   * @param func - The function to run. May return a value synchronously or asynchronously.
   */
  constructor(func: MaybeAsyncFunction<ReturnType>) {
    this.func = func;
  }

	/**
	 * Attaches an error handler for a specific error type to the current attempt chain.
	 * This handler will be executed if the function throws an error of the specified type.
	 *
	 * @param errorType - The constructor of the error type to handle.
	 * @param handleError - A function that handles the error. It receives the error as an argument.
	 * @returns The current instance of the attempt chain to allow for method chaining.
	 * @throws When attempting to attach an error handler after the function has been executed.
	 */
  onError<E extends Error>(
    errorType: new (...args: any[]) => E,
    handleError: (err: E) => any
  ): this {
    if (this.isExecuted)
			throw new Error("Cannot attach onError after function has been executed.");

    this.errorHandlers.push({
			errorType,
			handleError
		});

    return this;
  }

  /**
   * Executes the function and executes the correct error handlers if an error is thrown.
   * If no error handlers are attached, the error is re-thrown.
   * If the function has already been executed, this does nothing.
   * @returns {Promise<void>}
   */
  async execute(): Promise<void> {
    this.isExecuted = true;

    try {
      this.returnValue = await this.func();
    }
		catch (error: any) {
      for (const { errorType, handleError } of this.errorHandlers) {
        if (error instanceof errorType) {
          const possibleError = handleError(error);

          if (possibleError instanceof Error)
						throw possibleError;

          return;
        }
      }
			
			throw error;
    }
  }

  /**
   * Executes the function and returns the result if it hasn't been executed before, or just returns the result if it has been executed before.
   * @returns {Promise<ReturnType>}
   */
  async getReturnValue(): Promise<ReturnType> {
    if (!this.isExecuted) await this.execute();
    return this.returnValue;
  }
}

/**
 * Creates an Attempt object from a function that may throw an error or return a value.
 * The created Attempt object allows you to handle errors that may be thrown by the function.
 * @example
 * const returnedValue = attempt(someFunction)
 * 	.onError(CustomError, (error) => {
 * 		// handle CustomError
 * 	})
 * 	.onError(QueryUsageError, (error) => {
 * 		// handle QueryUsageError
 * 	});
 * .getReturnValue();
 */
export function attempt<ReturnType>(func: MaybeAsyncFunction<ReturnType>, ...args: any[]): Attempt<ReturnType> {
	if (args.length > 0) {
		const originalFunc = func;
    func = () => originalFunc(...args);
	}

  return new Attempt(func);
}
