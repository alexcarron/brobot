const { Message, MessageType, PermissionsBitField } = require("discord.js");
const TextToSpeechHandler = require("../services/text-to-speech/text-to-speech-handler");
const { joinVoiceChannel } = require("@discordjs/voice");
const ids = require("../bot-config/discord-ids");
const { fetchGuildMember } = require("../utilities/discord-fetch-utils");
const { GameState } = require("../services/rapid-discord-mafia/game-state-manager");
const { logInfo } = require("../utilities/logging-utils");

const onTTSMessageSent = async (message) => {
	logInfo(`TTS Message Sent: ${message.content}`);

	const guildMember = await fetchGuildMember(message.guild, message.author.id);
	const voiceChannel = guildMember.voice.channel;

	if (voiceChannel === undefined || voiceChannel === null)
		return;


	const botVCPermissions = voiceChannel.permissionsFor(message.client.user);

	const botHasConnectPermission = botVCPermissions.has(PermissionsBitField.Flags.Connect);
	const botHasSpeakPermission = botVCPermissions.has(PermissionsBitField.Flags.Speak);

	const botHasRequiredPermissions = botHasConnectPermission && botHasSpeakPermission;

	if (!botHasRequiredPermissions)
		return;

	// Join The VC
	const voiceConnection = joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId: message.guild.id,
		adapterCreator: message.guild.voiceAdapterCreator
	});

	TextToSpeechHandler.addUsersMessageToQueue(message, voiceConnection);
}

const onRDMKidnapperMessageSent = async (message) => {
	// TODO: Encapsulate logic in rapid discord mafia service
	const kidnapped_players = global.game_manager.player_manager.getPlayerList()
	.filter(
		/**
		 * @param {Player} player
		 */
		(player) => {
			const affected_by = player.affected_by;

			const isKidnapped = affected_by
				.some(affect => {
					return affect.name === AbilityName.Kidnap
				});

			return isKidnapped;
		}
	);

	kidnapped_players.forEach(
		/**
		 * @param {Player} kidnapped_player
		 */
		(kidnapped_player) => {
			if (
				kidnapped_player.channel_id === msg.channel.id &&
				kidnapped_player.id === msg.author.id
			) {
				const affected_by = kidnapped_player.affected_by;

				const kidnapper_player_names = affected_by
				.filter(affect => {
					return affect.name === AbilityName.Kidnap
				})
				.map(affect => affect.by);

				const kidnapper_players = kidnapper_player_names
					.map(player_name => {
						return global.game_manager.player_manager.get(player_name)
					});

				kidnapper_players.forEach(player => {
					player.sendFeedback(Feedback.KidnapperYells(player, kidnapped_player, msg.content));
				})
			}

		}
	)
}

/**
 * @param {Message} message
 */
const onNormalMessageSent = async (message) => {
	if (TextToSpeechHandler.shouldMessageTriggerTTS(message)) {
		await onTTSMessageSent(message);
	}

	if (
		// TODO: Encapsulate logic in rapid discord mafia service
		global.game_manager &&
		global.game_manager.player_manager &&
		global.game_manager.state === GameState.IN_PROGRESS &&
		message.channel.parentId === ids.rapid_discord_mafia.category.player_action &&
		message.type === MessageType.Default
	) {
		onRDMKidnapperMessageSent(message);
	}
}

module.exports = {onNormalMessageSent};