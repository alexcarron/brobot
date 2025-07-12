
const { createMockMysteryBoxRepo } = require('./mock-repositories');
const MysteryBoxRepository = require('./mysteryBox.repository');

describe('MysteryBoxRepository', () => {
	/**
	 * @type {MysteryBoxRepository}
	 */
	let mysteryBoxRepo;

	beforeEach(() => {
		mysteryBoxRepo = createMockMysteryBoxRepo();
	});

  describe('getMysteryBoxes', () => {
    it('returns a non-empty array', () => {
      const result = mysteryBoxRepo.getMysteryBoxes();
			expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('each mystery box object has the expected properties', () => {
      const result = mysteryBoxRepo.getMysteryBoxes();
      result.forEach((mysteryBox) => {
        expect(mysteryBox).toHaveProperty('id', expect.any(Number));
        expect(mysteryBox).toHaveProperty('name', expect.any(String));
        expect(mysteryBox).toHaveProperty('tokenCost', expect.any(Number));
      });
    });
  });

	describe('getMysteryBoxesWithOdds()', () => {
		it('returns a non-empty array', () => {
			const result = mysteryBoxRepo.getMysteryBoxesWithOdds();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('each mystery box object has the expected properties', () => {
			const result = mysteryBoxRepo.getMysteryBoxesWithOdds();
			result.forEach((mysteryBox) => {
				expect(mysteryBox).toHaveProperty('id', expect.any(Number));
				expect(mysteryBox).toHaveProperty('name', expect.any(String));
				expect(mysteryBox).toHaveProperty('tokenCost', expect.any(Number));
				expect(mysteryBox).toHaveProperty('characterOdds', expect.any(Object));
				expect(Object.keys(mysteryBox.characterOdds).length).toBeGreaterThan(0);
				expect(Object.keys(mysteryBox.characterOdds).every(key => typeof key === 'string')).toBe(true);
				expect(Object.values(mysteryBox.characterOdds).every(weight => weight > 0)).toBe(true);

			});
		});
	});

	describe('getMysteryBoxByID()', () => {
		it('returns a non-empty object', () => {
			const result = mysteryBoxRepo.getMysteryBoxByID(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
		});
	});

	describe('getMysteryBoxWithOdds()', () => {
		it('returns a non-empty object', () => {
			const result = mysteryBoxRepo.getMysteryBoxWithOdds(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
			expect(result).toHaveProperty('characterOdds', expect.any(Object));
			expect(Object.keys(result.characterOdds).length).toBeGreaterThan(0);
			expect(Object.values(result.characterOdds).every(weight => weight > 0)).toBe(true);
		});
	});
});