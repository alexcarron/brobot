const { setupEventListeners } = require('./event-listeners/event-listener-setup.js');
const { logInfo } = require('./utilities/logging-utils.js');
const { Events } = require('discord.js');
const { setupCommands, setupAndDeployCommands } = require('./bot-config/setup-commands.js');
const { setupClient } = require('./bot-config/setup-client.js');
const { onClientReady } = require('./bot-config/on-ready.js');

const DEPLOY_GUILD_COMMANDS_OPTIONS = [
	'--deploy-commands',
	'--deployCommands',
	'--deploy',
	'--dc',
	'--d',
];

const DEPLOY_ALL_OPTIONS = [
	'--deploy-all-commands',
	'--deployAllCommands',
	'--deployAll',
	'--da',
];

const startBrobot = async () => {
	logInfo(`Using discord.js version: ${require('discord.js').version}`);

	const commandArguments = process.argv;
	const isDeploying = commandArguments.some(argument => DEPLOY_GUILD_COMMANDS_OPTIONS.includes(argument));
	const isDeployingAll = commandArguments.some(argument => DEPLOY_ALL_OPTIONS.includes(argument));

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
		await onClientReady(client);
	});
}

// 0.87

startBrobot();
