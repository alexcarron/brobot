import { randomBytes, randomFillSync } from 'node:crypto';
import { isUnicodeCodePoint } from './string-checks-utils';

const UINT32_MAX_PLUS_ONE = 0x100000000;
const globalBuffer = new Uint32Array(1);

/**
 * Creates a random numeric UUID as a string of base-10 digits to be used as a unique identifier.
 * @returns {string} A random numeric UUID
 * @example
 * const uuid = getRandomNumericUUID(); // e.g. "13484298014512289543"
 */
export const getRandomNumericUUID = () => {
	const buffer = randomBytes(8);
	const bigInt = BigInt('0x' + buffer.toString('hex'));
	return bigInt.toString();
}

/**
 * Creates a random UUID as a string of 32 hexadecimal digits to be used as a unique identifier.
 * @returns A random UUID
 * @example
 * const uuid = getRandomUUID(); // e.g. "a1a819b8356eae7a33d3f79d2f879e9d"
 */
export const getRandomUUID = () => {
	const buffer = randomBytes(16);
	return buffer.toString('hex');
}

/**
 * Generates a random integer between 0 (inclusive) and 2^32 - 1 (exclusive).
 * @returns A random integer between 0 and 2^32 - 1.
 */
export function getRandomInteger() {
	randomFillSync(globalBuffer);
  return globalBuffer[0]; // integer between 0 and 2^32 - 1
}

/**
 * Generates a random number between 0 (inclusive) and max (exclusive).
 * @param max The maximum value for the random number.
 * @returns A random number between 0 (inclusive) and max (exclusive)
 * @throws If max is not between 1 and Number.MAX_SAFE_INTEGER
 */
export const getRandomNumber = (
	max: number = Number.MAX_SAFE_INTEGER
) => {
  if (max <= 0 || max > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('max must be between 1 and Number.MAX_SAFE_INTEGER');
  }

  // Determine how many bytes are needed
  const bytesNeeded = Math.ceil(Math.log2(max) / 8);
  const maxValue = Math.pow(256, bytesNeeded);

  let number;
  do {
    const buffer = randomBytes(bytesNeeded);
    number = 0;
    for (let index = 0; index < bytesNeeded; index++) {
      number = (number << 8) + buffer[index];
    }
  }
	while (number >= maxValue - (maxValue % max));

  return number % max;
}

/**
 * Generates a non-zero random number from 0 to 1
 * @returns A random number between 0 and 1
 */
export function getRandomNonZero(): number {
  const integerArray = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(integerArray);
    value = integerArray[0];
  } while (value === 0);

  return value / UINT32_MAX_PLUS_ONE;
}

/**
 * Generates a random number from 0 to 1 including 0, excluding 1
 * @returns A random number between 0 and 1 (including 0, excluding 1)
 */
export function getRandom(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / UINT32_MAX_PLUS_ONE;
}

/**
 * Generate a random boolean with the probability of true being given
 * @param probabilityOfTrue - The probability of true being returned
 * @returns A random boolean
 */
export function getRandomBoolean(probabilityOfTrue: number = 0.5): boolean {
  if (!Number.isFinite(probabilityOfTrue) || probabilityOfTrue < 0 || probabilityOfTrue > 1) {
    throw new Error("p must be in [0,1]");
  }
  if (probabilityOfTrue === 0) return false;
  if (probabilityOfTrue === 1) return true;
  return getRandom() < probabilityOfTrue;
}

/**
 * Gets a random sample from an exponential distribution with the given expected value
 * @param expectedValue - The expected value of the exponential distribution
 * @returns A random sample
 */
export function getSampleFromExponentialDistribution(expectedValue: number): number {
  if (!Number.isFinite(expectedValue) || expectedValue <= 0)
		throw new Error(`The expected value of an exponential distribution must be finite and greater than 0 (got ${expectedValue})`);

  return -expectedValue * Math.log(getRandomNonZero());
}

/**
 * Gets a random sample from a heavy-tailed distribution (A Pareto distribution) with the given minimum value and rarity of larger values (shape parameter)
 * @param minimumValue - The minimum value of the distribution (xm)
 * @param rarityOfLargerValues - The rarity of larger values (alpha / shape parameter)
 * @returns A random sample
 */
