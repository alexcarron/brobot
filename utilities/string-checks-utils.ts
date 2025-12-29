import { InvalidArgumentError } from "./error-utils";
import GraphemeSplitter from "grapheme-splitter";

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

/**
 * Checks if a given string is a valid integer string.
 * A valid integer string is a string that is not empty or whitespace-only, and can be parsed to a number using the Number() constructor.
 * The string must also be equal to the string representation of the parsed number.
 * @param string - The string to check.
 * @returns True if the string is a valid integer string, false otherwise.
 */
export function isIntegerString(string: string): boolean {
  if (string.trim() === '') return false;

  const number = Number(string);
  return (
		Number.isInteger(number) &&
		string.trim() === number.toString()
	);
}

/**
 * Determines if a given string contains only one symbol, including just a single emoji.
 * @param string - The string to check.
 * @returns Whether or not the string contains only one symbol.
 * @example
 * const isOneSymbol = isOneSymbol('👀'); // true
 */
export function isOneSymbol(string: string): boolean {
  if (string.length === 0) return false;

  const Segment = (Intl as any).Segmenter;
  if (typeof Segment === 'function') {
    try {
      const segment = new Segment(undefined, { granularity: 'grapheme' });
      const iterator = segment.segment(string)[Symbol.iterator]() as Iterator<any>;
      const first = iterator.next();
      if (first.done) return false;
      const second = iterator.next();
      return second.done === true;
    }
		catch {
      // Fall through to next strategy
    }
  }

	const splitter = new GraphemeSplitter();
	if (typeof splitter.countGraphemes === 'function') {
		return splitter.countGraphemes(string) === 1;
	}
	else {
		return splitter.splitGraphemes(string).length === 1;
	}
}

/**
 * Determines if a given string includes at least one emoji.
 * @param string - The string to check.
 * @returns Whether or not the string includes at least one emoji.
 */
export function hasEmoji(string: string): boolean {
	const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
	return emojiRegex.test(string);
}

/**
 * Determines if a given string includes at least one symbol (non-alphanumeric character besides emojis).
 * Examples include ., !, @, #, $, %, ^, &, *, (, ), -, _, =, +, [, ], {, }, ;, :, ', ", ,, <, ., >, /, ?, \, |, ~, `.
 * @param string - The string to check.
 * @returns Whether or not the string includes at least one symbol.
 */
export function hasSymbol(string: string): boolean {
	const emojiSequenceRegex = /(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier})?(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier})?(?:\uFE0F)?)*|\p{Regional_Indicator}{2})/gu;
	const withoutEmoji = string.replace(emojiSequenceRegex, '');
	const withoutJoiners = withoutEmoji.replace(/(?:\u200D|\uFE0F|\p{Emoji_Modifier}\p{Regional_Indicator}{2})/gu, '');

	const symbolRegex = /[^\p{L}\p{N}\s]/gu;
	return symbolRegex.test(withoutJoiners);
}

/**
 * Determines if a given string includes at least one numeric character.
 * @param string - The string to check.
 * @returns Whether or not the string includes at least one numeric character.
 */
export function hasNumber(string: string): boolean {
	const numberRegex = /\p{N}/u;
	return numberRegex.test(string);
}

/**
 * Determines if a given string includes at least one letter character.
 * @param string - The string to check.
 * @returns Whether or not the string includes at least one letter character.
 */
export function hasLetter(string: string): boolean {
	const letterRegex = /[a-zA-Z]/u;
	return letterRegex.test(string);
}

/**
 * Determines if a given string includes at least one whitespace character.
 * @param string - The string to check.
 * @returns Whether or not the string includes at least one whitespace character.
 */
export function hasSpace(string: string): boolean {
	const spaceRegex = /\s/u;
	return spaceRegex.test(string);
}

/**
 * Determines if a given code point is a valid Unicode code point.
 * @param codePoint - The code point to check.
 * @returns Whether or not the code point is a valid Unicode code point.
 */
export function isUnicodeCodePoint(codePoint: number): boolean {
  if (codePoint <= 0) return false;
  if (codePoint > 0x10FFFF) return false;
  if (codePoint >= 0xD800 && codePoint <= 0xDFFF) return false;
  if (codePoint >= 0xFDD0 && codePoint <= 0xFDEF) return false;
  if (
		(codePoint & 0xFFFF) === 0xFFFE ||
		(codePoint & 0xFFFF) === 0xFFFF
	) return false;
  return true;
}

/**
 * Heuristic: Accept only "reasonable" printable characters.
 * - printable ASCII (space + 0x21..0x7E)
 * - Unicode Letters, Numbers, Punctuation, Symbols
 * - Extended_Pictographic (emoji / pictographs)
 * Excludes control chars, private use, surrogates, unassigned, and non-characters.
 * @param codePoint - The code point to check.
 * @returns Whether or not the code point is a "reasonable" printable character.
 */
export function isReasonableCodePoint(codePoint: number): boolean {
  if (!isUnicodeCodePoint(codePoint)) return false;

  // Allow single space
  if (codePoint === 0x20) return true;

  // Printable ASCII range
  if (codePoint >= 0x21 && codePoint <= 0x7E) return true;

  // Convert to string and test Unicode property categories.
  // Modern Node/V8 supports Unicode property escapes (\p{...}).
  // We check categories separately (avoids matching control / separator implicitly).
  const ch = String.fromCodePoint(codePoint);

  // Letters
  if (/\p{L}/u.test(ch)) return true;
  // Numbers
  if (/\p{N}/u.test(ch)) return true;
  // Punctuation
  if (/\p{P}/u.test(ch)) return true;
  // Symbols (math, currency, other symbols)
  if (/\p{S}/u.test(ch)) return true;
  // Extended pictographic covers emoji and many pictographs
  if (/\p{Extended_Pictographic}/u.test(ch)) return true;

  // Otherwise reject (includes separators, control chars, marks-only, unassigned, etc.)
  return false;
}

/**
 * Determines if a given string is a multi-line string.
 * A multi-line string is a string that contains at least one newline character.
 * @param string - The string to check.
 * @returns Whether or not the string is a multi-line string.
 */
export function isMultiLine(string: string): boolean {
	return string.includes('\n');
}

/**
 * Splits a given string into an array of individual characters,
 * taking into account Unicode graphemes.
 * @param string - The string to split.
 * @returns An array of individual characters.
 */
export function getCharacters(string: string): string[] {
	const splitter = new GraphemeSplitter();
	return splitter.splitGraphemes(string);
}

/**
 * Determines the number of distinct characters in a given string.
 * @param string - The string to check.
 * @returns The number of distinct characters in the string.
 */
export function getNumDistinctCharacters(string: string): number {
	const characters = getCharacters(string);
	return new Set(characters).size;
}