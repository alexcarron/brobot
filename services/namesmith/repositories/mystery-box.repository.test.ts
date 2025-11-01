import { INVALID_MYSTERY_BOX_ID } from "../constants/test.constants";
import { MysteryBoxAlreadyExistsError, MysteryBoxNotFoundError } from "../utilities/error.utility";
import { createMockMysteryBoxRepo } from "../mocks/mock-repositories";
import { MysteryBoxRepository } from "./mystery-box.repository";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { MysteryBoxes } from "../constants/mystery-boxes.constants";

describe('MysteryBoxRepository', () => {
	let mysteryBoxRepo: MysteryBoxRepository;

	beforeEach(() => {
		mysteryBoxRepo = createMockMysteryBoxRepo();
	});

	describe('getMysteryBoxes()', () => {
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

	describe('getMysteryBox()', () => {
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

	describe('addMysteryBox()', () => {
		it('should add a new mystery box with the given properties', () => {
			const mysteryBoxDefinition = {
				id: 1001,
				name: 'Test Box',
				tokenCost: 50,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			const newMysteryBox = mysteryBoxRepo.addMysteryBox(mysteryBoxDefinition);
			makeSure(newMysteryBox).is(mysteryBoxDefinition);

			const resolvedMysteryBox = mysteryBoxRepo.getMysteryBox(newMysteryBox.id);
			makeSure(resolvedMysteryBox).is(newMysteryBox);
		});

		it('should generate a new ID if no ID is provided', () => {
			const mysteryBoxDefinition = {
				name: 'Test Box',
				tokenCost: 50,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			const newMysteryBox = mysteryBoxRepo.addMysteryBox(mysteryBoxDefinition);
			expect(newMysteryBox.id).toBeGreaterThan(0);

			const resolvedMysteryBox = mysteryBoxRepo.getMysteryBox(newMysteryBox.id);
			makeSure(resolvedMysteryBox).is(newMysteryBox);
		});

		it('should throw MysteryBoxAlreadyExistsError if the mystery box with the given ID already exists', () => {
			const mysteryBoxDefinition = {
				id: 1,
				name: 'Test Box',
				tokenCost: 50,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			makeSure(() =>
				mysteryBoxRepo.addMysteryBox(mysteryBoxDefinition)
			).throws(MysteryBoxAlreadyExistsError);
		});
	});

	describe('updateMysteryBox()', () => {
		it('should update the mystery box with the given properties', () => {
			const mysteryBoxDefinition = {
				id: 1,
				name: 'Test Box',
				tokenCost: 50,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			const updatedMysteryBox = mysteryBoxRepo.updateMysteryBox(mysteryBoxDefinition);
			makeSure(updatedMysteryBox).is(mysteryBoxDefinition);

			const resolvedMysteryBox = mysteryBoxRepo.getMysteryBox(updatedMysteryBox.id);
			makeSure(resolvedMysteryBox).is(updatedMysteryBox);
		});

		it('should handle only minimal updates', () => {
			const mysteryBoxDefinition = {
				id: 1,
				name: 'Test Box',
				tokenCost: 50
			}
			const updatedMysteryBox = mysteryBoxRepo.updateMysteryBox(mysteryBoxDefinition);
			makeSure(updatedMysteryBox).is({
				...mysteryBoxDefinition,
				characterOdds: MysteryBoxes.ALL_CHARACTERS.characterOdds
			});


			const resolvedMysteryBox = mysteryBoxRepo.getMysteryBox(updatedMysteryBox.id);
			makeSure(resolvedMysteryBox).is(updatedMysteryBox);
		});

		it('should handle only character odds updates', () => {
			const mysteryBoxDefinition = {
				id: 1,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			const updatedMysteryBox = mysteryBoxRepo.updateMysteryBox(mysteryBoxDefinition);
			makeSure(updatedMysteryBox).is({
				...mysteryBoxDefinition,
				name: MysteryBoxes.ALL_CHARACTERS.name,
				tokenCost: MysteryBoxes.ALL_CHARACTERS.tokenCost
			});


			const resolvedMysteryBox = mysteryBoxRepo.getMysteryBox(updatedMysteryBox.id);
			makeSure(resolvedMysteryBox).is(updatedMysteryBox);
		});

		it('should throw MysteryBoxNotFoundError if the mystery box with the given ID does not exist', () => {
			const mysteryBoxDefinition = {
				id: INVALID_MYSTERY_BOX_ID,
				name: 'Test Box',
				tokenCost: 50,
				characterOdds: {
					'A': 50,
					'B': 50
				}
			}
			makeSure(() =>
				mysteryBoxRepo.updateMysteryBox(mysteryBoxDefinition)
			).throws(MysteryBoxNotFoundError);
		});
	});

	describe('removeMysteryBox()', () => {
		it('should remove the mystery box with the given ID', () => {
			mysteryBoxRepo.removeMysteryBox(1);
			const result = mysteryBoxRepo.getMysteryBox(1);
			makeSure(result).isNull();
		});

		it('should throw an error if the mystery box with the given ID does not exist', () => {
			makeSure(() =>
				mysteryBoxRepo.removeMysteryBox(INVALID_MYSTERY_BOX_ID)
			).throws(MysteryBoxNotFoundError);
		});
	});
});