
const fs = require('fs');
const { autocomplete, deferInteraction } = require("../../modules/functions.js");
const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { PermissionFlagsBits } = require('discord.js');
const LLPointManager = require('../../modules/llpointmanager.js');

const Parameters = {
	ViewerDeleting: new Parameter({
		type: "string",
		name: "viewer-deleting",
		description: "The name of the viewer you are deleting from the LL Point Manager",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "delete-viewer",
	description: "Remove an existing viewer from the LL Point Manager.",
});
command.parameters = [
	Parameters.ViewerDeleting,
];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const viewer_name = interaction.options.getString(Parameters.ViewerDeleting.name);

	let existing_viewer = await global.LLPointManager.getViewerByName(viewer_name);

	if (!existing_viewer) {
		return await interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist in the database.`);
	}
	else {
		global.LLPointManager.removeViewer(existing_viewer);
		return await interaction.editReply(`The viewer, **${viewer_name}**, is being deleted from the database.`);
	}
}
command.autocomplete = LLPointManager.getViewersAutocompleteValues;

module.exports = command;