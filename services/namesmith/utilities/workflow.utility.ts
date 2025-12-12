import { InvalidArgumentError } from "../../../utilities/error-utils";
import { IsFailureAssertion, SuccessOf } from "../workflows/workflow-result-creator";

/**
 * Throws an error if the given result is a failure result.
 * @param result - The workflow result to check.
 */
export function throwIfNotFailure<
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
  throwIfNotFailure(result);
  return result;
}