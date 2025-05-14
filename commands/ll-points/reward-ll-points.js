const { PermissionFlagsBits } = require('discord.js');
const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { LLPointRewards, LLPointAccomplishments } = require('../../modules/enums.js')
const LLPointManager = require('../../modules/llpointmanager.js');
const { deferInteraction } = require('../../utilities/discord-action-utils.js');

const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the viewer you are rewarding LL Points to",
		isAutocomplete: true,
	}),
	Accomplishment: new Parameter({
		type: "string",
		name: "for-accomplishment",
		description: "The accomplishment you are rewarding the viewer for",
		isAutocomplete: true,
	}),
	ThingParticipatedIn: new Parameter({
		type: "string",
		name: "thing-participated-in",
		description: "The game show or event the viewer participated in",
		isRequired: false,
	}),
}

const command = new SlashCommand({
	name: "reward-ll-points",
	description: "Give LL Points to a viewer because of their accomplishments.",
});
command.allowsDMs = true;
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	Parameters.ViewerName,
	Parameters.Accomplishment,
	Parameters.ThingParticipatedIn,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	let
		viewer_name = interaction.options.getString(Parameters.ViewerName.name);
		viewer = global.LLPointManager.getViewerByName(viewer_name);

	let
		accomplishment = interaction.options.getString(Parameters.Accomplishment.name),
		game_name = interaction.options.getString(Parameters.ThingParticipatedIn.name) || undefined;

	if (!viewer) {
		return await interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist.`);
	}

	if (!Object.values(LLPointAccomplishments).includes(accomplishment)) {
		return await interaction.editReply(
			`The accomplishment, **${accomplishment}**, doesn't exist.\n` + Object.values(LLPointAccomplishments).join(", ")
		);
	}

	console.log({viewer, viewer_name, accomplishment});

	const result_msg = await viewer.giveReward(accomplishment, game_name);

	console.log({viewer});

	if (result_msg !== "Success")
		return await interaction.editReply(result_msg);

	let current_ll_points = global.LLPointManager.viewers.get(viewer_name).ll_points;
	let accomplishment_key = Object.keys(LLPointAccomplishments).find(key => LLPointAccomplishments[key] === accomplishment);

	await interaction.editReply(
		`Giving **${viewer_name}** \`${LLPointRewards[accomplishment_key]}\` LL Point(s) for "*${accomplishment}*"\n` +
		`They now have \`${current_ll_points}\` LL Point(s).`
	);
	await global.LLPointManager.updateDatabase();
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	if (focused_param.name === Parameters.Accomplishment.name) {
		autocomplete_values = Object.values(LLPointAccomplishments)
			.map((accomplishment_str) => {return {name: accomplishment_str, value: accomplishment_str}})
			.filter(autocomplete_entry => autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase()));

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no accomplishments to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}
	else if (focused_param.name === Parameters.ViewerName.name) {
		LLPointManager.getViewersAutocompleteValues(interaction)
	}
}
module.exports = command;