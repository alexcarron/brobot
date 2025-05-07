import { Message, MessageType } from "discord.js"
import TextToSpeechHandler from "../modules/TextToSpeechHandler"
import { getGuildMember } from "../modules/functions";
import { joinVoiceChannel } from "@discordjs/voice";
import { GameStates } from "../modules/enums";
import ids from "../bot-config/discord-ids";

ids

const onTTSMessageSent = async (message) => {
	const guildMember = await getGuildMember(message.guild, message.author.id);
	const voiceChannel = guildMember.voice.channel;

	if (voiceChannel === undefined || voiceChannel === null)
		return;


	const user = await getUser(message.author.id);
	const botVCPermissions = voiceChannel.permissionsFor(message.client.user);

	const botHasConnectPermission = botVCPermissions.has(Discord.PermissionsBitField.Flags.Connect);
	const botHasSpeakPermission = botVCPermissions.has(Discord.PermissionsBitField.Flags.Speak);

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
			console.log(kidnapped_player.channel_id + " VS " + msg.channel.id);
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
export const onNormalMessageSent = async (message) => {
	if (TextToSpeechHandler.shouldMessageTriggerTTS(message)) {
		await onTTSMessageSent(message);
	}

	if (
		// TODO: Encapsulate logic in rapid discord mafia service
		global.game_manager &&
		global.game_manager.player_manager &&
		global.game_manager.state === GameStates.InProgress &&
		message.channel.parentId === ids.rapid_discord_mafia.category.player_action &&
		message.type === MessageType.Default
	) {
		onRDMKidnapperMessageSent(message);
	}
}