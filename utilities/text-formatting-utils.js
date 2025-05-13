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

module.exports = { toTitleCase };
