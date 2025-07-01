const CharacterRepository = require("./character.repository");

describe('CharacterRepository', () => {
	const characterRepo = new CharacterRepository();

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
			console.log(characters);
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
			await expect(characterRepo.getCharacterByValue()).rejects.toThrowError();
		});

		it('SHOULD throw an error if more than one character is given', async () => {
			await expect(characterRepo.getCharacterByValue('AB')).rejects.toThrowError();
		});
	});
});