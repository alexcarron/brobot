const AnomolyService = require("./anomoly.service");

const setupAnomolyService = () => {
	global.anomolyService = new AnomolyService();
}

module.exports = setupAnomolyService;