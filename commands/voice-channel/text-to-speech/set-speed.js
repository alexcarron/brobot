const { Parameter } = require('../../../services/command-creation/parameter');
const SlashCommand = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');

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