const LogColor = Object.freeze({
	RED: 31,
	GREEN: 32,
	YELLOW: 33,
	BLUE: 34,
	MAGENTA: 35,
	CYAN: 36,
	WHITE: 37,
});

/**
 * Logs a message to the console with the specified color.
 *
 * @param {string} message - The message to log.
 * @param {number} color - The ANSI color code for the text.
 */
const logWithColor = (message, color) => {
	if (typeof message !== "string")
		throw new TypeError("Message must be a string.");

	if (typeof color !== "number")
		throw new TypeError("Color must be a number.");

	if (!Object.values(LogColor).includes(color))
		throw new TypeError("Color must be a valid LogColor.");

	const resetColor = "\x1b[0m";
	const startColor = `\x1b[${color}m`;
	console.log(`${startColor}${message}${resetColor}`);
}

const logError = (message, error = null) => {
	const timestamp = new Date().toISOString();
	const errorPrefix = `[ERROR] ${timestamp}:`;

	logWithColor(`${errorPrefix} ${message}`, LogColor.RED);

	if (error && error instanceof Error) {
		logWithColor(`Stack Trace:`, LogColor.RED);
		console.error(error.stack);
	}

	console.trace('Error location:');
}

module.exports = { logWithColor, LogColor, logError };