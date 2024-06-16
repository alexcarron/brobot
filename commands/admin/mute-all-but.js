const { CommandInteraction } = require('discord.js');
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const command = new SlashCommand({
	name: 'mute-all-but',
	description: 'Mute all members in your voice call except yourself'
});

const Parameters = {
	UnmutedMember: new Parameter({
		type: 'user',
		name: 'unmuted-member',
		description:'The singular person not to mute',
		isRequired: true,
	})
}

command.parameters = [
	Parameters.UnmutedMember
]

command.execute = async function (interaction) {
	await interaction.deferReply({
		content: "Muting all but one user...",
		ephemeral: true
	});

	const unmutedMember = interaction.options.getUser(Parameters.UnmutedMember.name);

	interaction.member.voice.channel.members.forEach(member => {
 		if (member.id !== interaction.member.id && member.id !== unmutedMember.id) {
				member.voice.setMute(true);
		}
	})

	// brobotGuildMember.voice.channel.members.forEach(guildMember => guildMember.voice.setMute(true, "reason"))

	await interaction.editReply('Done.');
}

module.exports = command;