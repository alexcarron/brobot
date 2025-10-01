const { Parameter } = require('../../../services/command-creation/parameter');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const { getVoiceChannelOfInteraction } = require('../../../utilities/discord-fetch-utils');

const Parameters = {
	Unmute: new Parameter({
		type: 'boolean',
		name: 'unmute',
		description:'Whether to unmute all members',
		isRequired: false,
	})
}

module.exports = new SlashCommand({
	name: 'mass-mute',
	description: 'Mute all members in your voice call except yourself',
	parameters: [
		Parameters.Unmute
	],
	execute: async function (interaction) {
		await deferInteraction(interaction);

		const isUnmuting = interaction.options.getBoolean(Parameters.Unmute.name);

		const voiceChannel = getVoiceChannelOfInteraction(interaction);

		if (voiceChannel === null) {
			await interaction.editReply('You are not in a voice channel.');
			return;
		}

		voiceChannel.members.forEach(member => {
			if (isUnmuting)
				member.voice.setMute(false);
			else if (member.id !== interaction.user.id) {
					member.voice.setMute(true);
			}
		})

		// brobotGuildMember.voice.channel.members.forEach(guildMember => guildMember.voice.setMute(true, "reason"))

		await interaction.editReply('Done.');
	}
});

