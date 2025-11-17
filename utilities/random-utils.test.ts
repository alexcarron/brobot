import { makeSure } from "./jest/jest-utils";
import { getRandomNameUUID, getRandomNumericUUID, getRandomUnicodeUUID, getRandomUUID } from "./random-utils";

describe('random-utils', () => {
	describe('createRandomNumericUUID()', () => {
		it('creates a numeric UUID as a string', () => {
			const uuid = getRandomNumericUUID();
			expect(uuid).toMatch(/^\d+$/);
		});

		it('creates a different UUID each time it is called', () => {
			const uuid1 = getRandomNumericUUID();
			const uuid2 = getRandomNumericUUID();
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

	describe('getRandomName()', () => {
		it('returns a random name of at least 32 characters', () => {
			const name = getRandomNameUUID();
			makeSure(
				name.length >= 32
			).isTrue();
		});

		it('returns only letters', () => {
			const name = getRandomNameUUID();
			makeSure(
				/^[a-zA-Z]+$/.test(name)
			).isTrue();
		});

		it('always returns a unique name over 10,000 iterations', () => {
			const names = new Set<string>();
			for (let i = 0; i < 10000; i++) {
				names.add(getRandomNameUUID());
			}
			makeSure(names.size).is(10000);
		});
	});

	describe('getRandomUnicodeUUID()', () => {
		it('produces a string containing the requested number of code points (default 16)', () => {
			const string = getRandomUnicodeUUID();
			makeSure(string.length).is(16);
		});

		it('produces a different string each time it is called', () => {
			const string1 = getRandomUnicodeUUID();
			const string2 = getRandomUnicodeUUID();
			makeSure(string1).isNot(string2);
		});

		it('always returns a unique string over 10,000 iterations', () => {
			const strings = new Set<string>();
			for (let i = 0; i < 10000; i++) {
				strings.add(getRandomUnicodeUUID());
			}
			makeSure(strings.size).is(10000);
		});
	});
})