import { InvalidArgumentError } from "../../../utilities/error-utils";
import { capitalize } from "../../../utilities/string-manipulation-utils";

/**
 * A lack of relevant data included in a failure or success result.
 * @example
 * type FailuresToRelevantData = {
 *   userWasNotAPlayer: NoRelevantData,
 * };
 */
type NoRelevantData = void;

/**
 * The structure of relevant data included in a failure or success result if any.
 * @example
 * const missingCharactersData: RelevantData = {
 * 	missingCharacters: 'abc'
 * };
 */
type RelevantData =
	| Record<string, unknown>
	| NoRelevantData;

/**
 * The structure of a mapping of all failure types to their relevant data.
 * @example
 * const failuresToRelevantData: FailureToData = {
 *   userWasNotAPlayer: missingCharactersData
 * };
 */
type FailuresToData = Record<string, RelevantData>;

/**
 * A failure, which includes the failure type, and relevant data. The relevant data is retrieved using the mapping of all failure types to their relevant data.
 */
type BaseFailure<
	FailureType extends keyof AllFailuresToData,
	AllFailuresToData extends FailuresToData
> =
	& { failureType: FailureType }
	& (AllFailuresToData[FailureType] extends NoRelevantData
		? {}
		: AllFailuresToData[FailureType]);

type BaseSuccess<RelevantSuccessData extends RelevantData> = RelevantSuccessData;

/**
 * A guard method for checking if a result is a failure result.
 * @example
 * if (result.isFailure()) {
 *   console.log(result.failureType);
 * }
 */
type IsFailureAssertion = {
	isFailure(): this is { failureType: string };
};

/**
 * Guard methods type: for each failure key K produce isK(): this is FailureResult<...>
 * e.g. key "NonPlayerInitiatedTrade" -> method isNonPlayerInitiatedTrade()
 */
type FailureAssertions<
	AllFailuresToData extends FailuresToData
> =
	& {
		[FailureType in keyof AllFailuresToData as
			`is${Capitalize<FailureType & string>}`]:
				(this: unknown) =>
					this is { failureType: FailureType };
	}
	& IsFailureAssertion;

type Failure<
	FailureType extends keyof AllFailuresToData,
	AllFailuresToData extends FailuresToData,
> =
	& BaseFailure<FailureType, AllFailuresToData>
	& FailureAssertions<AllFailuresToData>;

type Success<
	RelevantSuccessData extends RelevantData,
	AllFailuresToData extends FailuresToData,
>	=
	& BaseSuccess<RelevantSuccessData>
	& FailureAssertions<AllFailuresToData>;


type WorkflowResultFactories<
	RelevantSuccessData extends RelevantData,
	AllFailuresToData extends FailuresToData,
> = {
	failure: {
		[FailureType in keyof AllFailuresToData]:
			AllFailuresToData[FailureType] extends NoRelevantData
				? () => Failure<FailureType, AllFailuresToData>
				: (relevantData: AllFailuresToData[FailureType]) =>
					Failure<FailureType, AllFailuresToData>
	};

  success(relevantData: RelevantSuccessData):
		Success<RelevantSuccessData, AllFailuresToData>;
};

/**
 * Returns an object that includes type-safe factories for producing workflow results with structured success and failure cases.
 * This factory provides:
 * - A `success` function to create success results with typed relevant data.
 * - A `failure` object containing functions for each failure type to create typed failure results.
 * - Guard methods `isX()` included on all created results to safely narrow the type and check which failure occurred.
 * @template ResultToRelevantData
 *   A mapping of all workflow failure types and 'Success' to their relevant data types.
 *   The key `'success'` represents the success type, other keys represent failure types.
 * @template FailureToRelevantData
 *   Derived type mapping only failure keys to their data.
 * @template RelevantSuccessData
 *   Derived type representing the shape of the success result data.
 * @param resultToRelevantData
 *   An object mapping all workflow result types to their relevant data, including 'success' and all failures.
 *   Use `provides<{ someField: SomeType }>()` for structured data, or `null` for empty failures.
 * @returns A factory object with `success()` and `failure` creators, each producing fully typed workflow results including guard methods.
 * @example
 * const create = getWorkflowResultCreator({
 *   success: provides<{ player: { name: string; id: number }; characters: string }>(), q
 *   nonPlayerInitiatedTrade: null,
 *   MissingCharacters: provides<{ missingCharacters: string }>(),
 * });
 *
 * const result = create.failure.MissingCharacters({ missingCharacters: 'abc' });
 * if (result.isMissingCharacters()) {
 *   console.log(result.missingCharacters); // Type-safe access
 * }
 */
export function getWorkflowResultCreator<
	ResultToRelevantData extends
		& Record<string, unknown>
		& { success?: RelevantData }
