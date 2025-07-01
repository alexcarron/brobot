
const MysteryBoxRepository = require('./mysteryBox.repository');

describe('MysteryBoxRepository', () => {
  describe('getMysteryBoxes', () => {
    it('returns a non-empty array', async () => {
      const repository = new MysteryBoxRepository();
      const result = await repository.getMysteryBoxes();
			expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('each mystery box object has the expected properties', async () => {
      const repository = new MysteryBoxRepository();
      const result = await repository.getMysteryBoxes();
      result.forEach((mysteryBox) => {
        expect(mysteryBox).toHaveProperty('id', expect.any(Number));
        expect(mysteryBox).toHaveProperty('name', expect.any(String));
        expect(mysteryBox).toHaveProperty('tokenCost', expect.any(Number));
      });
    });
  });

	describe('getMysteryBoxesWithOdds()', () => {
		it('returns a non-empty array', async () => {
			const repository = new MysteryBoxRepository();
			const result = await repository.getMysteryBoxesWithOdds();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('each mystery box object has the expected properties', async () => {
			const repository = new MysteryBoxRepository();
			const result = await repository.getMysteryBoxesWithOdds();
			result.forEach((mysteryBox) => {
				expect(mysteryBox).toHaveProperty('id', expect.any(Number));
				expect(mysteryBox).toHaveProperty('name', expect.any(String));
				expect(mysteryBox).toHaveProperty('tokenCost', expect.any(Number));
				expect(mysteryBox).toHaveProperty('characterOdds', expect.any(Object));
				expect(Object.keys(mysteryBox.characterOdds).length).toBeGreaterThan(0);
				expect(Object.values(mysteryBox.characterOdds).every(weight => weight > 0)).toBe(true);

			});
		});
	});

	describe('getMysteryBoxByID()', () => {
		it('returns a non-empty object', async () => {
			const repository = new MysteryBoxRepository();
			const result = await repository.getMysteryBoxByID(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
		});
	});

	describe('getMysteryBoxWithOdds()', () => {
		it('returns a non-empty object', async () => {
			const repository = new MysteryBoxRepository();
			const result = await repository.getMysteryBoxWithOdds(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
			expect(result).toHaveProperty('characterOdds', expect.any(Object));
			expect(Object.keys(result.characterOdds).length).toBeGreaterThan(0);
			expect(Object.values(result.characterOdds).every(weight => weight > 0)).toBe(true);
		});
	});
});