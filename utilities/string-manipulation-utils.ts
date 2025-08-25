import { getCharacterDifferencesInStrings } from "./data-structure-utils";
import { InvalidArgumentError } from "./error-utils";
import { getCharacterCounts } from "./string-checks-utils";

/**
 * Converts a given string to title case.
 * @param string - The string to convert.
 * @returns The string in title case.
 */
export const toTitleCase = (string: string): string => {
// Matches words in a string
	const wordRegex = /\w\S*/g;

	// Replaces each word with its title case equivalent
	return string.replace(
		wordRegex,
		(word) =>
			// Uppercases the first character and lowercases the rest
			word.charAt(0).toUpperCase() +
			word.substr(1).toLowerCase()
	);
};

/**
 * Creates a text-based progress bar based on a current value and total value.
 * @param currentValue - The current value which will eventually reach the total.
 * @param totalValue - The total value the current value will eventually reach.
 * @param characterSize - The total number of characters used to represent the progress bar.
 * @returns A string representation of the progress bar.
 */
export const createTextProgressBar = (currentValue: number, totalValue: number, characterSize: number): string => {
		if (typeof currentValue !== 'number')
			throw new Error('currentValue must be a number.');
		else if (typeof totalValue !== 'number')
			throw new Error('totalValue must be a number.');
		else if (typeof characterSize !== 'number')
			throw new Error('characterSize must be a number.');

		if (currentValue > totalValue)
			currentValue = totalValue;

		if (currentValue < 0)
			currentValue = 0;

		if (totalValue <= 0)
			totalValue = 1;

    const percentage = currentValue / totalValue;

    let numFilledCharacters = Math.round(characterSize * percentage);
    const numUnfilledCharacters = characterSize - numFilledCharacters;

    // Ensure progress is within valid bounds
    if (numFilledCharacters <= 0)
			numFilledCharacters = 0;

		if (numFilledCharacters > characterSize)
			numFilledCharacters = characterSize;

    // Create the filled and unfilled portions of the progress bar
    const progressText = '▇'.repeat(numFilledCharacters);
    const emptyProgressText = '—'.repeat(numUnfilledCharacters);

    const percentageText = Math.round(percentage * 100) + '%';

    const progressBarString = '[' + progressText + emptyProgressText + ']' + percentageText;
    return progressBarString;
};

/**
 * Converts a number to its ordinal representation as a string.
 * @param number - The number to convert.
 * @returns The ordinal representation of the number.
 * @throws {Error} Throws an error if the input is not a valid number.
 */
export const toNumericOrdinal = (number: number): string => {
	// Check if the input is a valid number
	if (typeof number !== 'number' || isNaN(number)) {
		throw new Error('Input is not a valid number');
	}

	const absoluteNumber = Math.abs(number);

	// Handle special cases for numbers ending in 11, 12, or 13
	if (
		absoluteNumber % 100 >= 11 &&
		absoluteNumber % 100 <= 13)
	{
		return number + 'th';
	}

	// Determine the ordinal suffix based on the last digit
	switch (absoluteNumber % 10) {
		case 1:
			return number + 'st';
		case 2:
			return number + 'nd';
		case 3:
			return number + 'rd';
		default:
			return number + 'th';
	}
};

/**
 * Converts a number to its word ordinal representation as a string.
 * @param number - The number to convert.
 * @returns The word ordinal representation of the number.
 * @throws {Error} Throws an error if the input is not a valid number or too large.
 */
export const toWordOrdinal = (number: number): string => {
  // Check if the input is a valid number
  if (typeof number !== 'number' || isNaN(number))
    throw new Error('Input is not a valid number');

	if (number < 0)
		throw new Error('Number should be non-negative');

  // Ordinal words for numbers 0-19
  const ordinalsUpTo19 = [
    'zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
    'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'
  ];

  // Ordinal words for multiples of ten
  const ordinalsForTens = [
    '', 'tenth', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth'
  ];

  // Normal words for multiples of ten
  const wordsForTens = [
    '', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', "hundred",
  ];

  // Return the ordinal for numbers less than 20
  if (number < ordinalsUpTo19.length) {
    return ordinalsUpTo19[number];
  }

  // Calculate the last digit and tens place
  const lastDigit = number % 10;
  const numTens = Math.floor(number / 10);

  // Return ordinal for exact multiples of ten
  if (lastDigit === 0) {
    if (numTens < ordinalsForTens.length) {
      return ordinalsForTens[numTens];
    }
		else {
      throw new Error('Number too large');
    }
  }

  // Return composed ordinal word for other numbers
  if (numTens < wordsForTens.length) {
    return wordsForTens[numTens] + '-' + ordinalsUpTo19[lastDigit];
  }

  throw new Error('Number too large');
}
export const createListFromWords = (words: string[]): string => {
	if (!words || words.length <= 0) {
		return "";
	}

	if (words.length === 1) {
		return `${words[0]}`;
	}

	if (words.length === 2) {
		return `${words[0]} and ${words[1]}`;
	}

	const lastWord = words[words.length-1];
	const nonLastWords = words.slice(0, -1);

	return `${nonLastWords.join(", ")}, and ${lastWord}`;
}

