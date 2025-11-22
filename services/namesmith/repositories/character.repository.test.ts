import { CharacterAlreadyExistsError, CharacterNotFoundError } from "../utilities/error.utility";
import { CharacterRepository } from "./character.repository";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { getIDfromCharacterValue } from "../utilities/character.utility";
import { INVALID_CHARACTER_ID } from "../constants/test.constants";

describe('CharacterRepository', () => {
	let characterRepo: CharacterRepository;

	beforeEach(() => {
		characterRepo = CharacterRepository.asMock();
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
			const character = await characterRepo.getCharacterByValueOrThrow('A');
			expect(character).toHaveProperty('id', 65);
			expect(character).toHaveProperty('value', 'A');
			expect(character).toHaveProperty('rarity', expect.any(Number));
		});

		it('SHOULD throw CharacterNotFoundError if no character is found', () => {
			expect(() => characterRepo.getCharacterByValueOrThrow('❌')).toThrow(CharacterNotFoundError);
		});

		it('SHOULD throw an error if more than one character is given', () => {
			expect(() => characterRepo.getCharacterByValueOrThrow('AB')).toThrow();
		});
	});

	describe('doesCharacterExist()', () => {
		it('returns true if the character exists', () => {
			expect(characterRepo.doesCharacterExist(
				getIDfromCharacterValue('A')
			)).toBe(true);
		});

		it('returns false if the character does not exist', () => {
			expect(characterRepo.doesCharacterExist(
				INVALID_CHARACTER_ID
			)).toBe(false);
		});
	});

	describe('addCharacter()', () => {
		it('should add a character to the database', () => {
			const character  = characterRepo.addCharacter({ id: 1009, value: '❌', rarity: 1 });
			makeSure(character).is({
				id: 1009,
				value: '❌',
				rarity: 1
			})

			const resolvedCharacter = characterRepo.getCharacterByID(character.id);
			makeSure(resolvedCharacter).is({
				id: 1009,
				value: '❌',
				rarity: 1
			})
		});

		it('should generate an id if one is not provided', () => {
			const character = characterRepo.addCharacter({ value: '❌', rarity: 1 });
			makeSure(character).is({
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 1
			});

			const resolvedCharacter = characterRepo.getCharacterByID(character.id);
			makeSure(resolvedCharacter).is({
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 1
			})
		});

		it('should throw a CharacterAlreadyExistsError if the character already exists', () => {
			expect(() =>
				characterRepo.addCharacter({ id: 65, value: 'A', rarity: 1 })
			).toThrow(CharacterAlreadyExistsError);
		});
	});

	describe('updateCharacter()', () => {
		it('should update a character in the database', () => {
			const character = characterRepo.updateCharacter({
				id: 65, value: 'C', rarity: 10
			});
			makeSure(character).is({
				id: 65,
				value: 'C',
				rarity: 10
			});

			const resolvedCharacter = characterRepo.getCharacterByID(character.id);
			makeSure(resolvedCharacter).is({
				id: 65,
				value: 'C',
				rarity: 10
			})
		});

		it('should partially update a character in the database', () => {
			const character = characterRepo.updateCharacter({
				id: 65, rarity: 10
			});
			makeSure(character).is({
				id: 65,
				value: 'A',
				rarity: 10
			});

			const resolvedCharacter = characterRepo.getCharacterByID(character.id);
			makeSure(resolvedCharacter).is({
				id: 65,
				value: 'A',
				rarity: 10
			})
		});

		it('should throw a CharacterNotFoundError if the character does not exist', () => {
			expect(() =>
				characterRepo.updateCharacter({
					id: INVALID_CHARACTER_ID,
					value: 'A', rarity: 1
				})
			).toThrow(CharacterNotFoundError);
		});
	});

	describe('removeCharacter()', () => {
		it('should remove a character from the database', () => {
			characterRepo.removeCharacter(65);
			const character = characterRepo.getCharacterByID(65);
			makeSure(character).isNull();
		});

		it('should throw CharacterNotFoundError if no character is found', () => {
			makeSure(() => characterRepo.removeCharacter(0)).throws(CharacterNotFoundError);
		});
	});

	describe('removeCharacterByValue()', () => {
		it('should remove a character from the database', () => {
			characterRepo.removeCharacterByValue('A');
			const character = characterRepo.getCharacterByID(65);
			makeSure(character).isNull();
		});

		it('should throw CharacterNotFoundError if no character is found', () => {
			makeSure(() => characterRepo.removeCharacterByValue('❌')).throws(CharacterNotFoundError);
		});
	});
});