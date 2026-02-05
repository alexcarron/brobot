import { getCharacterDifferences } from "./data-structure-utils";
import { getMondayOfThisWeek, getSundayOfThisWeek } from "./date-time-utils";
import { InvalidArgumentError } from "./error-utils";
import { getCharacterCounts } from "./string-checks-utils";
import { ToCamelCase } from './types/casing-types';

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

export function toCamelFromKebabCase<
	SpecificString extends string
>(kebabCaseString: SpecificString): ToCamelCase<SpecificString>;

/**
 * Convert a kebab-case string to camelCase at runtime.
 *
 * Behaviour matches the provided type:
 *  - "" -> ""
 *  - "-a--b-" -> "aB"
 *  - "my-BOX-Name" -> "myBoxName"
 * @param kebabCaseString kebab-case string
 * @returns The given string in camelCase
 */
export function toCamelFromKebabCase(kebabCaseString: string) {
	// Fast path for empty input
	if (kebabCaseString === '') return '';

	// Split on '-' and ignore empty segments (handles leading/trailing/duplicate '-')
	const parts = kebabCaseString.split('-').filter(Boolean);

	if (parts.length === 0) return '';

	// Lowercase the whole first segment
	const head = parts[0].toLowerCase();

	// For the rest: lowercase them fully, then capitalize the first character
	const rest = parts
		.slice(1)
		.map(part => {
			const lower = part.toLowerCase();
			return lower.length === 0 ? '' : lower[0].toUpperCase() + lower.slice(1);
		})
		.join('');

	const result = head + rest;

	// Assert to match the type-level result when used with string literal generics
	return result as any;
}

/**
 * Splits a given string into segments that can be used to form an identifier.
 * This function replaces underscores, hyphens, and other separators with spaces, then
 * splits the string on whitespace. The resulting segments are in lowercase.
 * @param string - The string to split into segments.
 * @returns An array of strings, each representing a segment of the input string.
 * @example
 * toIdentifierSegments('hello world'); // ['hello', 'world']
 * toIdentifierSegments('HELLO WORLD'); // ['hello', 'world']
 * toIdentifierSegments('hello-world'); // ['hello', 'world']
 * toIdentifierSegments('hello_world'); // ['hello', 'world']
 * toIdentifierSegments('helloWorld'); // ['hello', 'world']
 */
export function toIdentifierSegments(string: string): string[] {
  if (string.trim() === "")
		return [];

	// Remove non-alphanumeric characters (Keep whitespace, hyphens, and underscores)
	string = string.replace(/[^a-zA-Z0-9\s-_.]/g, "");

  // Replace underscores, hyphens, and other separators with spaces
  const normalizedString = string
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

  const words = normalizedString
    .trim()
    .toLowerCase()
    .split(/\s+/);

  if (words.length === 0) {
    return [];
  }

	return words;
}

/**
 * Converts any string in any casing to camelCase.
 * @param string - The string to convert
 * @returns The string in camelCase
 * @example
 * toCamelCase('hello world'); // 'helloWorld'
 * toCamelCase('HELLO WORLD'); // 'helloWorld'
 * toCamelCase('hello-world'); // 'helloWorld'
 * toCamelCase('hello_world'); // 'helloWorld'
 * toCamelCase('helloWorld'); // 'helloWorld'
 * toCamelCase('HelloWorld'); // 'helloWorld'
 */
export function toCamelCase(string: string): string {
	const words = toIdentifierSegments(string);

  if (words.length === 0) {
    return "";
  }

  const [firstWord, ...remainingWords] = words;

  const camelCasedResult = [
    firstWord,
    ...remainingWords.map(word =>
      capitalizeFirstLetter(word)
    ),
  ].join("");

  return camelCasedResult;
}

