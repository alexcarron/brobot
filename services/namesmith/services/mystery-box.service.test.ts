import { INVALID_MYSTERY_BOX_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { CharacterRepository } from "../repositories/character.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { createMockMysteryBoxService } from "../mocks/mock-services";
import { MysteryBoxService } from "./mystery-box.service";
import { MysteryBox } from "../types/mystery-box.types";
import { addMockMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";

describe('MysteryBoxService', () => {
	let mysteryBoxService: MysteryBoxService;
	let db: DatabaseQuerier;

	let MOCK_MYSTERY_BOX: MysteryBox;

	beforeEach(() => {
		mysteryBoxService = createMockMysteryBoxService();
		db = mysteryBoxService.mysteryBoxRepository.db;

		MOCK_MYSTERY_BOX = mysteryBoxService.mysteryBoxRepository.getMysteryBoxesWithOdds()[0];
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create a new MysteryBoxService instance', () => {
			expect(mysteryBoxService).toBeInstanceOf(MysteryBoxService);
			expect(mysteryBoxService.mysteryBoxRepository).toBeInstanceOf(MysteryBoxRepository);
			expect(mysteryBoxService.characterRepository).toBeInstanceOf(CharacterRepository);
		});
	});

	describe('.resolveMysteryBox()', () => {
		it('should resolve a mystery box object to a mystery box object', () => {
			const resolvedMysteryBox = mysteryBoxService.resolveMysteryBox(MOCK_MYSTERY_BOX);
			expect(resolvedMysteryBox).toEqual(MOCK_MYSTERY_BOX);
		});

		it('should resolve a mystery box ID to a mystery box object', () => {
			const resolvedMysteryBox = mysteryBoxService.resolveMysteryBox(MOCK_MYSTERY_BOX.id);
			expect(resolvedMysteryBox).toEqual(MOCK_MYSTERY_BOX);
		});

		it('returns the current mystery box when given an outdated mystery box object', () => {
			const OUTDATED_MYSTERY_BOX = {...MOCK_MYSTERY_BOX, tokenCost: 999};
			const resolvedMysteryBox = mysteryBoxService.resolveMysteryBox(OUTDATED_MYSTERY_BOX);
			expect(resolvedMysteryBox).toEqual(MOCK_MYSTERY_BOX);
		});

		it('should throw an error if the mystery box with the given ID does not exist', () => {
			expect(() => mysteryBoxService.resolveMysteryBox(-999)).toThrow();
		});
	});

	describe('.openBox()', () => {
		it('should return a character from the mystery box with the given ID', () => {
			const result = mysteryBoxService.openBox(1);
			expect(result).toHaveProperty('id', expect.any(Number));
			expect(result).toHaveProperty('value', expect.any(String));
			expect(result).toHaveProperty('rarity', expect.any(Number));
		});

		it('should throw an error if the mystery box with the given ID does not exist', () => {
			expect(() => mysteryBoxService.openBox(-999)).toThrow();
		});
	});

	describe('getCost()', () => {
		it('should return the cost of the mystery box with the given mystery box object', () => {
			const mockMysteryBox = addMockMysteryBox(db, {
				tokenCost: 250
			});

			const result = mysteryBoxService.getCost(mockMysteryBox);
			expect(result).toBe(250);
		});

		it('should return the token cost of the mystery box with the given ID', () => {
			const result = mysteryBoxService.getCost(1);
			expect(result).toBe(25);
		});

		it('should throw an error if the mystery box with the given ID does not exist', () => {
			expect(() => mysteryBoxService.getCost(INVALID_MYSTERY_BOX_ID)).toThrow();
		});
	});
});