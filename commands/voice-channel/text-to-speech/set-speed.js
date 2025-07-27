const { Parameter } = require('../../../services/command-creation/parameter');
const { SlashCommand } = require('../../../services/command-creation/slash-command');
const { deferInteraction } = require('../../../utilities/discord-action-utils');
const { getRequiredNumberParam } = require('../../../utilities/discord-fetch-utils');

const Parameters = {
	Speed: new Parameter({
		type: 'number',
		name: 'speed',
		description:'The speed of the TTS',
	})
}

module.exports = new SlashCommand({
	name: 'set-speed',
	description: 'Set the speed of Brobot\'s TTS',
	parameters: [
		Parameters.Speed
	],
	allowsDMs: true,
	execute: async function (interaction) {
		await deferInteraction(interaction);
		const volume = getRequiredNumberParam(interaction, Parameters.Speed.name);
		global.tts.setSpeedMultiplier(volume);
		await interaction.editReply('Set speed to ' + volume);
	}
});