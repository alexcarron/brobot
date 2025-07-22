const { logWithColor, LogColor, logDebug, logInfo } = require("../../utilities/logging-utils");

/**
 * A logger for the rapid-discord-mafia bot
 */
class Logger {
	logDebug(message) {
		logDebug(message);
	}

	log(message) {
		logInfo(message);
	}

	logSubheading(message) {
		logWithColor("\n" + message, LogColor.CYAN);
	}

	logHeading(message) {
		logWithColor("\n\n" + message, LogColor.RED);
	}
}

module.exports = Logger;