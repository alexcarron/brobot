const LogColor = Object.freeze({
	RED: 31,
	GREEN: 32,
	YELLOW: 33,
	BLUE: 34,
	MAGENTA: 35,
	CYAN: 36,
	WHITE: 37,
});

const stringifyNonString = (value) => {
	if (value === null) {
		return "null";
	}

	if (typeof value === "object") {
		return JSON.stringify(value, null, 2);
	}

	if (typeof value === "function") {
		return `[Function: ${value.name}]`;
	}

	if (typeof value === "symbol") {
		return `[Symbol: ${value.toString()}]`;
	}

	if (typeof value === "undefined") {
		return "undefined";
	}

	if (typeof value === "number") {
		return value.toString();
	}

	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}

	return value.toString();
}

/**
 * Logs a message to the console with the specified color.
 *
 * @param {string} message - The message to log.
 * @param {number} color - The ANSI color code for the text.
 */
const logWithColor = (message, color) => {
	if (typeof message !== "string")
		message = stringifyNonString(message);

	if (typeof color !== "number")
		throw new TypeError("Color must be a number.");

	if (!Object.values(LogColor).includes(color))
		throw new TypeError("Color must be a valid LogColor.");

	const resetColor = "\x1b[0m";
	const startColor = `\x1b[${color}m`;
	console.log(`${startColor}${message}${resetColor}`);
}

/**
 * Logs a formatted string to the console with the specified colors.
 *
 * Use Format: logWithColors`A normal message with ${['green', LogColor.GREEN]} and ${['blue', LogColor.BLUE]}.`;
 *
 * @param {Array<string>} strings - The strings to log, with placeholders for expressions.
 * @param {...Array<string | number, number>} expressions - The expressions to fill in the placeholders, with the first element of each expression being the value and the second element being the color.
 *
 * @throws {TypeError} If strings or expressions are not arrays.
 * @throws {TypeError} If strings contains non-string elements.
 * @throws {TypeError} If expressions contains non-tuple elements or tuple elements with incorrect length.
 * @throws {TypeError} If expressions contains tuple elements with invalid color.
 */
const logWithColors = (strings, ...expressions) => {
	if (!Array.isArray(strings))
		throw new TypeError("Strings must be an array.");

	// Ensure strings contains strings
	const newStrings = [];
	for (let index in strings) {
		let string = strings[index];

		if (typeof string !== "string")
			string = stringifyNonString(string);

		newStrings[index] = string;
	}

	if (!Array.isArray(expressions))
		throw new TypeError("Expressions must be an array.");

	expressions = expressions.map(expression => {
		if (!Array.isArray(expression))
			return [expression, undefined];

		if (expression.length < 2)
			return [expression[0], undefined];

		if (expression.length > 2)
			return [expression[0], expression[1]];

		if (!Object.values(LogColor).includes(expression[1]))
			throw new TypeError("Expression color must be a valid LogColor.");

		return expression;
	});

	// Stringify expressions
	expressions = expressions.map(expression => {
		let value = expression[0];

		if (typeof value !== "string")
			value = stringifyNonString(value);

		return [value, expression[1]];
	});

	// Construct the formatted string
	const formattedStrings = [];
	for (let index in newStrings) {
		let string = newStrings[index];
		let expression = expressions[index];

		if (expression === undefined)
			formattedStrings.push(string);
		else if (expression[1] === undefined)
			formattedStrings.push(string, expression[0]);
		else
			formattedStrings.push(string, `\x1b[${expression[1]}m${expression[0]}\x1b[0m`);
	}

	// Log the formatted string
	console.log(formattedStrings.join(''));
}

/**
 * Logs an error message to the console with the specified timestamp and
 * optional error stack trace.
 *
 * @param {string} message - The error message to log.
 * @param {Error} [error] - The optional error object to log the stack trace of.
 */
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

const logCategory = (category, color, message) => {
	if (typeof category !== "string")
    throw new TypeError("Category must be a string.");

  if (typeof message !== "string")
		message = stringifyNonString(message);

	if (!Object.values(LogColor).includes(color))
		throw new TypeError("Color must be a valid LogColor.");

  if (message.trim() === "")
    return;

	const categoryPrefix = `[${category.toUpperCase()}]`;

	logWithColors`${[categoryPrefix, color]} ${message}`;
}

/**
 * Logs a warning message to the console with a yellow color.
 *
 * @param {string} message - The warning message to log.
 */
const logWarning = (message) => {
	logCategory("WARNING", LogColor.YELLOW, message);
}

/**
 * Logs an information message to the console with the specified message.
 *
 * @param {string} message - The information message to log.
 */
const logInfo = (message) => {
	logCategory("INFO", LogColor.BLUE, message);
}

/**
 * Logs a success message to the console with a green color.
 *
 * @param {string} message - The success message to log.
 */
const logSuccess = (message) => {
	logCategory("SUCCESS", LogColor.GREEN, message);
}

/**
 * Logs a debug message to the console with a magenta color. This is used for debugging purposes and should not be used in production code.
 *
 * @param {string} message - The debug message to log.
 */
const logDebug = (message, includeTrace = false) => {
	logCategory("DEBUG", LogColor.MAGENTA, message);

	if (includeTrace) console.trace('Debug location:');
}

module.exports = { logWithColor, LogColor, logError, logWarning, logInfo, logSuccess, logDebug, logWithColors };