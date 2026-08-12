import { APIInteractionGuildMember, ChatInputCommandInteraction, GuildMember, VoiceBasedChannel } from "discord.js";
import { getMemberOfInteraction } from "./guild-member-utils";

/**
 * Fetches the voice channel that a guild member is currently in.
 * @param guildMember The guild member whose voice channel you want to fetch.
 * @returns The VoiceChannel object the member is in, or null if the member is not in a voice channel.
 */
export function fetchVoiceChannelMemberIsIn(guildMember: GuildMember | APIInteractionGuildMember): VoiceBasedChannel | null {
	if (!(guildMember instanceof GuildMember)) {
		return null;
	}

	return guildMember.voice.channel;
}

/**
 * Gets the voice channel that the user who invoked the interaction is currently in.
 * @param interaction The interaction object of the slash command.
 * @returns The VoiceChannel object of the channel the user is in, or null if the user is not in a voice channel.
 * @throws {Error} If the member object is not an instance of GuildMember.
 */
export function getVoiceChannelOfInteraction(interaction: ChatInputCommandInteraction): VoiceBasedChannel | null {
	return fetchVoiceChannelMemberIsIn(
		getMemberOfInteraction(interaction)
	);
}
