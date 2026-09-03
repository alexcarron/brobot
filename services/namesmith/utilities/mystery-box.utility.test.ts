import { getMysteryBoxCharacterPreview } from "./mystery-box.utility";

describe('mystery-box.utility', () => {
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