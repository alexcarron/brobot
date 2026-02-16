export const LogColor = Object.freeze({
	RED: 31,
	GREEN: 32,
	YELLOW: 33,
	BLUE: 34,
	MAGENTA: 35,
	CYAN: 36,
	WHITE: 37,
});

/**
 * Converts a given value into a string, regardless of its type.
 * @param value The value to convert to a string.
 * @returns The string representation of the given value.
 */
export function stringifyNonString(value: unknown): string {
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
 * @param message - The message to log.
 * @param color - The ANSI color code for the text.
 */
export function logWithColor(message: string | unknown, color: number): void {
	if (typeof message !== "string")
		message = stringifyNonString(message);

	if (typeof color !== "number")
		throw new TypeError("Color must be a number.");

	// @ts-ignore - color can be any type without causing an error
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
 * @param strings - The strings to log, with placeholders for expressions.
 * @param expressions - The expressions to fill in the placeholders, with the first element of each expression being the value and the second element being the color.
 * @throws {TypeError} If strings or expressions are not arrays.
 * @throws {TypeError} If strings contains non-string elements.
 * @throws {TypeError} If expressions contains non-tuple elements or tuple elements with incorrect length.
 * @throws {TypeError} If expressions contains tuple elements with invalid color.
 */
export function logWithColors(
	strings: TemplateStringsArray | (string | number)[], 
	...expressions: Array<
		| [(string | number), (number | undefined)] 
		| string
	>
): void {
	if (!Array.isArray(strings))
		throw new TypeError("Strings must be an array.");

	// Ensure strings contains strings
	const newStrings: string[] = [];
	for (const index in strings) {
		let string = strings[index];

		if (typeof string !== "string")
			string = stringifyNonString(string);

		newStrings[index] = string;
	}

	if (!Array.isArray(expressions))
		throw new TypeError("Expressions must be an array.");

	const valueWithColors: [(string | number), number | undefined][] = expressions.map(expression => {
		if (!Array.isArray(expression))
			return [expression, undefined];

		if (expression.length < 2)
			return [expression[0], undefined];

		if (expression.length > 2)
			return [expression[0], expression[1]];

		// @ts-ignore - expression[1] can be any type without causing a type error
		if (!Object.values(LogColor).includes(expression[1]))
			throw new TypeError("Expression color must be a valid LogColor.");

		return expression;
	});

	// Stringify expressions
	const stringColors: [string, number | undefined][] = valueWithColors.map(expression => {
		let value = expression[0];

		if (typeof value !== "string")
			value = stringifyNonString(value);

		return [value, expression[1]];
	});

	// Construct the formatted string
	const formattedStrings: string[] = [];
	for (const index in newStrings) {
		const string = newStrings[index];
		const expression = stringColors[index];

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
 * @param message - The error message to log.
 * @param error - The optional error object to log the stack trace of.
 */
export function logError(message: string, error: Error | undefined = undefined): void {
	const timestamp = new Date().toISOString();
	const errorPrefix = `[ERROR] ${timestamp}:`;

	logWithColor(`${errorPrefix} ${message}`, LogColor.RED);

	if (error && error instanceof Error) {
		logWithColor(`Stack Trace:`, LogColor.RED);
		console.error(error.stack);
	}

	console.trace('Error location:');
}

/**
 * Logs a message to the console with a category prefix and specified color.
 * @param category - The category to log the message under.
 * @param color - The color to use when logging the message.
 * @param message - The message to log.
 * @throws {TypeError} If category is not a string.
 * @throws {TypeError} If color is not a valid LogColor.
 */
export function logCategory(category: string, color: number, message: string | unknown): void {
	if (typeof category !== "string")
		throw new TypeError("Category must be a string.");

	if (typeof message !== "string")
		message = stringifyNonString(message);

	if (typeof message !== "string")
		throw new TypeError("Message must be a string or a non-string value that can be stringified.");

	// @ts-ignore
	if (!Object.values(LogColor).includes(color))
		throw new TypeError("Color must be a valid LogColor.");

	if ((message as string).trim() === "")
		return;

	const categoryPrefix = `[${category.toUpperCase()}]`;

	logWithColors`${[categoryPrefix, color]} ${message}`;
}

/**
 * Logs a warning message to the console with a yellow color.
 * @param message - The warning message to log.
 */
export function logWarning(message: string): void {
	logCategory("WARNING", LogColor.YELLOW, message);
}

/**
 * Logs an information message to the console with the specified message.
 * @param message - The information message to log.
 */
export function logInfo(message: string): void {
	logCategory("INFO", LogColor.BLUE, message);
}

/**
 * Logs a success message to the console with a green color.
 * @param message - The success message to log.
 */
export function logSuccess(message: string): void {
	logCategory("SUCCESS", LogColor.GREEN, message);
}

/**
 * Logs a debug message to the console with a magenta color. This is used for debugging purposes and should not be used in production code.
 * @param message - The debug message to log.
 * @param includeTrace - Whether to include the stack trace of the debug message.
 */
export function logDebug(message: string, includeTrace: boolean = false): void {
	logCategory("DEBUG", LogColor.MAGENTA, message);

	if (includeTrace) console.trace('Debug location:');
}

/** Shared state for all currently active logSetup rows in a batch. */
const setupLines: string[] = [];

/**
 * Re-renders all active setup lines in place by moving the cursor up to the
 * top of the setup block and overwriting every line cleanly.
 */
const renderSetupLines = (): void => {
	if (setupLines.length === 0) return;

	// Move cursor up to the top of the entire setup block
	process.stdout.write(`\x1b[${setupLines.length}A`);

	for (const line of setupLines) {
		process.stdout.write(`\r\x1b[2K${line}\n`);
	}
};

/**
 * Builds a formatted [SETUP] log line string without a newline, suitable for
 * overwriting in place on the terminal using cursor positioning.
 * @param label - The label describing the setup process.
 * @param status - The status message to display.
 * @param statusColor - The ANSI color code for the status text.
 * @param suffix - An optional suffix to append (e.g. elapsed time).
 * @param suffixColor - The ANSI color code for the suffix text.
 * @returns The formatted log line string.
 */
export function buildSetupLogLine(label: string, status: string, statusColor: number, suffix: string = "", suffixColor: number | undefined = undefined): string {
	const reset = "\x1b[0m";
	const cyan = `\x1b[${LogColor.CYAN}m`;
	const statusColorCode = `\x1b[${statusColor}m`;
	const suffixPart = (suffix && suffixColor)
		? ` \x1b[${suffixColor}m${suffix}${reset}`
		: suffix
			? ` ${suffix}`
			: "";

	return `${cyan}[SETUP]${reset} ${label} — ${statusColorCode}${status}${reset}${suffixPart}`;
}

/**
 * Wraps a function, async function, or promise with structured setup logging.
 * All concurrent logSetup calls share a single rendered block that is redrawn
 * atomically on every status change, so no setup ever corrupts another's line.
 * @example
 * await logSetup("Loading timers database", () => setupTimers());
 * await logSetup("Loading timers database", setupTimers());
 * @param label - The label describing the setup process.
 * @param setup - The function or promise to track.
 * @returns The result of the setup function or promise.
 * @throws {TypeError} If label is not a string.
 * @throws {TypeError} If setup is not a function or promise.
 */
export async function logSetup(label: string, setup: (() => unknown) | (() => Promise<unknown>) | Promise<unknown>): Promise<unknown> {
	if (typeof label !== "string")
		throw new TypeError("Label must be a string.");

	if (typeof setup !== "function" && !(setup instanceof Promise))
		throw new TypeError("Setup must be a function or a promise.");

	const startTime = Date.now();
	const getElapsed = () => `(${((Date.now() - startTime) / 1000).toFixed(2)}s)`;

	// Claim a slot in the shared lines array synchronously before any await.
	// JS single-thread guarantees no other logSetup call can interleave here.
	const slotIndex = setupLines.length;
	const isFirstSetup = slotIndex === 0;

	setupLines.push(buildSetupLogLine(label, "Started", LogColor.CYAN));

	// First setup claims the top of the block by printing a newline for each
	// slot. Subsequent setups are already accounted for in the render block.
	if (isFirstSetup) {
		process.stdout.write("\n");
	}
	else {
		// Reserve an additional row for this setup in the render block
		process.stdout.write(`\x1b[${setupLines.length - 1}A`);
		process.stdout.write(`\r\x1b[2K`);
		process.stdout.write(`\x1b[${setupLines.length - 1}B`);
		process.stdout.write("\n");
	}

	/**
	 * Updates this setup's slot in the shared lines array and triggers a full
	 * re-render of the entire setup block so all lines are redrawn cleanly.
	 * @param status - The status message to display.
	 * @param statusColor - The ANSI color code for the status text.
	 * @param suffix - An optional suffix to append (e.g. elapsed time).
	 * @param suffixColor - The ANSI color code for the suffix text.
	 */
	const updateLine = (status: string, statusColor: number, suffix: string = "", suffixColor: number | undefined = undefined): void => {
		setupLines[slotIndex] = buildSetupLogLine(label, status, statusColor, suffix, suffixColor);
		renderSetupLines();
	};

	const promise = typeof setup === "function" ? setup() : setup;

	if (!(promise instanceof Promise)) {
		updateLine("Finished", LogColor.GREEN, getElapsed(), LogColor.GREEN);
		return promise;
	}

	updateLine("In Progress...", LogColor.YELLOW);

	try {
		const result = await promise;
		updateLine("Finished", LogColor.GREEN, getElapsed(), LogColor.GREEN);
		return result;
	}
	catch (error) {
		updateLine("Failed", LogColor.RED, getElapsed(), LogColor.RED);
		throw error;
	}
}

/**
 * Clears the setup render block state after a Promise.all batch of logSetup
 * calls completes, so subsequent logs appear flush below the finished setup
 * lines without any gap.
 * Must be called after every Promise.all that contains logSetup calls.
 */
export function resetSetupRows(): void {
	setupLines.length = 0;
}