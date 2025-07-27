const { botStatus } = require('./bot-status.js');
const RapidDiscordMafia = require('../services/rapid-discord-mafia/rapid-discord-mafia.js');
const { LLPointManager } = require('../services/ll-points/ll-point-manager.js');
const { logSuccess, logInfo } = require('../utilities/logging-utils.js');
const { loadObjectFromJsonInGitHub } = require('../utilities/github-json-storage-utils.js');
const Event = require('../services/discord-events/event.js');
const Timer = require('../services/timers/timer.js');
const DailyMessageHandler = require('../services/discussion-prompts/daily-message-handler.js');
const TextToSpeechHandler = require('../services/text-to-speech/text-to-speech-handler.js');
const { setupNamesmith } = require('../services/namesmith/event-listeners/on-setup');
const setupAnomolyService = require('../services/sand-season-3/anomoly/on-setup');

/**
 * Called when the client is ready to start running.
 * Sets up the following services:
 * - RapidDiscordMafia
 * - LLPointManager
 * - Events
 * - Timers
 * - Messages
 * - TextToSpeechHandler
 */
const onClientReady = async () => {
	botStatus.isOn = true;

	setupNamesmith();
	setupAnomolyService();

	logInfo("Loading timers database");
	const timersJSON = await loadObjectFromJsonInGitHub("timers");
	let timers = timersJSON.timers;
	for (const timerIndex in timers) {
		let timer = timers[timerIndex];
		timer = new Timer(timer);
		timers[timerIndex] = timer;
	}
	global.timers = timers;
	for (const timer of global.timers) {
		await timer.startCronJob();
	}
	logSuccess("Timers Database Downloaded");

	logInfo('Setting up Text to Speech');
	global.tts = new TextToSpeechHandler();
	logSuccess('Text to Speech set up');

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

	logInfo("Loading messages database");
	global.questions = [];
	global.channelsToMessages = await loadObjectFromJsonInGitHub("messages");
	logSuccess("Messages Database Downloaded");
	const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
	dailyMessageHandler.startDailyMessages();

	logSuccess('Brobot is Ready!');
};

module.exports = { onClientReady };
