const { Player } = require('discord-player');
const { botStatus } = require('./bot-status.js');
const RapidDiscordMafia = require('../services/rapid-discord-mafia/rapid-discord-mafia.js');
const { LLPointManager } = require('../services/ll-points/ll-point-manager.js');
const { logSuccess, logInfo } = require('../utilities/logging-utils.js');
const { loadObjectFromJsonInGitHub } = require('../utilities/github-json-storage-utils.js');
const Event = require('../services/discord-events/event.js');
const Timer = require('../services/timers/timer.js');
const DailyMessageHandler = require('../services/discussion-prompts/daily-message-handler.js');
const TextToSpeechHandler = require('../services/text-to-speech/text-to-speech-handler.js');


/**
 * Called when the client is ready to start running.
 * Sets up the following services:
 * - RapidDiscordMafia
 * - LLPointManager
 * - Events
 * - Timers
 * - Messages
 * - TextToSpeechHandler
 * @param {Client} client The client object that is ready
 */
const onClientReady = async (client) => {
	botStatus.isOn = true;

	global.music_queues = new Map();
	client.player = new Player(global.client, {
		ytdlOptions: {
			quality: "highestaudio",
			highWaterMark: 1 << 25
		}
	});

	logInfo("Setting up Rapid Discord Mafia");
	await RapidDiscordMafia.setUpRapidDiscordMafia();
	logSuccess("Rapid Discord Mafia set up");

	global.LLPointManager = new LLPointManager();

	logInfo("Loading viewers database");
	global.LLPointManager.setViewers(
		await loadObjectFromJsonInGitHub("viewers")
	);
	logSuccess("Viewers Database Downloaded");

	logInfo("Loading events database");
	const events_json = await loadObjectFromJsonInGitHub("events");
	let events = events_json.events;
	for (const event_index in events) {
		let event = events[event_index];
		event = new Event(event);
		event.restartCronJobs();
		events[event_index] = event;
	}
	global.events = events;
	logSuccess("Events Database Downloaded");

	logInfo("Loading timers database");
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
	logSuccess("Timers Database Downloaded");

	logInfo("Loading messages database");
	global.questions = [];
	global.channelsToMessages = await loadObjectFromJsonInGitHub("messages");
	logSuccess("Messages Database Downloaded");
	const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
	dailyMessageHandler.startDailyMessages();

	console.log("Setting up Text To Speech");
	global.tts = new TextToSpeechHandler();

	logSuccess('Brobot is Ready!');
};

module.exports = { onClientReady };
