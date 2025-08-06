import { makeSure } from "./jest-utils";
import { createRandomNumericUUID } from "./random-utils";

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
	})
})