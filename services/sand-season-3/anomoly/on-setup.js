const AnomolyService = require("./anomoly.service");

const setupAnomolyService = async () => {
	global.anomolyService = new AnomolyService();
}

module.exports = setupAnomolyService;