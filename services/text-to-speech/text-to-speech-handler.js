const tts = require('google-tts-api');
const { createAudioResource, createAudioPlayer, VoiceConnection } = require('@discordjs/voice');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { wrapTextByLineWidth, removeLinks, removeEmojis } = require('../../utilities/string-manipulation-utils');
const { logError, logSuccess, logInfo } = require('../../utilities/logging-utils');
const { default: axios } = require('axios');
const fs = require('fs');
const { Message } = require('discord.js');
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * A class to handle text to speech conversion and playing of audio files.
 */
class TextToSpeechHandler {
	constructor() {
		/**
		 * @type {{user_id: string, text: string}[]}
		 * @private
		 */
		this._messages = [];
		this._isPlaying = false;
		this._isWaitingToDie = false;
		/**
		 * @type {{
		 * 	user_id: string,
		 * 	channel_id: string,
		 * 	name: string | null,
		 * }[]}
		 * @private
		 */
		this._toggled_users = [];
		this._speedMultiplier = 1.5;
		this._volumeMultiplier = 0.5;
	}

	static index = 0;
	static POSSIBLE_VOICES = [
		"en",
		"en-GB",
		"fil", // sounds ok
		"bn", // sounds ok, capitals break it
		"nl", // sounds eh
		"el", // messes up a word
		"am", // messes up a couple words, confusing pronounciation
		"fi", // messes up a couple words
		"da", // messes up a few words
		"de", // Messes up few times
		"gu", // messes up a few words
		"fr", // French pronounciation
		"hr", // messes up quite a few words
		"pt-BR", // messes up half of words
		"chr",
		"iw",
		"hi",
		"hu",
		"is",
		"id",
		"it",
		"ja",
		"kn",
		"ko",
		"lv",
		"lt",
		"ms",
		"ml",
		"mr",
		"no",
		"pl",
		"pt-PT",
		"ro",
		"ru",
		"sr",
		"zh-CN",
		"sk",
		"sl",
		"es",
		"sw",
		"sv",
		"ta",
		"te",
		"th",
		"zh-TW",
		"tr",
		"ur",
		"uk",
		"vi",
		"cy",
	]

	/**
	 * Sets the speed multiplier for the audio output. The speed multiplier is a
	 * number between 0.5 and 2 that controls how fast the audio is played. The
	 * default value is 1.
	 * @param {number} speed - The speed multiplier to use. Must be between 0.5 and 2.
	 * @returns {undefined}
	 */
	setSpeedMultiplier(speed) {
		this._speedMultiplier = speed;
	}

	/**
	 * Sets the volume multiplier for the audio output. The volume multiplier is a
	 * number between 0 and 1 that controls how loud the audio is played. The
	 * default value is 0.5.
	 * @param {number} volume - The volume multiplier to use. Must be between 0 and 1.
	 * @returns {undefined}
	 */
	setVolumeMultiplier(volume) {
		this._volumeMultiplier = volume;
	}

	/**
	 * Adds a user to the toggled users list. The toggled user list is a list of users
	 * that have toggled the TTS for a specific channel. The user is added with the
	 * given user_id, channel_id, and name. If the user is already toggled, this will
	 * update the name.
	 * @param {string} user_id - The user id of the user to add.
	 * @param {string} channel_id - The channel id of the channel the user is adding.
	 * @param {string | null} name - The name to use for the user when speaking in the channel.
	 * @returns {undefined}
	 */
	addToggledUser(user_id, channel_id, name=null) {
		this._toggled_users.push(
			{
				user_id: user_id,
				channel_id: channel_id,
				name: name,
			}
		);
	}

	/**
	 * Removes a user from the toggled users list. The user is removed based on
	 * the user_id provided. If the user is not found, nothing happens.
	 * @param {string} user_id - The user id of the user to remove.
	 * @returns {undefined}
	 */
	removeToggledUser(user_id) {
		this._toggled_users = this._toggled_users.filter(toggle =>
			toggle.user_id !== user_id
		);
	}

	/**
	 * Checks if a user has toggled TTS for a specific channel.
	 * @param {string} user_id - The user id of the user to check.
	 * @param {string} channel_id - The channel id of the channel to check.
	 * @returns {boolean} Whether the user has toggled TTS for the channel.
	 */
	isUserToggledWithChannel(user_id, channel_id) {
		return this._toggled_users.some(toggle =>
			toggle.user_id === user_id &&
			toggle.channel_id === channel_id
		);
	}