export const wrapTextByLineWidth = (text: string, lineWidth: number): string[] => {
	if (typeof text !== 'string')
		throw new Error('text must be a string.');

	if (typeof lineWidth !== 'number' || lineWidth <= 0)
		throw new Error('lineWidth must be a positive number.');

	const lines: string[] = [];
	let currentText = text.replace(/\s+/g, ' ');
	currentText = currentText.trim();
	if (currentText.length === 0) return [];

	// While there is more text to wrap
	while (currentText.length > lineWidth) {
		let newLine = currentText.substring(0, lineWidth);
		let lineEndIndex = newLine.length;
		let lineEndCharacter = currentText.charAt(lineEndIndex);

		// If there is no space at the end of the line, go back until we find one
		while (lineEndIndex >= 0 && lineEndCharacter !== ' ') {
			lineEndIndex -= 1;
			lineEndCharacter = currentText.charAt(lineEndIndex);
		}

		let nextLineStartIndex = lineEndIndex + 1;

		// If no space was found, go to the end of the line and dont attempt to trim off a space
		if (lineEndIndex < 0) {
			lineEndIndex = newLine.length;
			nextLineStartIndex = lineEndIndex;
		}

		// Trim the line to the last space
		newLine = newLine.substring(0, lineEndIndex);

		// Trim the current text to remove the line we just processed
		currentText = currentText.substring(nextLineStartIndex);
		lines.push(newLine);
	}

	// Adds the last line
	lines.push(currentText);

	return lines;
}
/**
 * Removes any URLs from a given string.
 * @param string - The string to remove URLs from
 * @returns The string with all URLs removed
 */
export const removeLinks = (string: string): string => {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	return string.replace(urlRegex, '');
}

/**
 * Removes all emojis from a given string.
 * @param string - The string to remove emojis from
 * @returns The string with all emojis removed
 */
export const removeEmojis = (string: string): string => {
	return string.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '');
}

/**
 * Finds the first string in a list of possible strings that starts with a given string (case-insensitive).
 * @param startingString - The string to search for
 * @param possibleStrings - The list of strings to search in
 * @returns The first string that starts with the given string, or undefined if no string is found
 */
export const findStringStartingWith = (startingString: string, possibleStrings: string[]): string | undefined => {
	if (typeof startingString !== 'string')
		throw new Error('startingString must be a string.');

	if (!Array.isArray(possibleStrings))
		throw new Error('possibleStrings must be an array.');

	if (possibleStrings.some(possibleString => typeof possibleString !== 'string'))
		throw new Error('possibleStrings must be an array of strings.');

	if (possibleStrings.length === 0)
		return undefined;

	return possibleStrings.find(possibleString =>
		possibleString.toLowerCase().startsWith(startingString.toLowerCase())
	)
}

/**
 * Increments the number at the end of a given string by a given amount.
 * @param string - The string to increment
 * @param incrementAmount - The amount to increment the number by
 * @returns The string with the number at the end incremented by the given amount
 */
export const incrementEndNumber = (string: string, incrementAmount: number = 1): string => {
	if (typeof string !== 'string')
		throw new Error('string must be a string.');

	if (typeof incrementAmount!== 'number')
		throw new Error('incrementAmount must be a number.');

	const endNumberMatch = string.match(/\d+$/);
	const hasEndNumber = endNumberMatch !== null;

	if (!hasEndNumber)
		return string + (1 + incrementAmount);

	const endNumber = Number(string.match(/\d+$/));
	const numDigits = endNumber.toString().length;
	const stringWithoutEndNumber = string.slice(0, -numDigits);
	const newNumber = endNumber + incrementAmount;

	return `${stringWithoutEndNumber}${newNumber}`;
}

/**
 * Removes a character from a string at the specified index.
 * @param string - The string from which to remove the character
 * @param index - The index of the character to remove
 * @returns The string with the character removed at the specified index
 */
export const removeCharacterAt = (string: string, index: number): string => {
	if (Number.isInteger(index) === false)
		throw new InvalidArgumentError(
			`index must be an integer, but got ${index}.`
		);

	if (index < 0 || index >= string.length)
		throw new InvalidArgumentError(
			`index must be between 0 and ${string.length - 1}, but got ${index}.`
		);

	return string.slice(0, index) + string.slice(index + 1);
}

/**
 * Removes a specific collection of characters from the end of a string until all characters in the given collection are removed.
 * @param string - The string to remove characters from
 * @param charactersToRemove - The characters to remove from the string
 * @returns The string with all characters removed from the end
 */
export const removeCharactersAsGivenFromEnd = (
	string: string,
	charactersToRemove: string | string[]
): string => {
	let characters: string;
	if (typeof charactersToRemove !== 'string')
		characters = charactersToRemove.join('');
	else
		characters = charactersToRemove;

	const characterToCounts = getCharacterCounts(characters);

	for (let index = string.length - 1; index >= 0; index--) {
		const character = string.charAt(index);

		if (characterToCounts.has(character)) {
			string = removeCharacterAt(string, index);

			characterToCounts.set(character,
				characterToCounts.get(character)! - 1
			);

			if (characterToCounts.get(character) === 0) {
				characterToCounts.delete(character);
			}
		}
	}

	if (characterToCounts.size > 0)
		throw new InvalidArgumentError(
			`charactersToRemove argument, ${charactersToRemove}, contains the following characters that are not in the given string, ${string}: ${Array.from(characterToCounts.keys()).join(', ')}.`
		);

	return string;
}

/**
 * Removes characters from a given string that are not present in a specified set of available characters.
 * @param {string} string - The string to remove characters from.
 * @param {string} availableCharacters - The set of available characters.
 * @returns {string} The string with missing characters removed.
 * @example
 * removeMissingCharacters('hello', 'elope'); // 'elo'
 */
export const removeMissingCharacters = (
	string: string, availableCharacters: string
): string => {
	const { missingCharacters } = getCharacterDifferencesInStrings(string, availableCharacters);
	return removeCharactersAsGivenFromEnd(string, missingCharacters);
}

/**
 * Escapes Discord markdown characters in a string.
 * @param text - The string to escape.
 * @returns The string with Discord markdown characters escaped.
 */
export const escapeDiscordMarkdown = (text: string): string => {
	return text.replace(/([_*~`>|()[\]{}#+\-=.!\\])/g, "\\$1");
}