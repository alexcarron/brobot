const tts = require('google-tts-api');
const { createAudioResource, createAudioPlayer, VoiceConnection } = require('@discordjs/voice');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { wrapTextByLineWidth, removeLinks, removeEmojis } = require('../../utilities/text-formatting-utils');
const { logError, logSuccess, logInfo } = require('../../utilities/logging-utils');
const { default: axios } = require('axios');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * A class to handle text to speech conversion and playing of audio files.
 */
class TextToSpeechHandler {
	constructor() {
		this._messages = [];
		this._isPlaying = false;
		this._isWaitingToDie = false;
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

	setSpeedMultiplier(speed) {
		this._speedMultiplier = speed;
	}

	setVolumeMultiplier(volume) {
		this._volumeMultiplier = volume;
	}

	addToggledUser(user_id, channel_id, name=null) {
		this._toggled_users.push(
			{
				user_id: user_id,
				channel_id: channel_id,
				name: name,
			}
		);
	}

	removeToggledUser(user_id) {
		this._toggled_users = this._toggled_users.filter(toggle => toggle.user_id !== user_id);
	}

	isUserToggledWithChannel(user_id, channel_id) {
		return this._toggled_users.some(toggle => toggle.user_id === user_id && toggle.channel_id === channel_id);
	}

	getToggledUser(user_id) {
		const toggle = this._toggled_users.find(toggle => toggle.user_id === user_id);
		if (toggle)
			return toggle;
		else
			return undefined;
	}

	getToggledUserName(user_id) {
		const toggle = this.getToggledUser(user_id);
		if (toggle)
			return toggle.name;
		else
			return undefined;
	}

	updateToggledUserName(user_id, name) {
		const toggled_user = this.getToggledUser(user_id);

		if (!toggled_user)
			return;

		toggled_user.name = name;
	}

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
				.on('error', function(err) {
					logError('Error converting audio', err);
					reject(err);
				})
				.on('end', function() {
					logSuccess('Audio converted successfully');
					resolve(outputFilePath);
				})
				.audioFilters(`atempo=${this._speedMultiplier},volume=${this._volumeMultiplier}`) // Use audioFilters instead of inputOptions for filters
				.save(`${outputFilePath}`);
    });
	}


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

	static addUsersMessageToQueue(message, voiceConnection) {
		const textToSpeechInstance = global.tts;

		if (textToSpeechInstance === undefined)
			throw new Error("TextToSpeechHandler is not initialized.");

		const user = message.author;
		const guildMember = message.member;

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