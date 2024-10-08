const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const command = new SlashCommand({
	name: 'set-speed',
	description: 'Set the speed of Brobot\'s TTS'
});

const Parameters = {
	Speed: new Parameter({
		type: 'number',
		name: 'speed',
		description:'The speed of the TTS',
	})
}

command.parameters = [
	Parameters.Speed
]

command.allowsDMs = true;

command.execute = async function (interaction) {
	await deferInteraction(interaction);
	const volume = interaction.options.getNumber(Parameters.Speed.name);
	global.tts.setSpeedMultiplier(volume);
	await interaction.editReply('Set speed to ' + volume);
}

module.exports = command;