	/**
	 * Finds a toggled user in the toggled users list by their user_id. If the user
	 * is found, their toggle object is returned. If the user is not found, undefined
	 * is returned.
	 * @param {string} user_id - The user id of the user to find.
	 * @returns {{
	 * 	user_id: string,
	 * 	channel_id: string,
	 * 	name: string | null
	 * } | undefined} The toggle object of the user, or undefined.
	 */
	getToggledUser(user_id) {
		const toggle = this._toggled_users.find(toggle =>
			toggle.user_id === user_id
		);

		if (toggle)
			return toggle;
		else
			return undefined;
	}

	/**
	 * Finds a toggled user in the toggled users list by their user_id and returns
	 * their name if they are found. If the user is not found, undefined is
	 * returned.
	 * @param {string} user_id - The user id of the user to find.
	 * @returns {string | null} The name of the user if found, or undefined.
	 */
	getToggledUserName(user_id) {
		const toggle = this.getToggledUser(user_id);
		if (toggle)
			return toggle.name;
		else
			return null;
	}

	/**
	 * Updates the name of a user in the toggled users list. If the user is not
	 * found, nothing happens.
	 * @param {string} user_id - The user id of the user to update.
	 * @param {string} name - The new name to use for the user.
	 * @returns {undefined}
	 */
	updateToggledUserName(user_id, name) {
		const toggled_user = this.getToggledUser(user_id);

		if (!toggled_user)
			return;

		toggled_user.name = name;
	}

	/**
	 * Adds a message to the list of messages to be spoken. If the list is not empty
	 * and there is no audio currently playing, this will start the audio playback.
	 * @param {VoiceConnection} voice_connection - The voice connection to use.
	 * @param {string} message - The text of the message to be spoken.
	 * @param {string} user_id - The user id of the user who sent the message.
	 * @param {string} [speaker_name] - The name of the speaker. If not provided, the user's name will not be announced.
	 * @returns {undefined}
	 */
	addMessage(voice_connection, message, user_id, speaker_name=undefined) {
		// Filter out links
		message = removeLinks(message);
		message = removeEmojis(message);
		message = removeLinks(message);

		// Filter out empty messages
		if (message.replace(`${speaker_name} said`, '').trim() === '') return;

		message = message.toLowerCase();
		const messages_to_speak = wrapTextByLineWidth(message, 200);

		messages_to_speak.forEach(message => {
			if (message === '') return;

			this._messages.push({
				user_id: user_id,
				text: message,
			});

			if (this._messages.length <= 1) {
				this.playAudio(voice_connection, speaker_name);
			}
		})
	}

	/**
	 * Given a message, determine the voice to use for the message.
	 * Tries to assign a different voice to each user, and if a user has not been seen before,
	 * assigns a random voice to the user.
	 * @param {{
	 * 	user_id: string,
	 * 	text: string
	 * }} message - The message to be spoken.
	 * @returns {string} The voice to use for the message.
	 */
	getVoiceFromMessage(message) {
		const toggled_user_index = this._toggled_users.findIndex(toggled_user => toggled_user.user_id === message.user_id);

		let index = 0;

		if (toggled_user_index !== undefined && toggled_user_index != -1)
			index = toggled_user_index % TextToSpeechHandler.POSSIBLE_VOICES.length;
		else
			index = this._toggled_users.length % TextToSpeechHandler.POSSIBLE_VOICES.length;

		return TextToSpeechHandler.POSSIBLE_VOICES[index];
	}

	/**
	 * Plays audio from a message
	 * @param {VoiceConnection} voice_connection - The voice connection
	 * @param {string} [speaker_name] - The name of the person speaking
	 */
	async playAudio(voice_connection, speaker_name=undefined) {
		this._isPlaying = true;

		const message = this._messages[0];
		const text = message.text;
		const voice = this.getVoiceFromMessage(message);
		const audio_file_url = await this.getTextToSpeechAudioURL(text, voice);
		const player = createAudioPlayer();
		const audioResource = createAudioResource(audio_file_url);
		player.play(audioResource);
		voice_connection.subscribe(player);

		// Wait for the current audio to finish playing
		await new Promise(resolve => {
				// @ts-ignore
				player.once('idle', () => {
						// @ts-ignore
						resolve();
				});
		});
		this._messages.shift();

		if (this._messages.length > 0)
			this.playAudio(voice_connection, speaker_name);
		else {
			this._isPlaying = false;
		}
	}

	/**
	 * Converts text to speech and returns the URL of the audio file
	 * @param {string} text to convert to audio speech file
	 * @param {string} voice voice to use
	 * @returns {Promise<string>} text URL to text to speech audio file
	 */
	async getTextToSpeechAudioURL(text, voice=TextToSpeechHandler.POSSIBLE_VOICES[0]) {
		const audioUrl = await this.getGoogleTranslateTTSAudioUrl(text, voice);
		return this.speedUpAndVolumeAudio(audioUrl);
	}

