const { getRandomWeightedElement } = require("../../../utilities/data-structure-utils");
const CharacterRepository = require("../repositories/character.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");

/**
 * Provides methods for interacting with mystery boxes.
 */
class MysteryBoxService {
	/**
	 * Constructs a new MysteryBoxService instance.
	 * @param {MysteryBoxRepository} mysteryBoxRepository - The repository used for accessing mystery boxes.
	 * @param {CharacterRepository} characterRepository - The repository used for accessing characters.
	 */
	constructor(mysteryBoxRepository, characterRepository) {
		this.mysteryBoxRepository = mysteryBoxRepository;
		this.characterRepository = characterRepository;
	}

	/**
	 * Returns a character from the mystery box with the given ID. The character is chosen using the weighted random distribution of the mystery box.
	 * @param {number} mysteryBoxID - The ID of the mystery box from which to retrieve a character.
	 * @return {Promise<{
	 * 	id: number,
	 * 	value: string,
	 * 	rarity: number,
	 * }>} The character retrieved from the mystery box.
	 */
	async openBoxByID(mysteryBoxID) {
		const mysteryBox = await this.mysteryBoxRepository.getMysteryBoxWithOdds(mysteryBoxID);
		const characterOdds = mysteryBox.characterOdds;

		const characterValue = getRandomWeightedElement(characterOdds);
		return await this.characterRepository.getCharacterByValue(characterValue);
	}
}

module.exports = MysteryBoxService;