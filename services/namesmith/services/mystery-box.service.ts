import { getRandomWeightedElement } from "../../../utilities/data-structure-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { Character } from "../types/character.types";
import { MysteryBoxResolvable, MysteryBox } from "../types/mystery-box.types";

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

	static fromDB(db: DatabaseQuerier) {
		return new MysteryBoxService(
			MysteryBoxRepository.fromDB(db),
			CharacterRepository.fromDB(db)
		);
	}

	static asMock() {
		const db = createMockDB();
		return MysteryBoxService.fromDB(db);
	}

	/**
	 * Resolves a mystery box resolvable to a mystery box object.
	 * A mystery box resolvable is either a mystery box object or a number representing the ID of the mystery box.
	 * @param mysteryBoxResolvable - The mystery box resolvable to resolve.
	 * @returns A promise that resolves with the resolved mystery box object.
	 * @throws {Error} If the mystery box resolvable is invalid.
	 */
	resolveMysteryBox(
		mysteryBoxResolvable: MysteryBoxResolvable
	): MysteryBox {
		return this.mysteryBoxRepository.resolveMysteryBox(mysteryBoxResolvable);
	}

	/**
	 * Resolves a mystery box resolvable to its ID.
	 * @param mysteryBoxResolvable - The mystery box resolvable to resolve.
	 * @returns The ID of the resolved mystery box.
	 */
	resolveID(mysteryBoxResolvable: MysteryBoxResolvable) {
		return this.mysteryBoxRepository.resolveID(mysteryBoxResolvable);
	}

	isMysteryBox(mysteryBoxResolvable: MysteryBoxResolvable): boolean {
		try {
			this.resolveMysteryBox(mysteryBoxResolvable);
			return true;
		}
		catch {
			return false;
		}
	}

	/**
	 * Returns an array of all mystery box objects with their character odds.
	 * @returns An array of mystery box objects with their character odds.
	 */
	getMysteryBoxes(): MysteryBox[] {
		return this.mysteryBoxRepository.getMysteryBoxes();
	}

	/**
	 * Returns the cost of a mystery box in tokens.
	 * @param mysteryBoxResolvable - The mystery box to get the cost of.
	 * @returns The cost of the mystery box in tokens.
	 */
	getCost(mysteryBoxResolvable: MysteryBoxResolvable): number {
		const mysteryBoxID = this.resolveID(mysteryBoxResolvable);
		return this.mysteryBoxRepository.getTokenCost(mysteryBoxID);
	}

	/**
	 * Returns a character from the mystery box with the given ID. The character is chosen using the weighted random distribution of the mystery box.
	 * @param mysteryBoxResolvable - The mystery box from which to retrieve a character.
	 * @returns The character retrieved from the mystery box.
	 */
	openBox(mysteryBoxResolvable: MysteryBoxResolvable): Character {
		const mysteryBox = this.resolveMysteryBox(mysteryBoxResolvable);
		const characterOdds = mysteryBox.characterOdds;

		const characterValue = getRandomWeightedElement(characterOdds);
		return this.characterRepository.getCharacterByValueOrThrow(characterValue);
	}
}