const { Parameter } = require('../../../services/command-creation/parameter');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { fetchVoiceChannelMemberIsIn } = require('../../../utilities/discord-fetch-utils');

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
		await interaction.deferReply({
			ephemeral: true
		});

		const isUnmuting = interaction.options.getBoolean(Parameters.Unmute.name);

		const voiceChannel = fetchVoiceChannelMemberIsIn(interaction.member);

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