/**
 * Converts any string in any casing to PascalCase.
 * @param string - The string to convert
 * @returns The string in PascalCase
 * @example
 * toPascalCase('hello world'); // 'HelloWorld'
 * toPascalCase('HELLO WORLD'); // 'HelloWorld'
 * toPascalCase('hello-world'); // 'HelloWorld'
 * toPascalCase('hello_world'); // 'HelloWorld'
 * toPascalCase('helloWorld'); // 'HelloWorld'
 * toPascalCase('HelloWorld'); // 'HelloWorld'
 */

export function toPascalCase(string: string): string {
	return capitalizeFirstLetter(toCamelCase(string));
}

/**
 * Converts any string in any casing to kebab-case.
 * @param string - The string to convert
 * @returns The string in kebab-case
 * @example
 * toKebabCase('hello world'); // 'hello-world'
 * toKebabCase('HELLO WORLD'); // 'hello-world'
 * toKebabCase('hello-world'); // 'hello-world'
 * toKebabCase('hello_world'); // 'hello-world'
 * toKebabCase('helloWorld'); // 'hello-world'
 * toKebabCase('HelloWorld'); // 'hello-world'
 */
export function toKebabCase(string: string): string {
	const words = toIdentifierSegments(string);

	if (words.length === 0) {
		return "";
	}

	return words.join("-");
}

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
export const toListOfWords = (words: string[], conjunction: string = 'and'): string => {
	if (!words || words.length <= 0) {
		return "";
	}

	if (words.length === 1) {
		return `${words[0]}`;
	}

	if (words.length === 2) {
		return `${words[0]} ${conjunction} ${words[1]}`;
	}

	const lastWord = words[words.length-1];
	const nonLastWords = words.slice(0, -1);

	return `${nonLastWords.join(", ")}, ${conjunction} ${lastWord}`;
}

/**
 * Wrap given text by a given line width.
 * @param text - The text to be wrapped.
 * @param lineWidth - The maximum width of a line.
 * @returns An array of strings, each representing a line of the wrapped text.
 * @throws {Error} If text is not a string or lineWidth is not a positive number.
 * @example
 * const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
 * const lineWidth = 20;
 * const wrappedText = wrapTextByLineWidth(text, lineWidth);
 * console.log(wrappedText);
 * // Output:
 * // [
 * //   "Lorem ipsum dolor sit amet,",
 * //   "consectetur adipiscing elit"
 * // ]
 */
