const { setupClient } = require("./bot-config/setup-client");
const { setupCommands } = require("./bot-config/setup-commands");
const { logInfo, logSuccess } = require("./utilities/logging-utils");

const buildBrobot = async () => {
	logInfo("Building bot...");

	const client = await setupClient();
	await setupCommands(client);

	logSuccess("Bot built.");
}

buildBrobot();