/**
 * Converts a given string to title case.
 * @param {string} string - The string to convert.
 * @returns {string} The string in title case.
 */
const toTitleCase = (string) => {
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
 * @param {number} currentValue - The current value which will eventually reach the total.
 * @param {number} totalValue - The total value the current value will eventually reach.
 * @param {number} characterSize - The total number of characters used to represent the progress bar.
 * @returns {string} A string representation of the progress bar.
 */
const createTextProgressBar = (currentValue, totalValue, characterSize) => {
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

		// 0.33 *

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
 * @param {number} number - The number to convert.
 * @returns {string} The ordinal representation of the number.
 * @throws {Error} Throws an error if the input is not a valid number.
 */
const toNumericOrdinal = (number) => {
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
 * @param {number} number - The number to convert.
 * @returns {string} The word ordinal representation of the number.
 * @throws {Error} Throws an error if the input is not a valid number or too large.
 */
const toWordOrdinal = (number) => {
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

module.exports = { toTitleCase, createTextProgressBar, toNumericOrdinal, toWordOrdinal };
