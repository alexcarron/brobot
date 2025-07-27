import { InvalidArgumentError } from "../../../utilities/error-utils";

/**
 * Retrieves the Unicode code point value of a given character.
 * @param characterValue - The character from which to retrieve the code point value. Must be a single character string.
 * @returns The Unicode code point value of the character.
 * @throws {Error} If the input is not a string or not a single character.
 */
export const getIDfromCharacterValue = (characterValue: string): number => {
	if (characterValue.length !== 1) {
		throw new InvalidArgumentError('getIDofCharacter: character must be a single character.');
	}

	const id = characterValue.codePointAt(0);

	if (id === undefined) {
		throw new InvalidArgumentError(`getIDofCharacter: character value is not a valid Unicode character. Got ${characterValue}.`);
	}

	return id;
}

/**
 * Retrieves the Unicode character value of a given code point value.
 * @param id - The code point value from which to retrieve the character. Must be a number.
 * @throws {Error} If the input is not a number.
 * @returns The Unicode character value of the code point.
 */
export const getCharacterValueFromID = (id: number): string => {
	if (id < 0) {
		throw new InvalidArgumentError(`getIDofCharacter: id must be a positive number. Got ${id}.`);
	}
	else if (Number.isInteger(id) === false) {
		throw new InvalidArgumentError(`getIDofCharacter: id must be an integer. Got ${id}.`);
	}

	return String.fromCodePoint(id);
}