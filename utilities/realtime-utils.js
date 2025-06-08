/**
 * Waits for a specified duration of time.
 * @param {number|object} duration The duration of time to wait.
 *  If a number, it is interpreted as milliseconds.
 *  If an object, it should have the following properties:
 *   - milliseconds: number of milliseconds
 *   - seconds: number of seconds
 *   - minutes: number of minutes
 *   - hours: number of hours
 *   - days: number of days
 * @returns {Promise} A promise that resolves after the specified duration.
 */
const wait = async (duration) => {
	let totalMilliseconds;

	// If a number, interpret as milliseconds
	if (typeof duration === 'number') {
		if (duration < 0) {
			throw new Error('Duration cannot be negative.');
		}
		totalMilliseconds = duration;
	}
	else if (typeof duration === 'object') {
		// If an object, use the following aliases to determine the duration
		const millisecondAliases = ['ms', 'millisecond', 'milliseconds'];
		const secondAliases = ['s', 'sec', 'secs', 'second', 'seconds'];
		const minuteAliases = ['m', 'min', 'mins', 'minute', 'minutes'];
		const hourAliases = ['h', 'hour', 'hours'];
		const dayAliases = ['d', 'day', 'days'];

		// Helper function to get the value from an object using a list of aliases
		const getValueFromAliases = (duration, aliases) => {
			let value = 0;
			aliases.forEach(alias => {
				if (duration.hasOwnProperty(alias)) {
					value = duration[alias];
				}
			});
			return value;
		}

		const milliseconds = getValueFromAliases(duration, millisecondAliases);
		const seconds = getValueFromAliases(duration, secondAliases);
		const minutes = getValueFromAliases(duration, minuteAliases);
		const hours = getValueFromAliases(duration, hourAliases);
		const days = getValueFromAliases(duration, dayAliases);

		totalMilliseconds =
			milliseconds +
			seconds * 1000 +
			minutes * 60 * 1000 +
			hours * 60 * 60 * 1000 +
			days * 24 * 60 * 60 * 1000;

		if (totalMilliseconds < 0) {
			throw new Error('Total duration cannot be negative.');
		}
	}
	else {
		throw new Error("Invalid duration format. Use a number or an object specifying time units.");
	}

	// Return a promise that resolves after the specified duration
	return new Promise(resolve =>
		setTimeout(resolve, Math.round(totalMilliseconds))
	);
}

/**
 * Logs how many milliseconds have elapse  with a custom message.
 * @param {string} message The message to be logged.
 * @param {function} asyncFunction The function to be called.
 * @param {...*} args The arguments to be passed to the function.
 * @returns {Promise<void>} A promise that resolves after the function has been called.
 */
const logFunctionDuration = async (message, asyncFunction, ...args) => {
	const startTime = performance.now();
	await asyncFunction(...args);
	const endTime = performance.now();
	console.log(`${message}: ${Math.round(endTime - startTime)}ms`);
}

module.exports = { wait, logFunctionDuration };