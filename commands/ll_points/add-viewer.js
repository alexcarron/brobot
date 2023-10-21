
const fs = require('fs');
const Viewer = require('../../modules/viewer.js');
const { autocomplete, deferInteraction } = require("../../modules/functions.js");
const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { PermissionFlagsBits } = require('discord.js');

const Parameters = {
	ViewerAdding: new Parameter({
		type: "user",
		name: "viewer-adding",
		description: "The discord user your adding as a viewer"
	}),
}

const command = new SlashCommand({
	name: "add-viewer",
	description: "Add a new viewer to the LL Point Manager",
});
command.required_permissions = [PermissionFlagsBits.Administrator]
command.parameters = [
	Parameters.ViewerAdding,
]
command.allowsDMs = true;
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const viewer_user = await interaction.options.getUser(Parameters.ViewerAdding.name);
	const viewer_name = viewer_user.username
	const viewer_id = viewer_user.id;

	console.log({viewer_user, viewer_name, viewer_id});

	let existing_new_viewer = await global.LLPointManager.getViewerByName(viewer_name);
	let existing_new_viewer_by_id = await global.LLPointManager.getViewerById(viewer_id);


	console.log({existing_new_viewer, existing_new_viewer_by_id});
	console.log(!existing_new_viewer && !existing_new_viewer_by_id);

	if (!existing_new_viewer && !existing_new_viewer_by_id) {
		let new_viewer_obj = {
			name: viewer_name,
			ll_points: 0,
		};

		new_viewer_obj.user_id = viewer_id;

		const new_viewer = new Viewer(new_viewer_obj);
		await global.LLPointManager.addViewer(new_viewer);
		await global.LLPointManager.updateDatabase();
		return interaction.editReply(`The viewer, **${viewer_name}**, is being added to the database.`);
	}
	else {
		let message_txt = `The viewer name, **${viewer_name}**, is already in the database.`

		if (!existing_new_viewer)
			message_txt = `The viewer id, \`${viewer_id}\`, is already in the database and it belongs to **${existing_new_viewer_by_id.name}**`

		return interaction.editReply(message_txt);
	}
}
module.exports = command;