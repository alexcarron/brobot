const tts = require('google-tts-api');
const { joinVoiceChannel, createAudioResource, createAudioPlayer } = require('@discordjs/voice');

class TextToSpeechHandler {
	constructor() {
		this._messages = [];
		this._isPlaying = false;
		this._toggled_users = [];
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

	getToggledUserName(user_id) {
		const toggle = this._toggled_users.find(toggle => toggle.user_id === user_id);
		return toggle.name;
	}

	async addMessage(voice_connection, message) {
		console.log("Adding message: " + message);
		this._messages.push(message);

		console.log(this._messages);

		if (this._messages.length <= 1) {
			await this.playAudio(voice_connection);
		}
	}

	async playAudio(voice_connection) {
		console.log("playing audio");

		this._isPlaying = true;

		const message = this._messages[0];
		console.log(this._messages);

		const audio_file_url = tts.getAudioUrl(message, {
			lang: 'en',
			voice: "en-US-Wavenet-D",
			slow: false,
			host: 'https://translate.google.com',
		});

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
		console.log("resolved: " + this._messages.length);
		console.log(this._messages);

		if (this._messages.length > 0)
			this.playAudio(voice_connection);
		else
			this._isPlaying = false;
	}
}

module.exports = TextToSpeechHandler;