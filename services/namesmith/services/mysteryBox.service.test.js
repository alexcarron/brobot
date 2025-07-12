const CharacterRepository = require("../repositories/character.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const { createMockMysteryBoxService } = require("./mock-services");
const MysteryBoxService = require("./mysteryBox.service");

describe('VoteService', () => {
	/**
	 * @type {MysteryBoxService}
	 */
	let mysteryBoxService;

	beforeEach(() => {
		mysteryBoxService = createMockMysteryBoxService();
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
		it('should resolve a mystery box object to a mystery box object', async () => {
			const mysteryBox = mysteryBoxService.mysteryBoxRepository.getMysteryBoxes()[0];

			const resolvedMysteryBox = await mysteryBoxService.resolveMysteryBox(mysteryBox);
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
		});

		it('should resolve a mystery box object to a mystery box object with characterOdds if hasCharacterOdds is true', async () => {
			const mysteryBox = mysteryBoxService.mysteryBoxRepository.getMysteryBoxesWithOdds()[0];

			const resolvedMysteryBox = await mysteryBoxService.resolveMysteryBox(mysteryBox, {hasCharacterOdds: true});
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('characterOdds', expect.any(Object));
			expect(Object.keys(resolvedMysteryBox.characterOdds).length).toBeGreaterThan(0);
		});

		it('should resolve a mystery box ID to a mystery box object', async () => {
			const resolvedMysteryBox = await mysteryBoxService.resolveMysteryBox(1);
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
		});

		it('should resolve a mystery box ID to a mystery box object with characterOdds if hasCharacterOdds is true', async () => {
			const resolvedMysteryBox = await mysteryBoxService.resolveMysteryBox(1, {hasCharacterOdds: true});
			expect(resolvedMysteryBox).toHaveProperty('id', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('name', expect.any(String));
			expect(resolvedMysteryBox).toHaveProperty('tokenCost', expect.any(Number));
			expect(resolvedMysteryBox).toHaveProperty('characterOdds', expect.any(Object));
			expect(Object.keys(resolvedMysteryBox.characterOdds).length).toBeGreaterThan(0);
		});

		it('should throw an error if the mystery box with the given ID does not exist', async () => {
			expect(() => mysteryBoxService.resolveMysteryBox(-999)).toThrow();
		})

		it('should throw an error if string given', async () => {
			expect(() => mysteryBoxService.resolveMysteryBox('string')).toThrow();
		})

		it('should throw an error if nothing given', async () => {
			expect(() => mysteryBoxService.resolveMysteryBox()).toThrow();
		})

		it('should throw an error if given mystery box without characterOdds and hasCharacterOdds is true', async () => {
			const mysteryBox = mysteryBoxService.mysteryBoxRepository.getMysteryBoxes()[0];

			delete mysteryBox.characterOdds;

			expect(() => mysteryBoxService.resolveMysteryBox(mysteryBox, {hasCharacterOdds: true})).toThrow();
		})
	});

	describe('.openBoxByID()', () => {
		it('should return a character from the mystery box with the given ID', async () => {
			const result = await mysteryBoxService.openBoxByID(1);
			expect(result).toHaveProperty('id', expect.any(Number));
			expect(result).toHaveProperty('value', expect.any(String));
			expect(result).toHaveProperty('rarity', expect.any(Number));
		});

		it('should throw an error if the mystery box with the given ID does not exist', async () => {
			await expect(() => mysteryBoxService.openBoxByID(-999)).rejects.toThrow();
		});
	});
});