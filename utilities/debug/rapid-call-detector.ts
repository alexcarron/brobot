import { logWarning } from "../logging-utils";

/**
 * Wraps a function to have it detect when it is called repeatedly in rapid succession within a specified threshold, calling a callback function.
 * By default, the callback function logs a warning message to the console when the function is called multiple times less than 500ms apart.
 * @param originalFunction - The function to wrap.
 * @param options - Options for detecting rapid calls.
 * @param options.rapidCallsThreshold - Time threshold in milliseconds for detecting rapid repeated calls.
 * @param options.onRapidCall - Callback function executed when a rapid repeated call is detected.
 * @param options.isSameCall - Function to determine if two calls are considered the same, based on their arguments.
 * @returns  A wrapped function that behaves identically to the original, but triggers `onRapidCall` if called in rapid succession.
 * @example
 * const greet = withRapidCallDetector(
 * 	(name: string) => {
 * 	  console.log(`Hello, ${name}`);
 * 	  return `Hello, ${name}`;
 * 	},
 * 	{
 * 	  rapidCallsThreshold: 500,
 * 	  onRapidCall: () => console.warn("Rapid call detected!")
 * 	}
 * );
 */
export function withRapidCallDetector<
	Parameters extends unknown[],
	ReturnType,
>(
	originalFunction: (...args: Parameters) => ReturnType,

	options: {
		rapidCallsThreshold?: number,
		onRapidCall?: (parameters: {
			timeSinceLastCall: number,
			numConsecutiveCalls: number,
			currentArgs: Parameters,
			lastArgs: Parameters
		}) => any,
		isSameCall?: (lastArgs: Parameters, currentArgs: Parameters) => boolean,
	}
): (...args: Parameters) => ReturnType {

	const {
		rapidCallsThreshold = 500,
		onRapidCall = ({timeSinceLastCall, numConsecutiveCalls, currentArgs, lastArgs}) =>
			logWarning(`Rapid call detected. The last call was ${timeSinceLastCall}ms ago, and ${numConsecutiveCalls} calls have been made in rapid succession in total. Last call args: ${JSON.stringify(lastArgs)}, current call args: ${JSON.stringify(currentArgs)}`),
		isSameCall = () => true,

	} = options;

	let lastCallTime: number | null = null;
	let lastCallArgs: Parameters | null = null;
	let numConsecutiveCalls = 0;

	return (...currentArgs: Parameters) => {
		const now = Date.now();
		const timeSinceLastCall = lastCallTime !== null
			? now - lastCallTime
			: Infinity;


		if (
			lastCallTime !== null &&
			timeSinceLastCall < rapidCallsThreshold &&
			lastCallArgs !== null &&
			isSameCall(lastCallArgs, currentArgs)
		) {
			numConsecutiveCalls++;

			onRapidCall({
				timeSinceLastCall,
				numConsecutiveCalls,
				currentArgs,
				lastArgs: lastCallArgs
			});
		}
		else {
			numConsecutiveCalls = 1;
		}

		lastCallTime = now;
		lastCallArgs = currentArgs;

		return originalFunction(...currentArgs);
	}
}