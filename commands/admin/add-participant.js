const { PermissionFlagsBits } = require('discord.js');
const
	{ ll_game_shows: llgs, } = require('../../data/ids.json'),
	ids = require("../../data/ids.json");
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const Parameters = {
	Participant: new Parameter({
		type: "string",
		name: "participant",
		description: "The participant joining",
	}),
}

const command = new SlashCommand({
	name: "add-participant",
	description: "add-participant",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.Participant
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	const participant_name = interaction.options.getString(Parameters.Participant.name);
	global.participants.push(participant_name);
	await interaction.editReply("Added " + participant_name);
	await interaction.editReply("Added " + participant_name);
}

module.exports = command