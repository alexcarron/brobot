import { INVALID_CHARACTER_ID } from "../constants/test.constants";
import { createMockCharacterService } from "../mocks/mock-services";
import { Character, CharacterID, CharacterValue } from "../types/character.types";
import { CharacterNotFoundError } from "../utilities/error.utility";
import { CharacterService } from "./character.service";

describe('CharacterService', () => {
	let CHARACTER_A: Character;
	let CHARACTER_A_ID: CharacterID;
	let CHARACTER_A_VALUE: CharacterValue;

	let characterService: CharacterService;

	beforeEach(() => {
		characterService = createMockCharacterService();

		CHARACTER_A = characterService.characterRepository.getCharacterByValueOrThrow('A');
		CHARACTER_A_ID = CHARACTER_A.id;
		CHARACTER_A_VALUE = CHARACTER_A.value;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('resolveCharacter()', () => {
		it('returns a character when given a character object', () => {
			const result = characterService.resolveCharacter(CHARACTER_A);
			expect(result).toEqual(CHARACTER_A);
		});

		it('returns a character when given a character ID', () => {
			const result = characterService.resolveCharacter(CHARACTER_A_ID);
			expect(result).toEqual(CHARACTER_A);
		});

		it('returns a character when given a character value', () => {
			const result = characterService.resolveCharacter(CHARACTER_A_VALUE);
			expect(result).toEqual(CHARACTER_A);
		});

		it('returns the most current character object when given an outdated character object', () => {
			const OUTDATED_CHARACTER_A = {...CHARACTER_A, value: "OUTDATED"};

			const result = characterService.resolveCharacter(OUTDATED_CHARACTER_A);
			expect(result).toEqual(CHARACTER_A);
		});

		it('throws a CharacterNotFoundError when given an invalid character ID', () => {
			expect(() =>
				characterService.resolveCharacter(INVALID_CHARACTER_ID)
			).toThrow(CharacterNotFoundError);
		});
	});
})