const { getRandomWeightedElement } = require("../../../utilities/data-structure-utils");
const CharacterRepository = require("../repositories/character.repository");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const { isMysteryBox } = require("../utilities/mysteryBox.utility");

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
	 * Resolves a mystery box resolvable to a mystery box object.
	 * A mystery box resolvable is either a mystery box object or a number representing the ID of the mystery box.
	 * @param {number | {
	 * 	id: number,
	 * 	name: string,
	 * 	tokenCost: number,
	 * 	characterOdds?: Record<string, number>
	 * }} mysteryBoxResolvable - The mystery box resolvable to resolve.
	 * @param {object} [options] - Options for resolving the mystery box resolvable.
	 * @param {boolean} [options.hasCharacterOdds] - Whether the resolved mystery box should have character odds.
	 * @returns {Promise<{
	 * 	id: number,
	 * 	name: string,
	 * 	tokenCost: number,
	 * 	characterOdds?: Record<string, number>
	 * }>} A promise that resolves with the resolved mystery box object.
	 * @throws {Error} If the mystery box resolvable is invalid.
	 */
	resolveMysteryBox(mysteryBoxResolvable, {hasCharacterOdds = false} = {}) {
		if (isMysteryBox(mysteryBoxResolvable, {hasCharacterOdds})) {
			const mysteryBox = mysteryBoxResolvable;
			return mysteryBox;
		}
		else if (typeof mysteryBoxResolvable === 'number') {
			const id = mysteryBoxResolvable;
			let mysteryBox = undefined;

			if (hasCharacterOdds)
				mysteryBox = this.mysteryBoxRepository.getMysteryBoxWithOdds(id);
			else
				mysteryBox = this.mysteryBoxRepository.getMysteryBoxByID(id);

			if (mysteryBox === undefined)
				throw new Error(`resolveMysteryBox: Mystery box with id ${mysteryBoxResolvable} does not exist.`);

			return mysteryBox;
		}

		throw new Error(`resolveMysteryBox: Invalid mystery box resolvable`, mysteryBoxResolvable);
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