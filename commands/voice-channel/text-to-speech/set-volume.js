const { Parameter } = require('../../../services/command-creation/parameter');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');

const Parameters = {
	Volume: new Parameter({
		type: 'number',
		name: 'volume',
		description:'The volume of the TTS (0-1 for 0% to 100%)',
	})
}

module.exports = new SlashCommand({
	name: 'set-volume',
	description: 'Set the volume of Brobot\'s TTS',
	parameters: [
		Parameters.Volume
	],
	allowsDMs: true,
	execute: async function (interaction) {
		await deferInteraction(interaction);
		const volume = interaction.options.getNumber(Parameters.Volume.name);
		global.tts.setVolumeMultiplier(volume);
		await interaction.editReply('Set volume to ' + volume);
	}
});