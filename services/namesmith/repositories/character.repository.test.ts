import { CharacterNotFoundError } from "../utilities/error.utility";
import { CharacterRepository } from "./character.repository";
import { createMockCharacterRepo } from "../mocks/mock-repositories";

describe('CharacterRepository', () => {
	let characterRepo: CharacterRepository;

	beforeEach(() => {
		characterRepo = createMockCharacterRepo();
	})

	describe('getCharacters()', () => {
		it('returns an array of characters objects', () => {
			const characters = characterRepo.getCharacters();
			expect(Array.isArray(characters)).toBe(true);
			expect(characters.length).toBeGreaterThan(0);
			expect(characters[0]).toHaveProperty('id', expect.any(Number));
			expect(characters[0]).toHaveProperty('value', expect.any(String));
			expect(characters[0]).toHaveProperty('rarity', expect.any(Number));
			expect(characters[0]).not.toHaveProperty('tags');
		});
	});

	describe('getCharacterByID()', () => {
		it('returns a character object', async () => {
			const character = await characterRepo.getCharacterByID(65);
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('returns null if no character is found', async () => {
			const character = await characterRepo.getCharacterByID(0);
			expect(character).toBeNull();
		});
	});

	describe('getCharacterByValue()', () => {
		it('returns a character object', async () => {
			const character = await characterRepo.getCharacterByValue('A');
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('SHOULD throw CharacterNotFoundError if no character is found', () => {
			expect(() => characterRepo.getCharacterByValue('❌')).toThrow(CharacterNotFoundError);
		});

		it('SHOULD throw an error if more than one character is given', () => {
			expect(() => characterRepo.getCharacterByValue('AB')).toThrow();
		});
	});
});