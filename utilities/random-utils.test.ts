import { makeSure } from "./jest/jest-utils";
import { createRandomNumericUUID, getRandomUUID } from "./random-utils";

describe('random-utils', () => {
	describe('createRandomNumericUUID()', () => {
		it('creates a numeric UUID as a string', () => {
			const uuid = createRandomNumericUUID();
			expect(uuid).toMatch(/^\d+$/);
		});

		it('creates a different UUID each time it is called', () => {
			const uuid1 = createRandomNumericUUID();
			const uuid2 = createRandomNumericUUID();
			makeSure(uuid1).isNot(uuid2);
		});
	});

	describe('createRandomUUID()', () => {
		it('creates a UUID as a string of 32 hexadecimal digits', () => {
			const uuid = getRandomUUID();
			expect(uuid).toMatch(/^[0-9a-f]{32}$/);
		});

		it('creates a different UUID each time it is called', () => {
			const uuid1 = getRandomUUID();
			const uuid2 = getRandomUUID();
			makeSure(uuid1).isNot(uuid2);
		});
	});
})