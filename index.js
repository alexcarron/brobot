const RapidDiscordMafia = require('./services/rapid-discord-mafia/rapid-discord-mafia.js');
const Event = require('./services/discord-events/event.js');
const Timer = require('./services/timers/timer.js');
const { Player } = require("discord-player");

console.log(`discord.js version: ${require('discord.js').version}`);

const
	ids = require('./bot-config/discord-ids.js'),
	fs = require("fs"), // Used to interact with file system
	Discord = require('discord.js'),
	{ REST, Routes, Events, GatewayIntentBits, Partials } = require('discord.js');

global.client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction
	]
});

// ! Create global paths object to store directories
const { Collection } = require('discord.js');
const SlashCommand = require('./services/command-creation/slash-command.js');
const TextToSpeechHandler = require('./services/text-to-speech/text-to-speech-handler.js');
const DailyMessageHandler = require('./services/discussion-prompts/daily-message-handler.js');
const path = require('path');
const { setupEventListeners } = require('./event-listeners/event-listener-setup.js');
const { loadObjectFromJsonInGitHub } = require('./utilities/github-json-storage-utils.js');
const { DISCORD_TOKEN } = require('./bot-config/token.js');
const { botStatus } = require('./bot-config/bot-status.js');
const { LLPointManager } = require('./services/ll-points/ll-point-manager.js');

// ! Store a list of command cooldowns
client.cooldowns = new Collection();

// ! Store commands to client
global.client.commands = new Discord.Collection();
global.client.slash_commands = new Discord.Collection();

const public_slash_commands = [];
const private_slash_commands = {};
const commandDirectoryPath = path.join(__dirname, 'commands');

function getAllJSFiles(directoryPath) {
	const jsFiles = [];

	function recurse(currentPath) {
		const fileEntries = fs.readdirSync(currentPath, { withFileTypes: true });

		for (const fileEntry of fileEntries) {
			const fullPath = path.join(currentPath, fileEntry.name);
			if (fileEntry.isDirectory()) {
				recurse(fullPath);
			}
			else if (fileEntry.isFile() && fileEntry.name.endsWith('.js')) {
				jsFiles.push(fullPath);
			}
		}
	}

	recurse(directoryPath);
	return jsFiles;
}

(async () => {
	const commandFilePaths = getAllJSFiles(commandDirectoryPath);

	for (const commandFilePath of commandFilePaths) {
		let command = await require(commandFilePath);

		if (command instanceof SlashCommand) {
			console.log('Building slash command /' + command.name);
			command = await command.getCommand();
		}

		if ("execute" in command) {
			if ("data" in command) {
				if (command.required_servers) {
					for (const required_server of command.required_servers) {
						if (!private_slash_commands[required_server])
							private_slash_commands[required_server] = [command.data.toJSON()];
						else
							private_slash_commands[required_server].push(command.data.toJSON());
					}
				}
				else {
					public_slash_commands.push(command.data.toJSON());
				}
				global.client.commands.set(command.data.name, command);
			} else
				global.client.commands.set(command.name, command);
		}
		else {
			console.log(`[WARNING] The command ${commandFilePath} is missing a required "execute" property.`);
		}
	}

	// ! Deploy slash commands
	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(DISCORD_TOKEN);

	try {
		console.log(`Started refreshing application (/) commands.`);
		console.log(public_slash_commands.map(command => command.name));

		Object.values(private_slash_commands).forEach(commands => {
			console.log(commands.map(cmd => cmd.name))
		})

		// The put method is used to fully refresh all commands in the guild with the current set
		for (const required_server_id in private_slash_commands) {
			const slash_commands = private_slash_commands[required_server_id];

			console.log("Reloading " + slash_commands.length + " private slash commands...");

			await rest.put(
				Routes.applicationGuildCommands(ids.client, required_server_id),
				{ body: slash_commands },
			);

			console.log("Reloaded " + slash_commands.length + " private slash commands...");
		}
		console.log("Reloading " + public_slash_commands.length + " public slash commands...");
		await rest.put(
			Routes.applicationCommands(ids.client),
			{ body: public_slash_commands },
		);
		console.log("Reloaded " + public_slash_commands.length + " public slash commands...");



		console.log(`Successfully reloaded application (/) commands.`);

		// ! Delete Guild Command
		// rest.delete(Routes.applicationGuildCommand(ids.client, ids.servers.rapid_discord_mafia, "1146264673470136350"))
		// .then(() => console.log('Successfully deleted guild command'))
		// .catch(console.error);

		// ! Delete Every Guild Command
		// rest.put(Routes.applicationGuildCommands(ids.client, ids.servers.ll_game_show_center), { body: [] })
		// .then(() => console.log('Successfully deleted all guild commands.'))
		// .catch(console.error);

		// ! Delete Global Commands
		// rest.delete(Routes.applicationCommand(ids.client, 'COMMAND ID'))
		// .then(() => console.log('Successfully deleted application command'))
		// .catch(console.error);

		//! Delete Every Global Command
		// rest.put(Routes.applicationCommands(ids.client), { body: [] })
		// .then(() => console.log('Successfully deleted all application commands.'))
		// .catch(console.error);

	}
	catch (error) {
		console.error(error);
	}
})();

// Authenticate and connect Brobot to Discord API
global.client.login(DISCORD_TOKEN);

// when the client is ready, run this code
// this event will only trigger one time after Brobot has successfully fully connected to the Discord API
global.client.once(Events.ClientReady, async () => {
	client.user.setPresence({
		activities: [{
				name: 'How to Cook Spaghetti',
				type: Discord.ActivityType.Streaming,
				url: 'https://twitch.tv/jackofalltrade5'
		}],
		status: 'online'
	});

	botStatus.isOn = true;
	console.log("I'm turned on");

	global.music_queues = new Map();
	global.client.player = new Player(global.client, {
		ytdlOptions: {
			quality: "highestaudio",
			highWaterMark: 1 << 25
		}
	});

	await RapidDiscordMafia.setUpRapidDiscordMafia();

	global.LLPointManager = new LLPointManager();
	console.log("Global module instantiated");

	global.LLPointManager.setViewers(
		await loadObjectFromJsonInGitHub("viewers")
	);
	console.log("Viewers Database Downloaded");

	const events_json = await loadObjectFromJsonInGitHub("events");
	let events = events_json.events;
	for (const event_index in events) {
		let event = events[event_index];
		event = new Event(event);
		event.restartCronJobs();
		events[event_index] = event;
	}
	global.events = events;
	console.log("Events Database Downloaded");

	const timers_json = await loadObjectFromJsonInGitHub("timers");
	let timers = timers_json.timers;
	for (const timer_index in timers) {
		let timer = timers[timer_index];
		timer = new Timer(timer);
		timers[timer_index] = timer;
	}
	global.timers = timers;
	for (const timer of global.timers) {
		await timer.startCronJob();
	}
	console.log("Timers Database Downloaded");

	global.questions = [];
	global.channelsToMessages = await loadObjectFromJsonInGitHub("messages");
	console.log("Messages Database Downloaded");
	const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
	dailyMessageHandler.startDailyMessages();

	global.tts = new TextToSpeechHandler();

	console.log('Ready!');
});

setupEventListeners(global.client);
