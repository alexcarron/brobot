const Parameter = require('../../../modules/commands/Paramater');
const SlashCommand = require('../../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../../modules/functions');

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