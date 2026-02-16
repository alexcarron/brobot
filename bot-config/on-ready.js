const RapidDiscordMafia = require('../services/rapid-discord-mafia/rapid-discord-mafia.js');
const { LLPointManager } = require('../services/ll-points/ll-point-manager.js');
const { logSuccess, logSetup, resetSetupRows } = require('../utilities/logging-utils');
const { loadObjectFromJsonInGitHub } = require('../utilities/persistent-storage-utils.js');
const Event = require('../services/discord-events/event.js');
const Timer = require('../services/timers/timer.js');
const DailyMessageHandler = require('../services/discussion-prompts/daily-message-handler.js');
const TextToSpeechHandler = require('../services/text-to-speech/text-to-speech-handler.js');
const { setupNamesmith } = require('../services/namesmith/event-listeners/on-setup');
const { isStringToStringsRecord } = require('../utilities/types/type-guards');
const { InitializationError } = require('../utilities/error-utils');

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
	global.botStatus.isOn = true;
	const setupTimers = async () => {
		const timersJSON = await loadObjectFromJsonInGitHub("timers");
		let timers = [];
		if ("timers" in timersJSON && Array.isArray(timersJSON.timers)) {
			timers = timersJSON.timers;
		}
		for (const timerIndex in timers) {
			let timer = timers[timerIndex];
			timer = new Timer(timer);
			timers[timerIndex] = timer;
		}
		global.timers = timers;
		for (const timer of global.timers) {
			timer.startCronJob();
		}
	};

	const setupTextToSpeech = () => {
		global.tts = new TextToSpeechHandler();
	};

	const setupLLPointManager = async () => {
		global.LLPointManager = new LLPointManager();
		global.LLPointManager.setViewers(
			// @ts-ignore
			await loadObjectFromJsonInGitHub("viewers")
		);
	};

	const setupEvents = async () => {
		const events_json = await loadObjectFromJsonInGitHub("events");
		let events = [];
		if ("events" in events_json && Array.isArray(events_json.events)) {
			events = events_json.events;
		}
		for (const event_index in events) {
			let event = events[event_index];
			event = new Event(event);
			event.restartCronJobs();
			events[event_index] = event;
		}
		global.events = events;
	};

	const setupMessages = async () => {
		global.questions = [];
		const channelsToMessages = await loadObjectFromJsonInGitHub("messages");
		if (isStringToStringsRecord(channelsToMessages)) {
			global.channelsToMessages = channelsToMessages;
		}
		else {
			throw new InitializationError(`Loaded messages GitHub database is not in format of string to string[]: ${JSON.stringify(channelsToMessages)}`);
		}
		const dailyMessageHandler = new DailyMessageHandler(global.channelsToMessages);
		dailyMessageHandler.startDailyMessages();
	};

	await Promise.all([
		logSetup("Text to Speech", setupTextToSpeech),
    logSetup("Events Database", setupEvents),
    logSetup("Messages Database", setupMessages),
    logSetup("Timers Database", setupTimers),
    logSetup("Rapid Discord Mafia", RapidDiscordMafia.setUpRapidDiscordMafia),
    logSetup("LL Point Manager", setupLLPointManager),
		logSetup("Namesmith", setupNamesmith),
	]);
	resetSetupRows();

	logSuccess("Brobot is Ready!");
};

module.exports = { onClientReady };
