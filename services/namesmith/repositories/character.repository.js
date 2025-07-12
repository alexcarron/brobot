const DatabaseQuerier = require("../database/database-querier");
const { getIDfromCharacterValue } = require("../utilities/character.utility");

/**
 * Provides access to all static character data.
 */
class CharacterRepository {
	/**
	 * @type {DatabaseQuerier}
	 */
	db;

	/**
	 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
	 */
	constructor(db) {
		if (!(db instanceof DatabaseQuerier))
			throw new TypeError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		this.db = db;
	}

	/**
	 * Returns an array of all character objects.
	 * @returns {Array<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * }>} An array of character objects.
	 */
	getCharacters() {
		let query = `SELECT DISTINCT * FROM character`;
		const getAllCharacters = this.db.prepare(query);
		return getAllCharacters.all();
	}

	/**
	 * Returns an array of all character objects with a list of tags
	 * @returns {Array<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[]
	 * }>} An array of character objects with a list of tags
	 */
	getCharactersWithTags() {
		const query = `
			SELECT DISTINCT
				character.*,
				GROUP_CONCAT(characterTag.tag, ', ') AS tags
			FROM character
			LEFT JOIN characterTag ON character.id = characterTag.characterID
			GROUP BY character.id
		`;
		const getAllCharactersWithTags = this.db.prepare(query);
		const characters = getAllCharactersWithTags.all();
		return characters.map(character => {
			character.tags = character.tags.split(', ');
			return character;
		});
	}

	/**
	 * Gets a character from a character ID.
	 * @param {number} id - The ID of the character to retrieve.
	 * @returns {{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * } | undefined} The character with the given ID, or undefined if no such character exists.
	 */
	getCharacterByID(id) {
		const getCharacterByID = this.db.prepare(`SELECT * FROM character WHERE id = @id`);
		return getCharacterByID.get({ id });
	}

	/**
	 * Gets a character from its value.
	 * @param {string} value - The value of the character to retrieve.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * } | undefined>} The character with the given value, or undefined if no such character exists.
	 */
	async getCharacterByValue(value) {
		const id = getIDfromCharacterValue(value);
		return await this.getCharacterByID(id);
	}

	/**
	 * Gets a character from a character ID with its tags.
	 * @param {number} id - The ID of the character to retrieve.
	 * @returns {{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[]
	 * } | undefined} The character with the given ID and its tags, or undefined if no such character exists.
	 */
	getCharacterWithTags(id) {
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
		const character = getCharacterWithTags.get({ id });
		character.tags = character.tags.split(', ');
		return character;
	}
}

module.exports = CharacterRepository;