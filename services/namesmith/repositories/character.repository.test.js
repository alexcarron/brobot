const CharacterRepository = require("./character.repository");
const { createMockCharacterRepo } = require("./mock-repositories");

describe('CharacterRepository', () => {
	/**
	 * @type {CharacterRepository}
	 */
	let characterRepo;

	beforeEach(() => {
		characterRepo = createMockCharacterRepo();
	})

	describe('getCharacters()', () => {
		it('SHOULD return an array of characters objects', async () => {
			const characters = await characterRepo.getCharacters();
			expect(Array.isArray(characters)).toBe(true);
			expect(characters.length).toBeGreaterThan(0);
			expect(characters[0]).toHaveProperty('id', expect.any(Number));
			expect(characters[0]).toHaveProperty('value', expect.any(String));
			expect(characters[0]).toHaveProperty('rarity', expect.any(Number));
			expect(characters[0]).not.toHaveProperty('tags');
		});
	});

	describe('getCharactersWithTags()', () => {
		it('SHOULD return an array of characters objects with tags', async () => {
			const characters = await characterRepo.getCharactersWithTags();
			expect(Array.isArray(characters)).toBe(true);
			expect(characters.length).toBeGreaterThan(0);
			expect(characters[0]).toHaveProperty('id', expect.any(Number));
			expect(characters[0]).toHaveProperty('value', expect.any(String));
			expect(characters[0]).toHaveProperty('rarity', expect.any(Number));
			expect(characters[0]).toHaveProperty('tags');
			expect(Array.isArray(characters[0].tags)).toBe(true);
			expect(characters[0].tags.length).toBeGreaterThan(0);
			expect(characters[0].tags).toEqual(expect.arrayContaining([expect.any(String)]));
		});
	});

	describe('getCharacterByID()', () => {
		it('SHOULD return a character object', async () => {
			const character = await characterRepo.getCharacterByID(65);
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('SHOULD return undefined if no character is found', async () => {
			const character = await characterRepo.getCharacterByID(0);
			expect(character).toBeUndefined();
		});
	});

	describe('getCharacterByValue()', () => {
		it('SHOULD return a character object', async () => {
			const character = await characterRepo.getCharacterByValue('A');
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('SHOULD return undefined if no character is found', async () => {
			const character = await characterRepo.getCharacterByValue('❌');
			expect(character).toBeUndefined();
		});

		it('SHOULD throw an error if no value is provided', async () => {
			await expect(characterRepo.getCharacterByValue()).rejects.toThrow();
		});

		it('SHOULD throw an error if more than one character is given', async () => {
			await expect(characterRepo.getCharacterByValue('AB')).rejects.toThrow();
		});
	});

	describe('getCharacterWithTags()', () => {
		it('SHOULD return a character object with tags', async () => {
			const character = await characterRepo.getCharacterWithTags(65);
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
			expect(character).toHaveProperty('tags');
			expect(Array.isArray(character.tags)).toBe(true);
			expect(character.tags.length).toBeGreaterThan(0);
			expect(character.tags).toEqual(expect.arrayContaining([expect.any(String)]));
		});
	})
});