	/**
	 * Downloads the audio file from the given URL and saves it to a temporary file
	 * @param {string} audioUrl URL of the audio file to download
	 * @returns {Promise<string>} Temporary file path to the downloaded audio file
	 */
	async downloadAudio(audioUrl) {
		const tempInputPath = 'temp-input.mp3';

		// Step 1: Download audio
		/**
		 * Downloads the audio file from the given URL and saves it to a temporary file
		 * @param {string} audioUrl - URL of the audio file to download
		 * @returns {Promise<void>} Promise that resolves when the audio file is downloaded
		 */
		const downloadAudio = async (audioUrl) => {
			const response = await axios.get(audioUrl,
				{ responseType: 'stream' }
			);
			const writer = fs.createWriteStream(tempInputPath);
			response.data.pipe(writer);
			return new Promise((resolve, reject) => {
				const finish = () => {
					// @ts-ignore
					resolve();
				}
				writer.on('finish', finish);
				writer.on('error', reject);
			});
		};

		await downloadAudio(audioUrl);

		return tempInputPath;
	}

	/**
	 * Returns the URL of an audio file generated by Google Translate's text to speech (TTS) engine
	 * @param {string} text to convert to audio speech file
	 * @param {string} language language to use for the audio (default: "en")
	 * @returns {string} URL of the audio file generated by Google Translate's text to speech (TTS) engine
	 */
	getGoogleTranslateTTSAudioUrl(text, language="en") {
		const audio_file_url = tts.getAudioUrl(text, {
			lang: language,
			slow: false,
			host: 'https://translate.google.com',
		});

		return audio_file_url;
	}

	/**
	 * Converts audio in url to speed up audio and returns new url
	 * @param {string} audioUrl - audio url
	 * @returns {Promise<string>} new audio url
	 */
	async speedUpAndVolumeAudio(audioUrl) {
		const audioFilePath = await this.downloadAudio(audioUrl);
    return new Promise((resolve, reject) => {
			// Generate a unique filename to avoid overwriting
			const outputFilePath = 'audioUrl.mp3';

			ffmpeg(audioFilePath)
				// @ts-ignore
				.on('start', (commandLine) => {
					logInfo(`Audio conversion started with command: ${commandLine}`);
				})
				.on('error',
					/**
					 * Handles error during audio conversion
					 * @param {Error} err - error object
					 */
					function(err) {
						logError('Error converting audio', err);
						reject(err);
					}
				)
				.on('end', function() {
					logSuccess('Audio converted successfully');
					resolve(outputFilePath);
				})
				.audioFilters(`atempo=${this._speedMultiplier},volume=${this._volumeMultiplier}`) // Use audioFilters instead of inputOptions for filters
				.save(`${outputFilePath}`);
    });
	}

	/**
	 * Determines whether a message should trigger text to speech based on user preference.
	 * @param {Message} message - message to check
	 * @returns {boolean} whether the message should trigger text to speech
	 */
	static shouldMessageTriggerTTS(message) {
		const textToSpeechInstance = global.tts;

		if (textToSpeechInstance === undefined)
			return false;

		const messageAuthorID = message.author.id;
		const messageChannelID = message.channel.id;

		if (global.tts.isUserToggledWithChannel(
			messageAuthorID,
			messageChannelID
		))
			return true;
		else
			return false;
	}

	/**
	 * Adds a message to the text to speech queue based on user preference
	 * @param {Message} message - message to add to the queue
	 * @param {VoiceConnection} voiceConnection - the voice connection to use for the audio
	 */
	static addUsersMessageToQueue(message, voiceConnection) {
		const textToSpeechInstance = global.tts;

		if (textToSpeechInstance === undefined)
			throw new Error("TextToSpeechHandler is not initialized.");

		const user = message.author;
		const guildMember = message.member;

		if (guildMember === null)
			return;

		const name = textToSpeechInstance.getToggledUserName(user.id);

		let username = name;

		if (!username)
			username = guildMember.nickname;

		if (!username)
			username = user.globalName;

		if (!username)
			username = user.username;

		if (name && name !== null)
			global.tts.addMessage(
				voiceConnection,
				`${name} said ${message.content}`,
				user.id,
				username
			);
		else
			global.tts.addMessage(
				voiceConnection,
				message.cleanContent,
				user.id,
				username
			);
	}
}

module.exports = TextToSpeechHandler;