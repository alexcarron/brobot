import { getRandomWeightedElement } from "../../../utilities/data-structure-utils";
import { CharacterRepository } from "../repositories/character.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { Character } from "../types/character.types";
import { MysteryBoxResolveable, MysteryBoxWithOdds } from "../types/mystery-box.types";
import { MysteryBoxNotFoundError } from "../utilities/error.utility";
import { isMysteryBoxWithOdds } from "../utilities/mystery-box.utility";

/**
 * Provides methods for interacting with mystery boxes.
 */
export class MysteryBoxService {
	/**
	 * Constructs a new MysteryBoxService instance.
	 * @param mysteryBoxRepository - The repository used for accessing mystery boxes.
	 * @param characterRepository - The repository used for accessing characters.
	 */
	constructor(
		public mysteryBoxRepository: MysteryBoxRepository,
		public characterRepository: CharacterRepository
	) {}

	/**
	 * Resolves a mystery box resolvable to a mystery box object.
	 * A mystery box resolvable is either a mystery box object or a number representing the ID of the mystery box.
	 * @param mysteryBoxResolvable - The mystery box resolvable to resolve.
	 * @returns A promise that resolves with the resolved mystery box object.
	 * @throws {Error} If the mystery box resolvable is invalid.
	 */
	resolveMysteryBox(
		mysteryBoxResolvable: MysteryBoxResolveable
	): MysteryBoxWithOdds {
		if (isMysteryBoxWithOdds(mysteryBoxResolvable)) {
			const mysteryBox = mysteryBoxResolvable;
			return mysteryBox;
		}
		else {
			let id: number;

			if (typeof mysteryBoxResolvable === 'object')
				id = mysteryBoxResolvable.id;
			else
				id = mysteryBoxResolvable;

			const mysteryBox = this.mysteryBoxRepository.getMysteryBoxWithOdds(id);

			if (mysteryBox === null)
				throw new MysteryBoxNotFoundError(id.toString());

			return mysteryBox;
		}
	}

	/**
	 * Returns a character from the mystery box with the given ID. The character is chosen using the weighted random distribution of the mystery box.
	 * @param mysteryBoxResolvable - The mystery box from which to retrieve a character.
	 * @returns The character retrieved from the mystery box.
	 */
	openBox(mysteryBoxResolvable: MysteryBoxResolveable): Character {
		const mysteryBox = this.resolveMysteryBox(mysteryBoxResolvable);
		const characterOdds = mysteryBox.characterOdds;

		const characterValue = getRandomWeightedElement(characterOdds);
		return this.characterRepository.getCharacterByValue(characterValue);
	}
}