export function getSampleFromHeavyTailedDistribution(minimumValue: number, rarityOfLargerValues: number): number {
  if (rarityOfLargerValues <= 0)
		throw new Error(`The rarity of larger values must be greater than 0 (got ${rarityOfLargerValues})`);

  return minimumValue / Math.pow(getRandomNonZero(), 1 / rarityOfLargerValues);
}

/**
 * Gets a random sample from a truncated heavy-tailed distribution (A Pareto distribution) with the given minimum value, maximum value, and rarity of larger values (shape parameter)
 * @param minimumValue - The minimum value of the distribution (xm)
 * @param maximumValue - The maximum value of the distribution (xmax)
 * @param rarityOfLargerValues - The rarity of larger values (alpha / shape parameter)
 * @returns A random sample
 */
export function getSampleFromTruncatedHeavyTailedDistribution(minimumValue: number, maximumValue: number, rarityOfLargerValues: number): number {
  if (rarityOfLargerValues <= 0)
		throw new Error(`The rarity of larger values must be greater than 0 (got ${rarityOfLargerValues})`);
  if (maximumValue <= minimumValue)
		throw new Error(`The maximum value must be greater than the minimum value (got ${maximumValue} <= ${minimumValue})`);

  const probabilityInTruncatedRange = 1 - Math.pow(minimumValue / maximumValue, rarityOfLargerValues);
  const randomNumInTruncatedRange = 1 - getRandom() * probabilityInTruncatedRange; // in ((xm/xmax)^alpha, 1]
  return minimumValue / Math.pow(randomNumInTruncatedRange, 1 / rarityOfLargerValues);
}

/**
 * Generates a random value based on the provided expected value overtime to maximize anticipation.
 * Can be optionally constrained by minimum and maximum bounds.
 * Chooses between an exponential distribution and a heavy-tailed (Pareto-like) distribution depending on the parameters.
 * @param options - Options object containing distribution parameters.
 * @param options.expectedValue - The expected value (mean) of the distribution. Must be > 0.
 * @param options.minimumValue - Optional minimum value (scale) for the heavy-tailed distribution. Must be finite.
 * @param options.maximumValue - Optional maximum value to truncate the distribution. Must be finite and greater than `minimumValue` if provided.
 * @returns A randomly generated value following the chosen distribution, respecting the specified bounds.
 * @example
 * // Generate a sample with expected value 10, no bounds
 * const sample = generateMaxAnticipationMagnitude({ expectedValue: 10 });
 * @example
 * // Generate a sample with expected value 10, minimum 5
 * const sample = generateMaxAnticipationMagnitude({ expectedValue: 10, minimumValue: 5 });
 * @example
 * // Generate a sample with expected value 10, minimum 5, maximum 20
 * const sample = generateMaxAnticipationMagnitude({ expectedValue: 10, minimumValue: 5, maximumValue: 20 });
 */
export function getAnticipatedRandomNum(
	{ expectedValue, minimumValue, maximumValue }: {
		expectedValue: number;
		minimumValue?: number;
		maximumValue?: number;
}): number {
  if (!Number.isFinite(expectedValue) || expectedValue <= 0) {
    throw new Error(`expectedValue must be finite and greater than 0 (got ${expectedValue})`);
  }
  if (minimumValue !== undefined && !Number.isFinite(minimumValue)) {
    throw new Error(`minimumValue must be finite (got ${minimumValue})`);
  }
  if (maximumValue !== undefined && !Number.isFinite(maximumValue)) {
    throw new Error(`maximumValue must be finite (got ${maximumValue})`);
  }
  if (minimumValue !== undefined && maximumValue !== undefined && maximumValue < minimumValue) {
    throw new Error(`maximumValue must be greater than minimumValue (got ${maximumValue} < ${minimumValue})`);
  }
  if (maximumValue !== undefined && (!Number.isFinite(maximumValue) || maximumValue <= 0)) {
    throw new Error(`maximumValue must be finite and greater than 0 if provided (got ${maximumValue})`);
  }

	if (minimumValue === undefined && maximumValue === undefined)
		return getSampleFromExponentialDistribution(expectedValue);

  if (minimumValue === undefined) {
		minimumValue = Math.min(expectedValue, 1e-12);
	}

	if (expectedValue <= minimumValue + 1e-12) {
		throw new Error(`expectedValue must be strictly greater than minimumValue for a Pareto mean (got expectedValue=${expectedValue}, minimumValue=${minimumValue})`);
	}

	if (Math.abs(minimumValue) < 1e-12) {
		return getSampleFromExponentialDistribution(expectedValue);
	}
	else {
		const rarityOfLargerNumbers = expectedValue / (expectedValue - minimumValue);
		if (rarityOfLargerNumbers <= 1) {
			throw new Error(`The expected value must be finite to get a Pareto distribution (got ${expectedValue})`);
		}

		if (maximumValue !== undefined) {
			if (maximumValue <= minimumValue) return minimumValue;
			return getSampleFromTruncatedHeavyTailedDistribution(minimumValue, maximumValue, rarityOfLargerNumbers);
		}
		else {
			return getSampleFromHeavyTailedDistribution(minimumValue, rarityOfLargerNumbers);
		}
	}
}

