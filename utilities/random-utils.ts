import { randomBytes } from 'node:crypto';

/**
 * Creates a random numeric UUID as a string of base-10 digits to be used as a unique identifier.
 * @returns {string} A random numeric UUID
 * @example
 * const uuid = createRandomNumericUUID(); // e.g. "13484298014512289543"
 */
export const createRandomNumericUUID = () => {
	const buffer = randomBytes(8);
	const bigInt = BigInt('0x' + buffer.toString('hex'));
	return bigInt.toString();
}

/**
 * Creates a random UUID as a string of 32 hexadecimal digits to be used as a unique identifier.
 * @returns {string} A random UUID
 * @example
 * const uuid = createRandomUUID(); // e.g. "a1a819b8356eae7a33d3f79d2f879e9d"
 */
export const createRandomUUID = () => {
	const buffer = randomBytes(16);
	return buffer.toString('hex');
}