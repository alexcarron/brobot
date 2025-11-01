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

  try {
    const req =
			(globalThis as any).require
			?? (typeof require === 'function'
				? require
				: undefined
			);

    if (typeof req === 'function') {
      // Note: many installs export default; handle both
      const graphemeSplitter = req('grapheme-splitter')?.default ?? req('grapheme-splitter');
      if (graphemeSplitter) {
        const splitter = new graphemeSplitter();
        if (typeof splitter.countGraphemes === 'function') {
          return splitter.countGraphemes(string) === 1;
        }
				else {
          return splitter.splitGraphemes(string).length === 1;
        }
      }
    }
  }
	catch {
    // Fall through to next strategy
  }

  return Array.from(string).length === 1;
}