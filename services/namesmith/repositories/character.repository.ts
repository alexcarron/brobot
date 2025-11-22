import { WithRequiredAndOneOther } from "../../../utilities/types/generic-types";
import { DatabaseQuerier, toParameterSetClause } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { Character, DBCharacter, CharacterID, CharacterDefintion } from "../types/character.types";
import { getIDfromCharacterValue } from "../utilities/character.utility";
import { CharacterAlreadyExistsError, CharacterNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to all static character data.
 */
export class CharacterRepository {

	constructor(
		public db: DatabaseQuerier,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new CharacterRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return CharacterRepository.fromDB(db);
	}

	/**
	 * Returns an array of all character objects.
	 * @returns An array of character objects.
	 */
	getCharacters(): Character[] {
		const query = 'SELECT * FROM character';
		return this.db.getRows(query) as DBCharacter[];
	}

	/**
	 * Gets a character from a character ID.
	 * @param id - The ID of the character to retrieve.
	 * @returns The character with the given ID, or null if no such character exists.
	 */
	getCharacterByID(id: number): Character | null {
		const character = this.db.getRow(
			'SELECT * FROM character WHERE id = ?', id
		) as DBCharacter | undefined;

		return character ?? null;
	}

	/**
	 * Gets a character from its value.
	 * @param value - The value of the character to retrieve.
	 * @returns The character with the given value
	 */
	getCharacterByValueOrThrow(value: string): Character {
		const id = getIDfromCharacterValue(value);
		const character = this.getCharacterByID(id);
		if (character === null)
			throw new CharacterNotFoundError(id);

		return character;
	}

	/**
	 * Retrieves a character from the database by its ID.
	 * If no character with the given ID is found, throws a CharacterNotFoundError.
	 * @param id - The ID of the character to retrieve.
	 * @returns The character with the given ID.
	 * @throws {CharacterNotFoundError} If no character with the given ID is found.
	 */
	getCharacterOrThrow(id: CharacterID): Character {
		const character = this.getCharacterByID(id);

		if (character === null)
			throw new CharacterNotFoundError(id);

		return character;
	}

	/**
	 * Checks if a character exists in the database by its ID.
	 * @param id - The ID of the character to check for.
	 * @returns True if the character exists, false otherwise.
	 */
	doesCharacterExist(id: CharacterID): boolean {
		return this.db.getValue(
			'SELECT 1 FROM character WHERE id = @id LIMIT 1',
			{ id }
		) === 1;
	}

	/**
	 * Adds a character to the database.
	 * If id is undefined, generates a new ID and inserts the character with the given value and rarity.
	 * If id is defined, inserts the character with the given value and rarity, and the specified ID.
	 * @param characterDefintion - The character to add to the database.
	 * @param characterDefintion.id - The ID of the character to add to the database.
	 * @param characterDefintion.value - The value of the character to add to the database.
	 * @param characterDefintion.rarity - The rarity of the character to add to the database.
	 * @returns The character that was added, with the generated ID if applicable.
	 */
	addCharacter({id, value, rarity}: CharacterDefintion): Character {
		if (id === undefined) {
			id = getIDfromCharacterValue(value);
		}

		if (this.doesCharacterExist(id)) {
			throw new CharacterAlreadyExistsError(id);
		}

		this.db.run(
			`INSERT INTO character (id, value, rarity)
			VALUES (@id, @value, @rarity)`,
			{ id, value, rarity }
		);

		return { id, value, rarity };
	}

	/**
	 * Updates a character in the database.
	 * @param characterDefintion - The character to update in the database.
	 * @param characterDefintion.id - The ID of the character to update in the database.
	 * @param characterDefintion.value - The value of the character to update in the database.
	 * @param characterDefintion.rarity - The rarity of the character to update in the database.
	 * @returns The updated character object.
	 * @throws {CharacterNotFoundError} If no character with the given ID is found.
	 */
	updateCharacter({ id, value, rarity }:
		WithRequiredAndOneOther<CharacterDefintion, 'id'>
	): Character {
		this.db.run(
			`UPDATE character
			SET ${toParameterSetClause({ value, rarity })}
			WHERE id = @id`,
			{ id, value, rarity }
		);

		return this.getCharacterOrThrow(id);
	}

	/**
	 * Removes a character from the database by its ID.
	 * If no character with the given ID is found, throws a CharacterNotFoundError.
	 * @param id - The ID of the character to remove.
	 * @throws {CharacterNotFoundError} If no character with the given ID is found.
	 */
	removeCharacter(id: CharacterID) {
		const result = this.db.run(`DELETE FROM character WHERE id = ?`, id);

		if (result.changes === 0)
			throw new CharacterNotFoundError(id);
	}

	/**
	 * Removes a character from the database by its value.
	 * If no character with the given value is found, throws a CharacterNotFoundError.
	 * @param value - The value of the character to remove.
	 * @throws {CharacterNotFoundError} If no character with the given value is found.
	 */
	removeCharacterByValue(value: string) {
		const id = getIDfromCharacterValue(value);
		this.removeCharacter(id);
	}
}