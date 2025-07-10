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

	describe('.openBoxByID()', () => {
		it('should return a character from the mystery box with the given ID', async () => {
			const result = await mysteryBoxService.openBoxByID(1);
			expect(result).toHaveProperty('id', expect.any(Number));
			expect(result).toHaveProperty('value', expect.any(String));
			expect(result).toHaveProperty('rarity', expect.any(Number));
		});

		it('should throw an error if the mystery box with the given ID does not exist', async () => {
			await expect(mysteryBoxService.openBoxByID(-999)).rejects.toThrowError();
		});
	});
});