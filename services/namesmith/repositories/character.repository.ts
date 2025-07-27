import { InvalidArgumentError } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { Character, DBCharacter, DBCharacterWithTags, CharacterWithTags } from "../types/character.types";
import { getIDfromCharacterValue } from "../utilities/character.utility";
import { CharacterNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to all static character data.
 */
export class CharacterRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		if (!(db instanceof DatabaseQuerier))
			throw new InvalidArgumentError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		this.db = db;
	}

	/**
	 * Returns an array of all character objects.
	 * @returns An array of character objects.
	 */
	getCharacters(): Character[] {
		let query = `SELECT DISTINCT * FROM character`;
		const getAllCharacters = this.db.prepare(query);
		return getAllCharacters.all() as DBCharacter[];
	}

	/**
	 * Returns an array of all character objects with a list of tags
	 * @returns An array of character objects with a list of tags
	 */
	getCharactersWithTags(): CharacterWithTags[] {
		const query = `
			SELECT DISTINCT
				character.*,
				GROUP_CONCAT(characterTag.tag, ', ') AS tags
			FROM character
			LEFT JOIN characterTag ON character.id = characterTag.characterID
			GROUP BY character.id
		`;
		const getAllCharactersWithTags = this.db.prepare(query);
		const dbCharacters = getAllCharactersWithTags.all() as DBCharacterWithTags[];

		return dbCharacters.map(character => ({
			...character,
			tags: character.tags.split(', ')
		}));
	}

	/**
	 * Gets a character from a character ID.
	 * @param id - The ID of the character to retrieve.
	 * @returns The character with the given ID, or undefined if no such character exists.
	 */
	getCharacterByID(id: number): Character | undefined {
		const getCharacterByID = this.db.prepare(`SELECT * FROM character WHERE id = @id`);
		return getCharacterByID.get({ id }) as DBCharacter | undefined;
	}

	/**
	 * Gets a character from its value.
	 * @param value - The value of the character to retrieve.
	 * @returns The character with the given value, or undefined if no such character exists.
	 */
	getCharacterByValue(value: string): Character {
		const id = getIDfromCharacterValue(value);
		const character = this.getCharacterByID(id);
		if (character === undefined)
			throw new CharacterNotFoundError(id);

		return character;
	}

	/**
	 * Gets a character from a character ID with its tags.
	 * @param id - The ID of the character to retrieve.
	 * @returns The character with the given ID and its tags, or undefined if no such character exists.
	 */
	getCharacterWithTags(id: number): CharacterWithTags | undefined {
		const query = `
			SELECT
				character.*,
				GROUP_CONCAT(characterTag.tag, ', ') AS tags
			FROM character
			LEFT JOIN characterTag ON character.id = characterTag.characterID
			WHERE character.id = @id
			GROUP BY character.id
		`;
		const getCharacterWithTags = this.db.prepare(query);
		const character = getCharacterWithTags.get({ id })  as DBCharacterWithTags | undefined;

		if (character === undefined)
			return undefined;

		return {
			...character,
			tags: character.tags.split(', ')
		};
	}
}