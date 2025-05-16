const Parameter = require('../../../services/command-creation/parameter');
const SlashCommand = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');

const command = new SlashCommand({
	name: 'set-volume',
	description: 'Set the volume of Brobot\'s TTS'
});

const Parameters = {
	Volume: new Parameter({
		type: 'number',
		name: 'volume',
		description:'The volume of the TTS',
	})
}

command.parameters = [
	Parameters.Volume
]

command.allowsDMs = true;

command.execute = async function (interaction) {
	await deferInteraction(interaction);
	const volume = interaction.options.getNumber(Parameters.Volume.name);
	global.tts.setVolumeMultiplier(volume);
	await interaction.editReply('Set volume to ' + volume);
}

module.exports = command;