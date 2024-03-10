const { logColor } = require("../functions");

class Logger {
	logDebug(message) {
		console.log(message);
	}

	log(message) {
		console.log(message)
	}

	logSubheading(message) {
		logColor("\n" + message, "cyan");
	}

	logHeading(message) {
		logColor("\n\n" + message, "red");
	}
}

module.exports = Logger;