import { InvalidArgumentError } from "./error-utils";

/**
 * Repeats a function a given number of times.
 * @param numRepeats - The number of times to repeat the function.
 * @param functionToRepeat - The function to repeat.
 * @example
 * repeat(25, (index) => 
 *   console.log(`I've said this ${index} times`),
 * );
 */
export function repeat(
	numRepeats: number,
	functionToRepeat: (index: number) => void,
) {
	if (isNaN(numRepeats)) {
		throw new InvalidArgumentError('repeat() function expected numRepeats parameter to be a number, but it was not a number.');
	}
	else if (!isFinite(numRepeats)) {
		throw new InvalidArgumentError('repeat() function expected numRepeats parameter to be a finite number, but it was not a finite number.');
	}
	
	if (numRepeats <= 0) {
		return;
	}
	
	for (let index = 0; index < numRepeats; index++) {
		functionToRepeat(index);
	}
}