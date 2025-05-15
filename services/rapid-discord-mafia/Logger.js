const { logWithColor, LogColor } = require("../../utilities/logging-utils");

class Logger {
	logDebug(message) {
		console.log(message);
	}

	log(message) {
		console.log(message);
	}

	logSubheading(message) {
		logWithColor("\n" + message, LogColor.CYAN);
	}

	logHeading(message) {
		logWithColor("\n\n" + message, LogColor.RED);
	}
}

module.exports = Logger;