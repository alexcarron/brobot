const { logWithColor, LogColor, logDebug, logInfo } = require("../../utilities/logging-utils");

/**
 * A logger for the rapid-discord-mafia bot
 */
class Logger {
	/**
	 * Logs a debug message.
	 * @param {string} message The message to log.
	 */
	logDebug(message) {
		logDebug(message);
	}

	/**
	 * Logs a message as an info message.
	 * @param {string} message The message to log.
	 */
	log(message) {
		logInfo(message);
	}

	/**
	 * Logs a message as a subheading.
	 * A subheading is a cyan-colored message that is logged with a newline before and after the message.
	 * @param {string} message The message to log as a subheading.
	 */
	logSubheading(message) {
		logWithColor("\n" + message, LogColor.CYAN);
	}

	/**
	 * Logs a message as a heading.
	 * A heading is a red-colored message that is logged with two newlines before and after the message.
	 * @param {string} message The message to log as a heading.
	 */
	logHeading(message) {
		logWithColor("\n\n" + message, LogColor.RED);
	}
}

module.exports = Logger;