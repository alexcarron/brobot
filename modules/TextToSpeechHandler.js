const tts = require('google-tts-api');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, VoiceConnection } = require('@discordjs/voice');
const { getGuildMember, getGuild, wait, splitWithNoSplitWords } = require('./functions');
const ids = require("../data/ids.json");

class TextToSpeechHandler {
	constructor() {
		this._messages = [];
		this._isPlaying = false;
		this._isWaitingToDie = false;
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

	async addMessage(voice_connection, message, speaker_name=undefined) {
		const messages_to_speak = splitWithNoSplitWords(message, 200);

		messages_to_speak.forEach(message => {
			console.log("Adding message: " + message);
			this._messages.push(message);

			if (this._messages.length <= 1) {
				this.playAudio(voice_connection, speaker_name);
			}
		})
	}

	/**
	 *
	 * @param {VoiceConnection} voice_connection
	 */
	async playAudio(voice_connection, speaker_name=undefined) {
		console.log("playing audio");

		const connection_guild = await getGuild(voice_connection.joinConfig.guildId);
		const brobot_member = await getGuildMember(connection_guild, ids.users.Brobot);

		let nickname;

		if (speaker_name !== undefined) {
			nickname = `${speaker_name} says...`;
			nickname = nickname.substring(0, 32);
		}
		else {
			nickname = `Someone says...`;
		}

		if (brobot_member.nickname !== nickname)
			brobot_member.setNickname(nickname);

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
			this.playAudio(voice_connection, speaker_name);
		else {
			this._isPlaying = false;

			await wait(1, "second");

			if (!this._isPlaying)
				brobot_member.setNickname(null);
		}
	}
}

module.exports = TextToSpeechHandler;