export const wrapTextByLineWidth = (text: string, lineWidth: number): string[] => {
	if (typeof text !== 'string')
		throw new Error('text must be a string.');

	if (typeof lineWidth !== 'number' || lineWidth <= 0)
		throw new Error('lineWidth must be a positive number.');

	const lines: string[] = [];
	let currentText = text.replace(/[^\S\r\n]+/g, ' ');
	currentText = currentText.trim();
	if (currentText.length === 0) return [];

	// While there is more text to wrap
	while (currentText.length > lineWidth) {
		let newLine = currentText.substring(0, lineWidth);
		console.log({currentText, newLine});

		let lineEndIndex = newLine.length;
		let lineEndCharacter = currentText.charAt(lineEndIndex);

		// If there is no space at the end of the line, go back until we find one
		while (lineEndIndex >= 0 && /\s/.test(lineEndCharacter) === false) {
			lineEndIndex -= 1;
			lineEndCharacter = currentText.charAt(lineEndIndex);
		}

		let nextLineStartIndex = lineEndIndex + 1;

		// If no space was found, go to the end of the line and dont attempt to trim off a space
		if (lineEndIndex < 0) {
			lineEndIndex = newLine.length;
			nextLineStartIndex = lineEndIndex;
		}
		console.log({ lineEndIndex, nextLineStartIndex });

		// Trim the line to the last space
		newLine = newLine.substring(0, lineEndIndex);
		console.log({ newLine });

		// Trim any accidental surrounding whitespace (optional, keeps lines clean)
		newLine = newLine.trim();
		console.log({ newLine });

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
 * Finds all strings in a list of possible strings that contain a given string (case-insensitive).
 * @param containingString - The string to search for
 * @param possibleStrings - The list of strings to search in
 * @returns An array of strings that contain the given string, sorted by localeCompare
 */
export function findStringsContaining(
	containingString: string,
	possibleStrings: string[]
): string[] {
	if (containingString.trim() === '') return possibleStrings;

	return possibleStrings
		.filter(possibleString =>
			possibleString.toLowerCase().includes(containingString.toLowerCase())
		)
		.sort((string1, string2) => {
      const isStartOfString1 = string1.toLowerCase().startsWith(containingString.toLowerCase());
      const isStartOfString2 = string2.toLowerCase().startsWith(containingString.toLowerCase());
      if (isStartOfString1 && !isStartOfString2) return -1;
      if (!isStartOfString1 && isStartOfString2) return 1;
      return string1.localeCompare(string2);
    });
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
	const { missingCharacters } = getCharacterDifferences(string, availableCharacters);
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

/**
 * Returns either the singular or plural form of a word based on a given number.
 * @param value - The value to check.
 * @param singular - The singular form of the word.
 * @param plural - The plural form of the word.
 * @returns The singular or plural form of the word, depending on the value.
 * @example
 * chooseByPlurality({value: 1, singular: 'cat', plural: 'cats'}); // 'cat'
 * chooseByPlurality({value: 2, singular: 'cat', plural: 'cats'}); // 'cats'
 */
export function chooseByPlurality<ReturnType>(
	value: number,
	singular: ReturnType,
	plural: ReturnType
): ReturnType {
	return value === 1 ? singular : plural;
}

/**
 * Adds an 's' to the end of a string if the given amount is not 1.
 * @param text - The string to add the 's' to.
 * @param amount - The amount to check.
 * @returns The string with or without the added 's', depending on the amount.
 * @example
 * addSIfPlural('cat', 1); // 'cat'
 * addSIfPlural('cat', 2); // 'cats'
 */
export function addSIfPlural(text: string, amount: number) {
	return chooseByPlurality(
		amount,
		`${text}`,
		`${text}s`
	);
}

/**
 * Returns a string in the format of "{amount} {text}" with the text
 * properly pluralized.
 * @param amount - The amount to pluralize the string by.
 * @param text - The string to pluralize.
 * @returns A string in the format of "{amount} {text}" with the text
 *   properly pluralized.
 * @example
 * toAmountOfNoun(1, 'cat'); // '1 cat'
 * toAmountOfNoun(2, 'cat'); // '2 cats'
 */
export function toAmountOfNoun(amount: number, text: string) {
	return `${toReadableNumber(amount)} ${addSIfPlural(text, amount)}`;
}

/**
 * Capitalizes a string by making the first character uppercase and the rest lowercase.
 * @param {string} text - The string to capitalize.
 * @returns {string} The capitalized string.
 * @example
 * capitalize('hello'); // 'Hello'
 */
export function capitalize(text: string) {
	if (text.length === 0) return text;
	if (text.length === 1) return text.toUpperCase();

	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Joins an array of strings or arrays of strings into a single string, with each element separated by a newline.
 * If any of the elements are undefined or null, they are ignored.
 * @example
 * joinLines('hello', 'world'); // 'hello\nworld'
 * joinLines(['hello', 'world'], ['goodbye']); // 'hello\nworld\ngoodbye'
 * joinLines(undefined, 'hello', null, 'world'); // 'hello\nworld'
 * @param lines - An array of strings or arrays of strings to join.
 * @returns - A single string with each element separated by a newline.
 */
export function joinLines(
	...lines: Array<string | string[] | undefined | null>
) {
	const flattenedLines = lines.flat();
	const filteredLines = flattenedLines.filter(line =>
		line !== undefined && line !== null
	);
	const joinedLines = filteredLines.join('\n');
	return joinedLines;
}

/**
 * Capitalizes the first letter of a string.
 * @param string - The string to capitalize the first letter of.
 * @returns The string with the first letter capitalized.
 * @example
 * capitalizeFirstLetter('hello'); // 'Hello'
 */
export function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Truncates a given text to a maximum length, adding an overflow suffix
 * if the text is longer than the maximum length.
 * @param text - The text to truncate.
 * @param maxLength - The maximum length of the text.
 * @param overflowSuffix - The suffix to add if the text is longer than the maximum length.
 * @returns The truncated text, or the original text if it is shorter than the maximum length.
 */
export function truncateText(
	text: string,
	maxLength: number,
	overflowSuffix: string = '...'
): string {
	if (text.length <= maxLength)
		return text;

	const truncatedLength = maxLength - overflowSuffix.length;
	return `${text.slice(0, truncatedLength)}${overflowSuffix}`;
}

export function sortCharacters(string: string): string {
	return [...string].sort().join('');
}

/**
 * Converts a given date object to a human-readable concise date string in the format: "Mon, May 12 2022 at 4:30 PM".
 * @param date - The date object to convert.
 * @returns A human-readable concise date string in the format: "May 12 2022 at 4:30 PM".
 */
export function toConciseReadableDate(date: Date): string {
	if (!date)
		throw new Error('Expected passed date to be defined for toConciseReadableDate function, but was undefined.');

	if (date instanceof Date === false || isNaN(date.getTime()))
		throw new Error(`Expected passed date to be a valid Date object for toConciseReadableDate function, but was ${date}.`);

	const conciseWeekdayName = date.toLocaleString('default', { weekday: 'short' });
	const monthName = date.toLocaleString('default', { month: 'short' });
	const dateNum = date.getDate();
	const fullYear = date.getFullYear();
	const displayTime = date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true });

	return `${conciseWeekdayName}, ${monthName} ${dateNum} ${fullYear} at ${displayTime}`;
}

/**
 * Converts a given date object to a human-readable concise time string in the format: "12:30 AM" or "12AM".
 * @param date - The date object to convert.
 * @returns A human-readable concise time string in the format: "12:30 AM" or "12AM".
 */
export function toConciseReadableTime(date: Date): string {
	if (!date)
		throw new Error('Expected passed date to be defined for toConciseReadableTime function, but was undefined.');

	if (date instanceof Date === false || isNaN(date.getTime()))
		throw new Error(`Expected passed date to be a valid Date object for toConciseReadableTime function, but was ${date}.`);

	const hourNum24 = date.getHours();
	const minuteNum = date.getMinutes();
	const meridiem = hourNum24 < 12 ? 'AM' : 'PM';
	let hourNum = hourNum24 % 12;
	if (hourNum === 0)
		hourNum = 12;

	if (minuteNum === 0) {
		// Example: 12AM
		return `${hourNum}${meridiem}`;
	}
	else {
		// Example: 12:30 AM
		return `${hourNum}:${String(minuteNum).padStart(2, '0')} ${meridiem}`;
	}
}

/**
 * Converts a given date object to a human-readable concise time string in the format: "12PM" or "12:30PM".
 * @param date - The date object to convert.
 * @returns A human-readable concise time string in the format: "12PM" or "12:30PM".
 */
export function toCompactReadableTime(date: Date): string {
	if (!date)
		throw new Error('Expected passed date to be defined for toConciseReadableTime function, but was undefined.');

	if (date instanceof Date === false || isNaN(date.getTime()))
		throw new Error(`Expected passed date to be a valid Date object for toConciseReadableTime function, but was ${date}.`);

	const hourNum24 = date.getHours();
	const minuteNum = date.getMinutes();
	const meridiem = hourNum24 < 12 ? 'AM' : 'PM';

	if (meridiem === 'AM')
		return `${hourNum24}:${String(minuteNum).padStart(2, '0')}`;
	else {
		let hourNum = hourNum24 % 12;
		if (hourNum === 0)
			hourNum = 12;

		if (minuteNum === 0)
			return `${hourNum}PM`;
		else
			return `${hourNum}:${String(minuteNum).padStart(2, '0')}PM`;
	}
}

/**
 * Converts a given date objects to a human-readable concise string displaying many dates in the format:
 *
 * When all dates are on a single day:
 *   Mon, May 12 2022 at 4:30 PM, 6:30 PM, 7:30 PM
 *
 * When dates are spread across multiple days:
 *   Mon, May 12 2022 at 4:30 PM, 6:30 PM, 7:30 PM
 *   Tue, May 13 2022 at 4:30 PM
 *   Wed, May 14 2022 at 8AM, 9:30 AM, 11AM, 1:32 PM, 2:30 PM, 4:25 PM, 5:30 PM
 *
 * When dates are spread across so many days there are too many lines:
 * 	May 12-18 2022 — Mon 12 (4:30, 6:30, 7:30) • Tue 13 (4:30) • Wed 14 (8:00, 9:30, 11:00, 1:32PM, 2:30PM, 4:25PM, 5:30PM) • Thu 15 (4:30) • Fri 16 (4:30, 6:30, 7:30) • Sat 17 (4:30) • Sun 18 (4:30)
 *  May 19-25 2022 — Mon 19 (4:30) • Tue 20 (4:30) • Wed 21 (8:00, 9:30, 11:00, 1:32PM, 2:30PM, 4:25PM, 5:30PM) • Thu 22 (4:30) • Fri 23 (4:30, 6:30, 7:30) • Sat 24 (4:30) • Sun 25 (4:30)
 *	May 26-Jun 1 2023 — Mon 26 (4:30) • Tue 27 (4:30) • Wed 28 (8:00, 9:30, 11:00, 1:32PM, 2:30PM, 4:25PM, 5:30PM) • Thu 29 (4:30) • Fri 30 (4:30, 6:30, 7:30)
 *
 * When dates are spread across so many weeks there are too many lines:
 *   May 2022 — Mon 1 (4:30) • Tue 2 (4:30) • Wed 3 (8:00, 9:30, 11:00, 1:32PM, 2:30PM, 4:25PM, 5:30PM) • Thu 4 (4:30) • Fri 5 (4:30, 6:30, 7:30) • Sat 6 (4:30) • Sun 7 (4:30) • Mon 8 (4:30) • Tue 9 (4:30) • Wed 10 (8:00, 9:30, 11:00, 1:32PM, 2:30PM, 4:25PM, 5:30PM) • Thu 11 (4:30) • Fri 12 (4:30, 6:30, 7:30) • Sat 13 (4:30) • Sun 14 (4:30)
 * @param dates - The date objects to convert.
 * @returns A human-readable concise string displaying many dates.
 */
export function toConciseReadableDates(dates: Date[]): string {
	if (dates.length === 0)
		throw new Error(`Expected at least one Date object for toConciseReadableDates function, but was ${dates}.`);

	const ascendingDates = dates
		.filter(date =>
			date instanceof Date &&
			!isNaN(date.getTime())
		)
		.slice()
		.sort((date1, date2) => date1.getTime() - date2.getTime());

	if (ascendingDates.length === 0)
		throw new Error(`Expected at least one valid Date object for toConciseReadableDates function, but was ${dates}.`);

	// Groups by local calendar date (YYYY-MM-DD)
	const dayStringToTimes = new Map<string, Date[]>();
	const getDayStringOf = (date: Date) => {
		const yearNum = date.getFullYear();
		// month and day padded to keep stable keys
		const monthNum = String(date.getMonth() + 1).padStart(2, '0');
		const dayNum = String(date.getDate()).padStart(2, '0');
		return `${yearNum}-${monthNum}-${dayNum}`;
	};

	for (const date of ascendingDates) {
		const dayStringKey = getDayStringOf(date);
		const datesForTheDay = dayStringToTimes.get(dayStringKey) ?? [];
		datesForTheDay.push(date);
		dayStringToTimes.set(dayStringKey, datesForTheDay);
	}

	const distinctDays = Array.from(dayStringToTimes.entries());

	if (distinctDays.length <= 8) {
		const lines: string[] = [];

		for (const [, datesForTheDay] of dayStringToTimes) {
			// all dates in group are on same calendar day; use the first to render the header
			const firstDate = datesForTheDay[0];

			const conciseWeekdayName = firstDate.toLocaleString('default', { weekday: 'short' });
			const monthName = firstDate.toLocaleString('default', { month: 'long' });
			const dateNum = firstDate.getDate();
			const fullYear = firstDate.getFullYear();

			const ascendingTimes = datesForTheDay.sort((date1, date2) =>
				date1.getTime() - date2.getTime()
			);

			const timeStrings: string[] = [];
			let previousTime = '';
			for (const time of ascendingTimes) {
				const timeString = toConciseReadableTime(time);

				if (timeString !== previousTime) {
					timeStrings.push(timeString);
					previousTime = timeString;
				}
			}

			const timesPart = timeStrings.join(', ');
			lines.push(`${conciseWeekdayName}, ${monthName} ${dateNum} ${fullYear} at ${timesPart}`);
		}

		return lines.join('\n');
	}

	const lines: string[] = [];
	const earliestDate = ascendingDates[0];
	let currentMonday = getMondayOfThisWeek(earliestDate);

	const initialMonthName = currentMonday.toLocaleString('default', { month: 'long' });
	const initialMondayDateNum = currentMonday.getDate();
	const initialSundayDateNum = getSundayOfThisWeek(currentMonday).getDate();
	const initialFullYear = currentMonday.getFullYear();

	let linePrefix = `${initialMonthName} ${initialMondayDateNum}-${initialSundayDateNum} ${initialFullYear} — `;
	let compactDayStrings: string[] = [];

	for (const [, datesForTheDay] of distinctDays) {
		const baseDate = datesForTheDay[0];
		const mondayOfDay = getMondayOfThisWeek(baseDate);

		// If new week
		if (mondayOfDay.getTime() !== currentMonday.getTime()) {
			lines.push(`${linePrefix}${compactDayStrings.join(' • ')}`);

			compactDayStrings = [];
			currentMonday = mondayOfDay;
			const monthName = currentMonday.toLocaleString('default', { month: 'long' });
			const mondayDateNum = currentMonday.getDate();
			const sundayDateNum = getSundayOfThisWeek(currentMonday).getDate();
			const fullYear = currentMonday.getFullYear();

			linePrefix = `${monthName} ${mondayDateNum}-${sundayDateNum} ${fullYear} — `;
		}

		const weekdayName = baseDate.toLocaleString('default', { weekday: 'short' });
		const dateNum = baseDate.getDate();
		const timeString = datesForTheDay
			.map(toCompactReadableTime)
			.join(', ');

		const compactDayString = `${weekdayName} ${dateNum} (${timeString})`;
		compactDayStrings.push(compactDayString);
	}

	lines.push(`${linePrefix}${compactDayStrings.join(' • ')}`);
	return lines.join('\n');
}

/**
 * Converts a number into a human-readable string with commas as thousand separators and without trailing zeros for decimal parts.
 * @param number - The number to convert.
 * @returns A human-readable string with commas as
 * @throws {InvalidArgumentError} If the input is not a number.
 * thousand separators and without trailing zeros for decimal parts.
 * @example
 * toReadableNumber(1234.56) // "1,234.56"
 * toReadableNumber(1234567.890) // "1,234,567.89"
 * toReadableNumber("01234.5600") // "12,345.56"
 */
export function toReadableNumber(number: number | string): string {
  const numString = 
		typeof number === 'number' 
			? number.toString() 
			: number;
  
  const floatNumber = parseFloat(numString);
  
  if (isNaN(floatNumber)) {
    throw new InvalidArgumentError(`Expected a number to be passed to toReadableNumber(), but got ${numString}.`);
  }
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = numString.replace(/^0+/, '').split('.');
  
  // Add commas to integer part
  const formattedInteger = parseInt(integerPart || '0')
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // If there's a decimal part, remove trailing zeros
  if (decimalPart !== undefined) {
		const formattedDecimal = decimalPart.replace(/0+$/, '');
		return `${formattedInteger}.${formattedDecimal}`;
  }
  
  return formattedInteger;
}