/**
 * Gets a random element from the given array.
 * @template ElementType
 * @param {ElementType[]} array - The array to get a random element from.
 * @returns {ElementType} A random element from the array.
 */
export function getRandomElement<ElementType>(array: ElementType[]): ElementType {
	const randomIndex = Math.floor(getRandom() * array.length);
	return array[randomIndex];
}

/**
 * Generates a random integer between the given min and max values.
 * @param min - The minimum value of the range to generate a random number from.
 * @param max - The maximum value of the range to generate a random number from.
 * @returns A random integer between min and max (inclusive).
 */
export function getBetween(min: number, max: number) {
  const range = max - min + 1;
  const randomInteger = getRandomInteger();
  return min + (randomInteger % range);
}

/**
 * Generates a random name, between 32 and 128 characters long.
 * The first letter is always uppercase.
 * @returns {string} A random name.
 */
export const getRandomNameUUID = () => {
	const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
	const NUM_LETTERS = 26;
	const MIN_LENGTH = 32;
	const MAX_LENGTH = 128;

	const length = getBetween(MIN_LENGTH, MAX_LENGTH);

  const name: string[] = new Array(length);
  const acceptLimit = 256 - (256 % NUM_LETTERS);
  let numFilledLetters = 0;

  while (numFilledLetters < length) {
    const chunkSize = Math.max(16, length - numFilledLetters);
    const buffer = randomBytes(chunkSize);
    for (
			let index = 0;
			index < buffer.length && numFilledLetters < length;
			index++
		) {
      const randomByte = buffer[index];
      if (randomByte < acceptLimit) {
        name[numFilledLetters] = LETTERS[randomByte % NUM_LETTERS];
				numFilledLetters += 1;
      }
    }
  }

  name[0] = name[0].toUpperCase();

	return name.join('');
}

/**
 * Generate a random Unicode string composed of `length` code points.
 * Each code point is drawn uniformly from valid Unicode code points (excluding surrogates & non-characters).
 * @param length Number of Unicode code points to produce. Default 16.
 * @returns A random Unicode string (may include emoji and other full-plane characters).
 */
export function getRandomUnicodeUUID(length: number = 8): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('length must be a positive integer');
  }

  const codepoints: number[] = [];
  let leftoverBuffer = Buffer.alloc(0);

  while (codepoints.length < length) {
    if (leftoverBuffer.length < 3) {
      const need = Math.max(
				32,
				(length - codepoints.length) * 3
			);

      leftoverBuffer = Buffer.concat([
				leftoverBuffer, randomBytes(need)
			]);
    }

    for (
			let index = 0;
			(
				index + 2 < leftoverBuffer.length &&
				codepoints.length < length
			);
			index += 3
		) {
      const codePoint =
				(leftoverBuffer[index] << 16) |
				(leftoverBuffer[index + 1] << 8) |
				leftoverBuffer[index + 2];

      if (codePoint <= 0x10FFFF && isUnicodeCodePoint(codePoint)) {
        codepoints.push(codePoint);
      }
			else {
        const mapped = codePoint % 0x110000;
        if (isUnicodeCodePoint(mapped)) {
          codepoints.push(mapped);
        }
      }
    }

    const consumedBytes = Math.floor(leftoverBuffer.length / 3) * 3;
    leftoverBuffer = leftoverBuffer.subarray(consumedBytes);
  }

  const parts: string[] = [];
  for (let index = 0; index < codepoints.length; index += 1024) {
    parts.push(
			String.fromCodePoint(
				...codepoints.slice(index, index + 1024)
			)
		);
  }
  return parts.join('');
}