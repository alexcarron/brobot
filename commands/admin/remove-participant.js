const { PermissionFlagsBits } = require('discord.js');
const
	{ ll_game_shows: llgs, } = require('../../databases/ids.json'),
	ids = require("../../databases/ids.json");
const Parameter = require('../../modules/commands/Paramater');
const SlashCommand = require('../../modules/commands/SlashCommand');
const { deferInteraction } = require('../../modules/functions');

const Parameters = {
	Participant: new Parameter({
		type: "string",
		name: "participant",
		description: "The participant removing",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "remove-participant",
	description: "remove-participant",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.Participant
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	const participant_index = interaction.options.getString(Parameters.Participant.name);
	const participant = global.participants[participant_index];
	global.participants.splice(participant_index, 1);
	await interaction.editReply("Removed " + participant);
}
command.autocomplete = async function(interaction) {
	let autocomplete_values = [];
	const focused_param = interaction.options.getFocused(true);
	console.log({focused_param});
	if (!focused_param) return;

	for (const index in global.participants) {
		const participant = global.participants[index];
		autocomplete_values.push({name: participant, value: index});
	}


	autocomplete_values = autocomplete_values.filter(autocomplete_entry => autocomplete_entry.value.toLowerCase().startsWith(focused_param.value.toLowerCase()));

	if (Object.values(autocomplete_values).length <= 0) {
		autocomplete_values = [{name: "Sorry, there is nothing left to choose from", value: "N/A"}];
	}
	else if (Object.values(autocomplete_values).length > 25) {
		autocomplete_values.splice(25);
	}

	await interaction.respond(
		autocomplete_values
	);
}

module.exports = command