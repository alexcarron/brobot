const { Parameter } = require('../../../services/command-creation/parameter');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const {  getVoiceChannelOfInteraction, getRequiredUserParam } = require('../../../utilities/discord-fetch-utils');

const Parameters = {
	UnmutedMember: new Parameter({
		type: 'user',
		name: 'unmuted-member',
		description:'The singular person not to mute',
		isRequired: true,
	}),
}

module.exports = new SlashCommand({
	name: 'mute-all-but',
	description: 'Mute all members in your voice call except yourself',
	parameters: [
		Parameters.UnmutedMember
	],
	execute: async function (interaction) {
		await deferInteraction(interaction);

		const unmutedMember = getRequiredUserParam(interaction, Parameters.UnmutedMember.name);

		const voiceChannel = getVoiceChannelOfInteraction(interaction);

		if (voiceChannel === null) {
			await interaction.editReply('You are not in a voice channel.');
			return;
		}

		voiceChannel.members.forEach(member => {
			if (member.id !== interaction.user.id && member.id !== unmutedMember.id) {
				member.voice.setMute(true);
			}
		})

		await interaction.editReply('Done.');
	}
});