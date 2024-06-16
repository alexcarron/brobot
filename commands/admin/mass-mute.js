const { CommandInteraction } = require('discord.js');
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const command = new SlashCommand({
	name: 'mass-mute',
	description: 'Mute all members in your voice call except yourself'
});

const Parameters = {
	Unmute: new Parameter({
		type: 'boolean',
		name: 'unmute',
		description:'Whether to unmute all members',
		isRequired: false,
	})
}

command.parameters = [
	Parameters.Unmute
]

command.execute = async function (interaction) {
	await interaction.deferReply({
		content: "Muting everyone...",
		ephemeral: true
	});

	const isUnmuting = interaction.options.getBoolean(Parameters.Unmute.name);

	interaction.member.voice.channel.members.forEach(member => {
		if (isUnmuting)
			member.voice.setMute(false);
		else if (member.id !== interaction.member.id) {
				member.voice.setMute(true);
		}
	})

	// brobotGuildMember.voice.channel.members.forEach(guildMember => guildMember.voice.setMute(true, "reason"))

	await interaction.editReply('Done.');
}

module.exports = command;