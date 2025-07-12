const { isCharacterOdds, isMysteryBox } = require("./mysteryBox.utility");

describe('mysteryBox.utility', () => {
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
				},
				{hasCharacterOdds: true}
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
				},
				{hasCharacterOdds: false}
			)).toBe(true);
		});

		it('should return false if the value is a mystery box object without characterOdds and hasCharacterOdds is true', () => {
			expect(isMysteryBox(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
				},
				{hasCharacterOdds: true}
			)).toBe(false);
		});
		it('should return false if the value is a mystery box object with incorrect characterOdds and hasCharacterOdds is true', () => {
			expect(isMysteryBox(
				{
					id: 1,
					name: "Mystery Box",
					tokenCost: 10,
					characterOdds: {
						A: "1",
						B: "2",
						C: "3"
					}
				},
				{hasCharacterOdds: true}
			)).toBe(false);
		});
	});
});