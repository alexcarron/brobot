import { Message } from "discord.js"
import TextToSpeechHandler from "../modules/TextToSpeechHandler"
import { getGuildMember } from "../modules/functions";
import { joinVoiceChannel } from "@discordjs/voice";

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

/**
 * @param {Message} message
 */
export const onNormalMessageSent = async (message) => {
	if (TextToSpeechHandler.shouldMessageTriggerTTS(message)) {
		await onTTSMessageSent(message);
	}
}