>(
	resultToRelevantData: ResultToRelevantData
): WorkflowResultFactories<
	ResultToRelevantData extends {
		success: infer RelevantSuccessData extends RelevantData
	}
		? RelevantSuccessData
		: NoRelevantData,
	{
		[FailureType in keyof ResultToRelevantData as
			FailureType extends 'success'
				? never
				: FailureType
		]:
			ResultToRelevantData[FailureType] extends RelevantData
				? ResultToRelevantData[FailureType]
				: NoRelevantData
	}
> {
	const failuresToRelevantData = { ...resultToRelevantData } as unknown as Record<string, unknown>;
	delete failuresToRelevantData.success;

	const failureAssertions: Record<string, unknown> = {};

	const failureTypes = Object.keys(failuresToRelevantData);

	for (const failureType of failureTypes) {
		const assertionMethodName = `is${capitalize(String(failureType))}`;

		Object.defineProperty(
			failureAssertions,
			assertionMethodName,
			{
				value: function (this: unknown) {
					return (
						typeof this === 'object' &&
						this !== null &&
						Object.prototype.hasOwnProperty.call(this, 'failureType') &&
						(this as any).failureType === failureType
					);
				},
				writable: false,
				enumerable: false,
				configurable: false,
			}
		);
	}

	// generic isFailure guard
	Object.defineProperty(failureAssertions, 'isFailure', {
		value: function (this: unknown) {
			return (
				typeof this === 'object' &&
				this !== null &&
				Object.prototype.hasOwnProperty.call(this, 'failureType')
			);
		},
		writable: false,
		enumerable: false,
		configurable: false,
	});

	Object.freeze(failureAssertions);

	/**
	 * Creates a failure object with the given failure types and relevant data.
	 * @template FailureType - The type of failure, which must be a key of FailureToRelevantData.
	 * @param failureType - The type of failure.
	 * @param relevantData - The relevant data for the failure.
	 * @returns A failure object with the given failure type and relevant data, and which also satisfies the FailureAssertions interface.
	 */
	function createFailure<
		FailureType extends string
	>(
		failureType: FailureType,
		relevantData: RelevantData
	) {
		const failureObject = Object.create(failureAssertions);

		Object.defineProperty(failureObject, 'failureType', {
			value: failureType,
			writable: false,
			enumerable: true,
			configurable: false
		})

		Object.assign(failureObject,
			relevantData ?? {}
		);

		Object.freeze(failureObject);

		return failureObject;
	}

	/**
	 * Creates a success object with the given relevant data.
	 * @param relevantData - The relevant data for the success result.
	 * @returns A success object with the given relevant data, and which also satisfies the FailureAssertions interface.
	 */
	function createSuccess(relevantData: RelevantData) {
		const successObject = Object.create(failureAssertions);

		Object.assign(successObject,
			relevantData ?? {}
		);

		Object.freeze(successObject);

		return successObject;
	}

	const failureCreators: any = {};
	for (const failureType of failureTypes) {
		failureCreators[failureType] =
			(relevantData?: RelevantData) =>
				createFailure(failureType, relevantData);
	}

	return {
		failure: failureCreators,
		success: createSuccess
	};
}

/**
 * Helper function for creating a typed object to define the structure relevant data for different workflow results.
 *
 * This function is primarily used when defining workflow success or failure types that may carry structured data. It allows TypeScript to infer and preserve the type of the data while returning an empty object at runtime.
 * @template RelevantData - The shape of the data to provide (defaults to an empty object `{}`).
 * @returns An empty object typed as `RelevantData`.
 * @example
 * const create = getWorkflowResultCreator({
 *  'success': provides<{
 *    player: Player,
 *    charactersReceived: string,
 *   }>();
 * });
 */
export function provides<RelevantData = {}>(): RelevantData {
  return {} as unknown as RelevantData;
}

export type FailuresOf<WorkflowResult> =
	Exclude<WorkflowResult, { failureType: never }>

export type SuccessOf<WorkflowResult> =
	Exclude<WorkflowResult, { failureType: string }>

/**
 * Throws an error if the given result is a failure result.
 * @param result - The workflow result to check.
 */
export function assertNotFailure<
  Result extends IsFailureAssertion
>(result: Result): asserts result is SuccessOf<Result> {
  if (result.isFailure()) {
		throw new InvalidArgumentError(
			`Expected success but got failure "${result.failureType}".`
		);

  }
}

/**
 * Throws an error if the given result is a failure result. Otherwise, returns the success result.
 * @param result - The workflow result to check.
 * @returns The success result if the given result is a success result, otherwise throws an error.
 */
export function returnIfNotFailure<
  Result extends IsFailureAssertion
>(result: Result): SuccessOf<Result> {
  assertNotFailure(result);
  return result;
}