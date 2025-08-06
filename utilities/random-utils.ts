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