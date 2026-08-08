import { INVALID_MYSTERY_BOX_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { CharacterRepository } from "../repositories/character.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { MysteryBoxService } from "./mystery-box.service";
import { MinimalMysteryBox } from "../types/mystery-box.types";
import { addMockMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Player } from "../types/player.types";
import { makeSure } from "../../../utilities/jest/jest-utils";

describe('MysteryBoxService', () => {
	let mysteryBoxService: MysteryBoxService;
	let db: DatabaseQuerier;

	let MOCK_MYSTERY_BOX: MinimalMysteryBox;

	beforeEach(() => {
		mysteryBoxService = MysteryBoxService.asMock();
		db = mysteryBoxService.mysteryBoxRepository.db;

		MOCK_MYSTERY_BOX = mysteryBoxService.mysteryBoxRepository.getMysteryBoxes()[0];
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

	describe('getTokenCostOfCheapest()', () => {
		it('returns the token cost of the cheapest mystery box', () => {
			addMockMysteryBox(db, { tokenCost: 10 });
			addMockMysteryBox(db, { tokenCost: 500 });

			makeSure(mysteryBoxService.getTokenCostOfCheapest()).is(10);
		});
	});

	describe('canPlayerAffordCheapestMysteryBox()', () => {
		let SOME_PLAYER: Player;

		beforeEach(() => {
			const mysteryBoxes = mysteryBoxService.getMysteryBoxes();
			for (const mysteryBox of mysteryBoxes) {
				mysteryBoxService.mysteryBoxRepository.removeMysteryBox(mysteryBox.id);
			}
			addMockMysteryBox(db, { tokenCost: 100 });

			SOME_PLAYER = addMockPlayer(db, { tokens: 0 });
		});

		it('returns false when the player has fewer tokens than the cheapest mystery box costs', () => {
			mysteryBoxService.playerRepository.setTokens(SOME_PLAYER.id, 99);

			makeSure(mysteryBoxService.canPlayerAffordCheapestMysteryBox(SOME_PLAYER.id)).is(false);
		});

		it('returns true when the player has exactly enough tokens for the cheapest mystery box', () => {
			mysteryBoxService.playerRepository.setTokens(SOME_PLAYER.id, 100);

			makeSure(mysteryBoxService.canPlayerAffordCheapestMysteryBox(SOME_PLAYER.id)).is(true);
		});

		it('returns true when the player has more than enough tokens', () => {
			mysteryBoxService.playerRepository.setTokens(SOME_PLAYER.id, 1000);

			makeSure(mysteryBoxService.canPlayerAffordCheapestMysteryBox(SOME_PLAYER.id)).is(true);
		});
	});
});