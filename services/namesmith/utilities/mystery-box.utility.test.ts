import { getMysteryBoxCharacterPreview, isCharacterOdds, isMysteryBox, isMysteryBoxWithOdds } from "./mystery-box.utility";

describe('mystery-box.utility', () => {
	describe('isCharacterOdds()', () => {
		it('should return true if the value is an object with character keys and number values', () => {
			expect(isCharacterOdds({
				'A': 1,
				'B': 2,
				'C': 3,
			})).toBe(true);
		});

		it('should return false if the value is undefined', () => {
			expect(isCharacterOdds(undefined)).toBe(false);
		});

		it('should return false if the value is null', () => {
			expect(isCharacterOdds(null)).toBe(false);
		});

		it('should return false if the value is a string', () => {
			expect(isCharacterOdds("A: 1")).toBe(false);
		});

		it('should return false if the value is an empty object', () => {
			expect(isCharacterOdds({})).toBe(false);
		});

		it('should return false if the value is an object with string values', () => {
			expect(isCharacterOdds({
				A: "1",
				B: "2",
				C: "3"
			})).toBe(false);
		});

		it('should return false if the value is an object with incosistent types', () => {
			expect(isCharacterOdds({
				A: 1,
				B: "2",
				C: 3
			})).toBe(false);
		});
	});

	describe('isMysteryBox()', () => {
		it('should return true if the value is a mystery box object', () => {
			expect(isMysteryBox({
				id: 1,
				name: "Mystery Box",
				tokenCost: 10,
			})).toBe(true);
		});

		it('should return false if the value has no id', () => {
			expect(isMysteryBox({
				name: "Mystery Box",
				tokenCost: 10,
			})).toBe(false);
		});

		it('should return false if the value has a string id', () => {
			expect(isMysteryBox({
				id: "1",
				name: "Mystery Box",
				tokenCost: 10,
			})).toBe(false);
		});

		it('should return false if the value has no name', () => {
			expect(isMysteryBox({
				id: 1,
				tokenCost: 10,
			})).toBe(false);
		});

		it('should return false if the value has a number name', () => {
			expect(isMysteryBox({
				id: 1,
				name: 1234,
				tokenCost: 10,
			})).toBe(false);
		});

		it('should return false if the value has no tokenCost', () => {
			expect(isMysteryBox({
				id: 10,
				name: "Mystery Box",
			})).toBe(false);
		});

		it('should return false if the value has a string tokenCost', () => {
			expect(isMysteryBox({
				id: 1,
				name: "Mystery Box",
				tokenCost: "10",
			})).toBe(false);
		});

		it('should return true if the value is a mystery box object with characterOdds', () => {
			expect(isMysteryBoxWithOdds(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
					characterOdds: {
						A: 1,
						B: 2,
						C: 3,
					}
				}
			)).toBe(true);
		});

		it('should return true if the value is a mystery box object with characterOdds and hasCharacterOdds is false', () => {
			expect(isMysteryBox(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
					characterOdds: {
						A: 1,
						B: 2,
						C: 3,
					}
				}
			)).toBe(true);
		});

		it('should return false if the value is a mystery box object without characterOdds and hasCharacterOdds is true', () => {
			expect(isMysteryBoxWithOdds(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
				}
			)).toBe(false);
		});
		it('should return false if the value is a mystery box object with incorrect characterOdds and hasCharacterOdds is true', () => {
			expect(isMysteryBoxWithOdds(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
					characterOdds: {
						A: "1",
						B: "2",
						C: "3"
					}
				}
			)).toBe(false);
		});
	});

	describe('getMysteryBoxCharacterPreview()', () => {
		it('should return every character with no ellipsis when they all fit within the max length', () => {
			expect(getMysteryBoxCharacterPreview({ a: 3, b: 1, c: 2 }, 10)).toBe('acb');
		});

		it('should order characters by descending odds', () => {
			expect(getMysteryBoxCharacterPreview({ a: 1, b: 3, c: 2 }, 10)).toBe('bca');
		});

		it('should let the final character use the full budget without reserving room for an ellipsis', () => {
			expect(getMysteryBoxCharacterPreview({ a: 2, b: 1 }, 2)).toBe('ab');
		});

		it('should truncate with a trailing ellipsis when the characters overflow the max length', () => {
			const preview = getMysteryBoxCharacterPreview({ a: 5, b: 4, c: 3, d: 2, e: 1 }, 3);
			expect(preview).toBe('ab…');
			expect(preview.length).toBeLessThanOrEqual(3);
			expect(preview.endsWith('…')).toBe(true);
		});

		it('should never split a multi-code-unit character when truncating', () => {
			const preview = getMysteryBoxCharacterPreview({ '🙂': 10, '😃': 9, '😄': 8 }, 3);
			expect(preview).toBe('🙂…');
			expect(preview.length).toBeLessThanOrEqual(3);
			// Splitting the surrogate pair would leave a lone-surrogate replacement artifact; iterating whole code points must round-trip cleanly.
			expect([...preview].join('')).toBe(preview);
		});
	});
});