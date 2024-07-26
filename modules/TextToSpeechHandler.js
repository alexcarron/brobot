const tts = require('google-tts-api');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, VoiceConnection } = require('@discordjs/voice');
const { getGuildMember, getGuild, wait, splitWithNoSplitWords, removeLinks } = require('./functions');
const ids = require("../data/ids.json");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

class TextToSpeechHandler {
	constructor() {
		this._messages = [];
		this._isPlaying = false;
		this._isWaitingToDie = false;
		this._toggled_users = [];
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
		toggled_user.name = name;
	}

	async addMessage(voice_connection, message, user_id, speaker_name=undefined) {
		message = removeLinks(message);
		if (message === '') return;
		message = message.toLowerCase();
		const messages_to_speak = splitWithNoSplitWords(message, 200);

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
	 *
	 * @param {VoiceConnection} voice_connection
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
				player.once('idle', () => {
						resolve();
				});
		});
		this._messages.shift();
		console.log(this._messages);

		if (this._messages.length > 0)
			this.playAudio(voice_connection, speaker_name);
		else {
			this._isPlaying = false;
		}
	}

	/**
	 * @param {string} text to convert to audio speech file
	 * @return {Promise<string>} text URL to text to speech audio file
	 */
	async getTextToSpeechAudioURL(text, voice=TextToSpeechHandler.POSSIBLE_VOICES[0]) {
		const audioUrl = await this.getGoogleTranslateTTSAudioUrl(text, voice);
		return this.speedUpAudio(audioUrl);
	}

	async getGoogleTranslateTTSAudioUrl(text, language="en") {
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
	 * @return {Promise<string>} new audio url
	 */
	async speedUpAudio(audioUrl) {
    return new Promise((resolve, reject) => {
			// Generate a unique filename to avoid overwriting
			const outputFilePath = 'audioUrl.mp3';

			ffmpeg(audioUrl)
				.on('error', function(err) {
					console.log('An error occurred: ' + err.message);
					reject(err);
				})
				.on('end', function() {
					console.log('Finished');
					resolve(outputFilePath);
				})
				.audioFilters('atempo=1.8') // Use audioFilters instead of inputOptions for filters
				.save(`audio/${outputFilePath}`);
    });
	}
}

module.exports = TextToSpeechHandler;