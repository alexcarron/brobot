import { INVALID_MYSTERY_BOX_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockMysteryBox } from "../database/mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { createMockMysteryBoxService } from "./mock-services";
import { MysteryBoxService } from "./mystery-box.service";

describe('VoteService', () => {
	let mysteryBoxService: MysteryBoxService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		mysteryBoxService = createMockMysteryBoxService();
		db = mysteryBoxService.mysteryBoxRepository.db;
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
			const mysteryBox = mysteryBoxService.mysteryBoxRepository.getMysteryBoxes()[0];

			const resolvedMysteryBox = mysteryBoxService.resolveMysteryBox(mysteryBox);
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
		});

		it('should resolve a mystery box ID to a mystery box object', () => {
			const resolvedMysteryBox = mysteryBoxService.resolveMysteryBox(1);
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
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