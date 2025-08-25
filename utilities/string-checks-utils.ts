import { InvalidArgumentError } from "./error-utils";

/**
 * Creates a Map where each key is a character from the given string and each value is the number of times that character appears in the string.
 * @param string - The string to count the characters of.
 * @returns A Map where each key is a character from the given string and each value is the number of times that character appears in the string.
 */
export const getCharacterCounts = (
	string: string | string[]
): Map<string, number> => {
	const characterToCount = new Map();
	for (const character of string) {
		if (characterToCount.has(character)) {
			const currentCount = characterToCount.get(character);
			characterToCount.set(character, currentCount + 1);
		}
		else {
			characterToCount.set(character, 1);
		}
	}
	return characterToCount;
}

/**
 * Checks if a string contains all the characters provided in the characters argument (case-sensitive, order does not matter).
 * @param characters the characters to check for in the string
 * @param stringToCheck the string to check
 * @returns true if the string contains all the characters provided in the characters argument, false otherwise
 */
export const areCharactersInString = (
	characters: string | string[],
	stringToCheck: string
) => {
	let charactersArray: string[];
	if (typeof characters === "string") {
		charactersArray = characters.split("");
	}
	else {
		const allItemsAreCharacters = characters.every((character) =>
			character.length === 1
		);
		if (!allItemsAreCharacters) {
			throw new InvalidArgumentError(
				`areCharactersInString: characters must be a string or an array of strings of length 1, but got ${characters}.`
			);
		}
		charactersArray = characters;
	}

	const sourceCharacterCounts = getCharacterCounts(stringToCheck);
	const wantedCharacterCounts = getCharacterCounts(charactersArray);

	for (const [character, wantedCount] of wantedCharacterCounts) {
		if (sourceCharacterCounts.has(character)) {
			if (sourceCharacterCounts.get(character)! < wantedCount) {
				return false;
			}
		}
		else {
			return false;
		}
	}
	return true;
}