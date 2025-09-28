const { Message, MessageType, PermissionsBitField, ChannelType, TextChannel } = require("discord.js");
const TextToSpeechHandler = require("../services/text-to-speech/text-to-speech-handler");
const { joinVoiceChannel } = require("@discordjs/voice");
const { ids } = require("../bot-config/discord-ids");
const { fetchGuildMember } = require("../utilities/discord-fetch-utils");
const { GameState } = require("../services/rapid-discord-mafia/game-state-manager");
const { logInfo } = require("../utilities/logging-utils");
const { AbilityName } = require("../services/rapid-discord-mafia/ability");
const Player = require("../services/rapid-discord-mafia/player");
const { Feedback } = require("../services/rapid-discord-mafia/constants/possible-messages");

/**
 * Called when a message is sent to the bot and the bot is configured to convert
 * the message to speech in the user's voice channel.
 * @param {Message} message The message sent to the bot.
 */
const onTTSMessageSent = async (message) => {
	logInfo(`TTS Message Sent: ${message.content}`);

	if (message.guild === null)
		return;

	const guildMember = await fetchGuildMember(message.guild, message.author.id);
	const voiceChannel = guildMember.voice.channel;

	if (voiceChannel === undefined || voiceChannel === null)
		return;


	const botVCPermissions = voiceChannel.permissionsFor(message.client.user);

	if (botVCPermissions === undefined || botVCPermissions === null)
		return;

	const botHasConnectPermission = botVCPermissions.has(PermissionsBitField.Flags.Connect);
	const botHasSpeakPermission = botVCPermissions.has(PermissionsBitField.Flags.Speak);

	const botHasRequiredPermissions = botHasConnectPermission && botHasSpeakPermission;

	if (!botHasRequiredPermissions)
		return;

	// Join The VC
	const voiceConnection = joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId: message.guild.id,
		// @ts-ignore
		adapterCreator: message.guild.voiceAdapterCreator
	});

	TextToSpeechHandler.addUsersMessageToQueue(message, voiceConnection);
}

/**
 * Called when a message is sent to a channel that is a kidnapped player's channel.
 * If the message is from the kidnapped player, and the player is still kidnapped,
 * this will send a message to all the players that kidnapped the speaking player
 * with the contents of the message and the kidnapped player's name.
 * @param {Message} message - The message sent to the bot.
 */
const onRDMKidnapperMessageSent = (message) => {
	// TODO: Encapsulate logic in rapid discord mafia service
	const kidnapped_players = global.game_manager.player_manager.getPlayerList()
	.filter(
		/**
		 * @param {Player} player - The player to check
		 * @returns {boolean} - True if the player is kidnapped
		 */
		(player) => {
			const affected_by = player.affected_by;

			const isKidnapped = affected_by
				.some(affect => {
					return affect.name === AbilityName.KIDNAP
				});

			return isKidnapped;
		}
	);

	kidnapped_players.forEach(
		/**
		 * @param {Player} kidnapped_player - The kidnapped player
		 */
		(kidnapped_player) => {
			if (
				kidnapped_player.channel_id === message.channel.id &&
				kidnapped_player.id === message.author.id
			) {
				const affected_by = kidnapped_player.affected_by;

				const kidnapper_player_names = affected_by
				.filter(affect => {
					return affect.name === AbilityName.KIDNAP
				})
				.map(affect => affect.by);

				const kidnapper_players = kidnapper_player_names
					.map(player_name => {
						return global.game_manager.player_manager.get(player_name)
					});

				kidnapper_players.forEach(player => {
					player.sendFeedback(Feedback.KIDNAPPER_YELLS(player, kidnapped_player, message.content));
				})
			}

		}
	)
}

/**
 * @param {Message} message - The message
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
		message.channel.type !== ChannelType.DM &&
		message.channel instanceof TextChannel &&
		message.channel.parentId === ids.rapid_discord_mafia.category.player_action &&
		message.type === MessageType.Default
	) {
		onRDMKidnapperMessageSent(message);
	}
}

module.exports = {onNormalMessageSent};