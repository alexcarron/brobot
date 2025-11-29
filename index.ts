import { initialBotStatus } from "./bot-config/bot-status";
import { setupEventListeners } from './event-listeners/event-listener-setup';
import { logInfo, logSuccess } from './utilities/logging-utils.js';
import { Events } from 'discord.js';
import { onClientReady } from './bot-config/on-ready.js';
import { setupAndDeployCommands, setupCommands } from "./bot-config/setup-commands";
import { setupClient } from "./bot-config/setup-client";

const DEPLOY_GUILD_COMMANDS_OPTIONS = [
	'--deploy-guild-commands',
	'--deployGuildCommands',
	'--deploy-guild',
	'--deployGuild',
];

const DEPLOY_ALL_OPTIONS = [
	'--deploy-all-commands',
	'--deployAllCommands',
	'--deploy-all',
	'--deployAll',
	'--dac',
	'--da',
];

const DEVELOPMENT_ENVIRONMENT_OPTIONS = [
	'--dev',
	'--development',
	'--dev-env',
	'--devEnvironment',
];

const startBrobot = async () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	logInfo(`Using discord.js version: ${require('discord.js').version}`);

	const commandArguments = process.argv;
	const isDeploying = commandArguments.some(argument => DEPLOY_GUILD_COMMANDS_OPTIONS.includes(argument));
	const isDeployingAll = commandArguments.some(argument =>
		DEPLOY_ALL_OPTIONS.includes(argument)
	);
	const isDevelopmentEnvironment = commandArguments.some(argument =>
		DEVELOPMENT_ENVIRONMENT_OPTIONS.includes(argument)
	);

	global.botStatus = initialBotStatus;
	if (isDevelopmentEnvironment) {
		global.botStatus.isInDevelopmentMode = true;
	}

	const client = await setupClient();

	if (isDeployingAll)
		await setupAndDeployCommands({client});
	else if (isDeploying)
		await setupAndDeployCommands({client, skipGlobalCommands: true});
	else
		setupCommands(client);

	setupEventListeners(client);

	// when the client is ready, run this code
	// this event will only trigger one time after Brobot has successfully fully connected to the Discord API
	global.client.once(Events.ClientReady, async () => {
		await onClientReady();
	});
}

startBrobot()
	.then(() => logSuccess("Finished starting Brobot"))
	.catch(console.error);
