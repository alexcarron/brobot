import { INVALID_MYSTERY_BOX_ID } from "../constants/test.constants";
import { MysteryBoxNotFoundError } from "../utilities/error.utility";
import { createMockMysteryBoxRepo } from "../mocks/mock-repositories";
import { MysteryBoxRepository } from "./mystery-box.repository";

describe('MysteryBoxRepository', () => {
	let mysteryBoxRepo: MysteryBoxRepository;

	beforeEach(() => {
		mysteryBoxRepo = createMockMysteryBoxRepo();
	});

  describe('getMysteryBoxes', () => {
    it('returns a non-empty array', () => {
      const result = mysteryBoxRepo.getMinimalMysteryBoxes();
			expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('each mystery box object has the expected properties', () => {
      const result = mysteryBoxRepo.getMinimalMysteryBoxes();
      result.forEach((mysteryBox) => {
        expect(mysteryBox).toHaveProperty('id', expect.any(Number));
        expect(mysteryBox).toHaveProperty('name', expect.any(String));
        expect(mysteryBox).toHaveProperty('tokenCost', expect.any(Number));
      });
    });
  });

	describe('getMysteryBoxesWithOdds()', () => {
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
				expect(mysteryBox).toHaveProperty('characterOdds', expect.any(Object));
				expect(Object.keys(mysteryBox.characterOdds).length).toBeGreaterThan(0);
				expect(Object.keys(mysteryBox.characterOdds).every(key => typeof key === 'string')).toBe(true);
				expect(
					Object.values(mysteryBox.characterOdds)
					.every(weight => weight > 0)
				).toBe(true);

			});
		});
	});

	describe('getMysteryBoxByID()', () => {
		it('returns a non-empty object', () => {
			const result = mysteryBoxRepo.getMinimalMysteryBoxByID(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
		});
	});

	describe('getMysteryBoxWithOdds()', () => {
		it('returns a non-empty object', () => {
			const result = mysteryBoxRepo.getMysteryBox(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', expect.any(String));
			expect(result).toHaveProperty('tokenCost', expect.any(Number));
			expect(result).toHaveProperty('characterOdds', expect.any(Object));

			const definedResult = result as NonNullable<typeof result>;

			expect(Object.keys(definedResult.characterOdds).length).toBeGreaterThan(0);
			expect(
				Object.values(definedResult.characterOdds)
				.every(weight => weight > 0)
			).toBe(true);
		});
	});

	describe('getTokenCost()', () => {
		it('should return the token cost of the mystery box with the given ID', () => {
			const result = mysteryBoxRepo.getTokenCost(1);
			expect(result).toBe(25);
		});

		it('should throw an error if the mystery box with the given ID does not exist', () => {
			expect(() => mysteryBoxRepo.getTokenCost(INVALID_MYSTERY_BOX_ID)).toThrow(MysteryBoxNotFoundError);
		});
	});
});