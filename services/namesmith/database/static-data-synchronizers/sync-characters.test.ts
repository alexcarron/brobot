import { makeSure } from "../../../../utilities/jest/jest-utils";
import { createMockDB } from "../../mocks/mock-database";
import { CharacterRepository } from "../../repositories/character.repository";
import { getIDfromCharacterValue } from "../../utilities/character.utility";
import { DatabaseQuerier } from "../database-querier";
import { syncCharactersToDB } from "./sync-characters";

describe('sync-characters.ts', () => {
	let db: DatabaseQuerier;
	let characterRepository: CharacterRepository;

	beforeEach(() => {
		db = createMockDB();
		characterRepository = new CharacterRepository(db);
	});

	describe('syncCharactersToDB()', () => {
		it('should add new character defintions to the database', () => {
			syncCharactersToDB(db, [
				{
					value: '❌',
					rarity: 10,
				},
				{
					value: '✅',
					rarity: 14,
				}
			]);

			const characters = characterRepository.getCharacters();
			makeSure(characters).hasAnItemWhere(character =>
				character.value === '❌'
			);
			makeSure(characters).hasAnItemWhere(character =>
				character.value === '✅'
			);

			const newCharacter1 = characterRepository.getCharacterByValueOrThrow('❌');
			makeSure(newCharacter1).isNotNull();
			makeSure(newCharacter1!.rarity).is(10);

			const newCharacter2 = characterRepository.getCharacterByValueOrThrow('✅');
			makeSure(newCharacter2).isNotNull();
			makeSure(newCharacter2!.rarity).is(14);
		});

		it('should delete characters not defined in the static data', () => {
			syncCharactersToDB(db, [
				{
					value: '❌',
					rarity: 10,
				}
			]);

			const characters = characterRepository.getCharacters();
			makeSure(characters).hasLengthOf(1);
			makeSure(characters[0].value).is('❌');
		});
	});

	it('should update existing characters defined in the static data by ID', () => {
		syncCharactersToDB(db, [
			{
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 10,
			}
		]);

		syncCharactersToDB(db, [
			{
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 14,
			}
		]);

		const characters = characterRepository.getCharacters();

		makeSure(characters).hasLengthOf(1);
		makeSure(characters[0].value).is('❌');
		makeSure(characters[0].rarity).is(14);
	});

	it('should update existing characters defined in the static data by value only', () => {
		syncCharactersToDB(db, [
			{
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 10,
			}
		]);

		syncCharactersToDB(db, [
			{
				value: '❌',
				rarity: 14,
			}
		]);

		const characters = characterRepository.getCharacters();

		makeSure(characters).hasLengthOf(1);
		makeSure(characters[0].value).is('❌');
		makeSure(characters[0].rarity).is(14);
	});

	it('should delete, update, and add characters all at once', () => {
		syncCharactersToDB(db, [
			{
				id: getIDfromCharacterValue('❌'),
				value: '❌',
				rarity: 10,
			},
			{
				id: getIDfromCharacterValue('✅'),
				value: '✅',
				rarity: 14,
			},
			{
				value: '👍',
				rarity: 12,
			}
		]);

		syncCharactersToDB(db, [
			{
				id: getIDfromCharacterValue('✅'),
				value: '✅',
				rarity: 24,
			},
			{
				value: '👍',
				rarity: 22,
			},
			{
				value: '👎',
				rarity: 18,
			}
		]);

		const characters = characterRepository.getCharacters();
		makeSure(characters).hasLengthOf(3);
		makeSure(characters).hasNoItemWhere(character =>
			character.value === '❌'
		);
		makeSure(characters).hasAnItemWhere(character =>
			character.value === '✅' &&
			character.rarity === 24
		);
		makeSure(characters).hasAnItemWhere(character =>
			character.value === '👍' &&
			character.rarity === 22
		);
		makeSure(characters).hasAnItemWhere(character =>
			character.value === '👎' &&
			character.rarity === 18
		);
	});
});