const { setupEventListeners } = require('./event-listeners/event-listener-setup.js');
const { logInfo } = require('./utilities/logging-utils.js');
const { Events } = require('discord.js');
const {setupCommands} = require('./bot-config/setup-commands.js');
const { setupClient } = require('./bot-config/setup-client.js');
const { onClientReady } = require('./bot-config/on-ready.js');
const { logFunctionDuration } = require('./utilities/realtime-utils.js');

const startBrobot = async () => {
	logInfo(`Using discord.js version: ${require('discord.js').version}`);

	const client = await setupClient();
	setupEventListeners(client);
	await setupCommands(client);

	// when the client is ready, run this code
	// this event will only trigger one time after Brobot has successfully fully connected to the Discord API
	global.client.once(Events.ClientReady, async () => {
		await onClientReady(client);
	});
}

startBrobot();
