/**
 * @fileoverview Utility functions for working with characters.
 */

/**
 * Retrieves the Unicode code point value of a given character.
 *
 * @param {string} character - The character from which to retrieve the code point value. Must be a single character string.
 * @throws {Error} If the input is not a string or not a single character.
 * @returns {number} The Unicode code point value of the character.
 */
const getIDfromCharacterValue = (character) => {
	if (typeof character !== 'string') {
		throw new Error('getIDofCharacter: character must be a string.');
	}

	if (character.length !== 1) {
		throw new Error('getIDofCharacter: character must be a single character.');
	}

	return character.codePointAt(0);
}

/**
 * Retrieves the Unicode character value of a given code point value.
 *
 * @param {number} id - The code point value from which to retrieve the character. Must be a number.
 * @throws {Error} If the input is not a number.
 * @returns {string} The Unicode character value of the code point.
 */
const getCharacterValueFromID = (id) => {
	if (typeof id !== 'number') {
		throw new Error('getIDofCharacter: id must be a number.');
	}

	return String.fromCodePoint(id);
}

module.exports = { getIDfromCharacterValue, getCharacterValueFromID };