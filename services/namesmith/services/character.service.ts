import { CharacterRepository } from "../repositories/character.repository";
import { MinimalCharacter, CharacterID, CharacterResolvable } from "../types/character.types";
import { getIDfromCharacterValue } from "../utilities/character.utility";

/**
 * Provides methods for interacting with characters.
 */
export class CharacterService {
	constructor(
		public characterRepository: CharacterRepository,
	) {}

	/**
	 * Resolves a character resolvable to a character object.
	 * @param characterResolvable - The character resolvable to resolve.
	 * @returns The resolved character object.
	 * @throws {Error} If the character resolvable is invalid or the character is not found.
	 */
	resolveCharacter(characterResolvable: CharacterResolvable): MinimalCharacter {
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
}