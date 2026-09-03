import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { Character, CharacterID, CharacterResolvable } from "../types/character.types";
import { getIDfromCharacterValue } from "../utilities/character.utility";
import { getCharacters } from "../../../utilities/string-checks-utils";
import { MysteryBoxService } from "./mystery-box.service";
import {
	getCheapestCostForCharacter,
	getSellValueForCharacter,
} from "../utilities/character-economy.utility";

/**
 * Provides methods for interacting with characters.
 */
export class CharacterService {
	constructor(
		public characterRepository: CharacterRepository,
		public mysteryBoxService: MysteryBoxService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new CharacterService(
			CharacterRepository.fromDB(db),
			MysteryBoxService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return CharacterService.fromDB(db);
	}

	/**
	 * Resolves a character resolvable to a character object.
	 * @param characterResolvable - The character resolvable to resolve.
	 * @returns The resolved character object.
	 * @throws {Error} If the character resolvable is invalid or the character is not found.
	 */
	resolveCharacter(characterResolvable: CharacterResolvable): Character {
		let characterID: CharacterID;

		if (typeof characterResolvable === "number") {
			characterID = characterResolvable;
		}
		else if (typeof characterResolvable === "string") {
			characterID = getIDfromCharacterValue(characterResolvable);
		}
		else {
			characterID = characterResolvable.id;
		}

		return this.characterRepository.getCharacterOrThrow(characterID);
	}

	/**
	 * Returns the number of tokens a player receives for selling a single character.
	 * @param characterResolvable - The character being sold.
	 * @returns The sell value, in tokens, of the character.
	 */
	getSellValue(characterResolvable: CharacterResolvable): number {
		const character = this.resolveCharacter(characterResolvable);
		const mysteryBoxes = this.mysteryBoxService.getMysteryBoxes();
		return getSellValueForCharacter({ character, mysteryBoxes });
	}

	/**
	 * Returns the total number of tokens a player receives for selling every character in a string.
	 * @param characters - The characters being sold.
	 * @returns The total sell value, in tokens, of the characters.
	 */
	getSellValueOfCharacters(characters: string): number {
		const characterValues = getCharacters(characters);

		let totalSellValue = 0;
		for (const characterValue of characterValues)
			totalSellValue += this.getSellValue(characterValue);

		return totalSellValue;
	}

	/**
	 * Returns the cheapest token cost to obtain a character via a mystery box or mining.
	 * @param characterResolvable - The character to check.
	 * @returns The cheapest cost, in tokens, or null if the character can't be obtained via a box or mining (e.g. a recipe-only character).
	 */
	getCheapestCost(characterResolvable: CharacterResolvable): number | null {
		const character = this.resolveCharacter(characterResolvable);
		const mysteryBoxes = this.mysteryBoxService.getMysteryBoxes();
		return getCheapestCostForCharacter({ character, mysteryBoxes });
	}
}