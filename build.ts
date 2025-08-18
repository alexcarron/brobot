import { initialBotStatus } from "./bot-config/bot-status";
import { logInfo, logSuccess } from "./utilities/logging-utils";

const GUILD_COMMANDS_ONLY_OPTIONS = [
	'--without-global-commands',
	'--withoutGlobalCommands',
	'--no-global-commands',
	'--noGlobalCommands',
	'--no-global',
	'--noGlobal',
	'--guild-commands-only',
	'--guildCommandsOnly',
	'--guild-commands',
	'--guildCommands',
];

const DEVELOPMENT_ENVIRONMENT_OPTIONS = [
	'--dev',
	'--development',
	'--dev-env',
	'--devEnvironment',
];

/**
 * Initializes and builds the bot by setting up the Discord client and deploying commands.
 * Use if command parameters or access level change or if new commands are added or removed.
 */
const buildBrobot = async () => {
	logInfo("Building bot...");

	let isSkippingGlobalCommands = false;

	const commandArguments = process.argv;
	if (commandArguments.some(argument => GUILD_COMMANDS_ONLY_OPTIONS.includes(argument))) {
		logInfo("Skipping deployment of global commands.");
		isSkippingGlobalCommands = true;
	}
	const isDevelopmentEnvironment = commandArguments.some(argument =>
		DEVELOPMENT_ENVIRONMENT_OPTIONS.includes(argument)
	);

	global.botStatus = initialBotStatus;
	if (isDevelopmentEnvironment) {
		global.botStatus.isInDevelopmentMode = true;
	}

	const { setupClient } = require("./bot-config/setup-client");
	const { setupAndDeployCommands } = require("./bot-config/setup-commands");

	const client = await setupClient();
	await setupAndDeployCommands({
		client,
		skipGlobalCommands: isSkippingGlobalCommands
	});

	logSuccess("Bot built.");

	process.exit(0);
}

buildBrobot();