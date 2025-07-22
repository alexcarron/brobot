const AnomolyService = require("./anomoly.service");

/**
 * Retrieves the Anomoly service. If the service is not setup yet, throw an error.
 * @returns {AnomolyService} The Anomoly service.
 * @throws {Error} If the service is not setup yet.
 */
const getAnomolyService = () => {
	if (global.anomolyService === undefined) {
		throw new Error("Anomoly Service is not setup yet");
	}

	return global.anomolyService;
}

module.exports = getAnomolyService