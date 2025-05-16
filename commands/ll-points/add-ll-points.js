
const fs = require('fs');
const Parameter = require("../../services/command-creation/Paramater.js");
const SlashCommand = require("../../services/command-creation/slash-command.js");
const { PermissionFlagsBits } = require('discord.js');
const { LLPointManager } = require('../../services/ll-points/ll-point-manager.js');
const { findStringStartingWith } = require('../../utilities/text-formatting-utils.js');

//
const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the viewer your giving LL Points to",
		isAutocomplete: true,
	}),
	LLPointAmount: new Parameter({
		type: "number",
		name: "ll-point-amount",
		description: "The amount of LL Points your giving to the viewer",
	}),
}

const command = new SlashCommand({
	name: "add-ll-points",
	description: "Give a certain amount of LL Points to a viewer",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.ViewerName,
	Parameters.LLPointAmount,
]
command.allowsDMs = true;
command.execute = async function(interaction) {
	if (interaction) {
		try {
			await interaction.reply({content: "Adding LL Points...", ephemeral: true});
		}
		catch {
			console.log("Failed Defer: Reply Already Exists");
			await interaction.editReply({ content: "Sending Command...", ephemeral: true});
		}
	}

	const
		viewer_name_arg = interaction.options.getString(Parameters.ViewerName.name),
		added_points = interaction.options.getNumber(Parameters.LLPointAmount.name);

	let viewer = await global.LLPointManager.getViewerByName(viewer_name_arg);
	let viewer_name = viewer_name_arg;

	console.log({viewer_name_arg, viewer_name, added_points})

	if (!viewer) {
		const autocomplete_viewer_name = findStringStartingWith(viewer_name, global.LLPointManager.getViewerNames());

		if (autocomplete_viewer_name) {
			viewer_name = autocomplete_viewer_name;
			viewer = await global.LLPointManager.getViewerByName(viewer_name);
		}

		if (!viewer) {
			return interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist.`);
		}
	}

	console.log({viewer, viewer_name, added_points});

	await global.LLPointManager.viewers.get(viewer_name).addLLPoints(added_points);
	await global.LLPointManager.updateDatabase();
	let current_ll_points = await global.LLPointManager.viewers.get(viewer_name).ll_points;

	await interaction.editReply(
		`Giving **${viewer_name}** \`${added_points}\` LL Point(s)...\n` +
		`They now have \`${current_ll_points}\` LL Point(s).`
	);
}
command.autocomplete = LLPointManager.getViewersAutocompleteValues;

module.exports = command;