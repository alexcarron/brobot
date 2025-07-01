const getDatabase = require("../database/get-database");
const { getIDfromCharacterValue } = require("../utilities/character.utility");
const db = getDatabase();

/**
 * Provides access to all static character data.
 */
class CharacterRepository {
	/**
	 * Returns an array of all character objects.
	 * @returns {Promise<Array<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * }>>} An array of character objects.
	 */
	async getCharacters() {
		let query = `SELECT DISTINCT * FROM character`;
		const getAllCharacters = db.prepare(query);
		return getAllCharacters.all();
	}

	/**
	 * Returns an array of all character objects with a list of tags
	 * @returns {Promise<Array<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[]
	 * }>>} An array of character objects with a list of tags
	 */
	async getCharactersWithTags() {
		const query = `
			SELECT DISTINCT
				character.*,
				GROUP_CONCAT(characterTag.tag, ', ') AS tags
			FROM character
			LEFT JOIN characterTag ON character.id = characterTag.characterID
			GROUP BY character.id
		`;
		const getAllCharactersWithTags = db.prepare(query);
		const characters = getAllCharactersWithTags.all();
		return characters.map(character => {
			character.tags = character.tags.split(', ');
			return character;
		});
	}

	/**
	 * Gets a character from a character ID.
	 * @param {number} id - The ID of the character to retrieve.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * } | undefined>} The character with the given ID, or undefined if no such character exists.
	 */
	async getCharacterByID(id) {
		const getCharacterByID = db.prepare(`SELECT * FROM character WHERE id = @id`);
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
}

module.exports = CharacterRepository;