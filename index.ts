const { setupEventListeners } = require('./event-listeners/event-listener-setup.js');
const { logInfo } = require('./utilities/logging-utils.js');
const { Events } = require('discord.js');
const { onClientReady } = require('./bot-config/on-ready.js');
const { botStatus } = require('./bot-config/bot-status.js');

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
	logInfo(`Using discord.js version: ${require('discord.js').version}`);

	const commandArguments = process.argv;
	const isDeploying = commandArguments.some(argument => DEPLOY_GUILD_COMMANDS_OPTIONS.includes(argument));
	const isDeployingAll = commandArguments.some(argument =>
		DEPLOY_ALL_OPTIONS.includes(argument)
	);
	const isDevelopmentEnvironment = commandArguments.some(argument =>
		DEVELOPMENT_ENVIRONMENT_OPTIONS.includes(argument)
	);

	if (isDevelopmentEnvironment) {
		botStatus.isInDevelopmentMode = true;
	}

	const { setupCommands, setupAndDeployCommands } = require('./bot-config/setup-commands');
	const { setupClient } = require('./bot-config/setup-client');

	const client = await setupClient();

	if (isDeployingAll)
		await setupAndDeployCommands({client});
	else if (isDeploying)
		await setupAndDeployCommands({client, skipGlobalCommands: true});
	else
		setupCommands(client, isDevelopmentEnvironment);

	setupEventListeners(client);

	// when the client is ready, run this code
	// this event will only trigger one time after Brobot has successfully fully connected to the Discord API
	global.client.once(Events.ClientReady, async () => {
		await onClientReady();
	});
}

// 0.87

startBrobot();
