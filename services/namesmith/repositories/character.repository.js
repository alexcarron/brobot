const { loadObjectFromJsonInGitHub } = require("../../../utilities/github-json-storage-utils");
const { getIDfromCharacterValue } = require("../utilities/character.utility");

/**
 * Provides access to all static character data.
 */
class CharacterRepository {
	static REPO_NAME = "namesmith-characters";
	characters = [];

	async load() {
		if (this.characters.length > 0) return;

		this.characters = await loadObjectFromJsonInGitHub(CharacterRepository.REPO_NAME);
	}

	async save() {
		await saveObjectToJsonInGitHub(
			this.characters,
			CharacterRepository.REPO_NAME
		);
	}

	/**
	 * Returns an array of all character objects.
	 * @returns {Promise<Array<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[]
	 * }>>} An array of objects, each containing character data.
	 */
	async getCharacters() {
		await this.load();
		return this.characters;
	}

	/**
	 * Gets a character from a character ID.
	 * @param {number} id - The ID of the character to retrieve.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[],
	 * } | undefined>} The character with the given ID, or undefined if no such character exists.
	 */
	async getCharacterByID(id) {
		const characters = await this.getCharacters();
		return characters.find(character => character.id === id);
	}

	/**
	 * Gets a character from its value.
	 * @param {string} value - The value of the character to retrieve.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * 	tags: string[],
	 * } | undefined>} The character with the given value, or undefined if no such character exists.
	 */
	async getCharacterByValue(value) {
		const characters = await this.getCharacters();
		return characters.find(character => character.value === value);
	}
}

module.exports = CharacterRepository;