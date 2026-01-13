
const Viewer = require('../../services/ll-points/viewer.js');
const { Parameter } = require('../../services/command-creation/parameter');
const { SlashCommand } = require('../../services/command-creation/slash-command');
const { PermissionFlagsBits } = require('discord.js');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const { getRequiredUserParam } = require('../../utilities/discord-fetch-utils.js');

const Parameters = {
	ViewerAdding: new Parameter({
		type: "user",
		name: "viewer-adding",
		description: "The discord user your adding as a viewer"
	}),
}

module.exports = new SlashCommand({
	name: "add-viewer",
	description: "Add a new viewer to the LL Point Manager",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.ViewerAdding,
	],
	allowsDMs: true,
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const viewer_user = getRequiredUserParam(interaction, Parameters.ViewerAdding.name);
		const viewer_name = viewer_user.username
		const viewer_id = viewer_user.id;

		let existing_new_viewer = await global.LLPointManager.getViewerByName(viewer_name);
		let existing_new_viewer_by_id = await global.LLPointManager.getViewerById(viewer_id);

		if (existing_new_viewer_by_id === undefined) {
			return await interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist in the database.`);
		}


		if (!existing_new_viewer && !existing_new_viewer_by_id) {
			/**
			 * @type {Record<string, any>}
			 */
			let new_viewer_obj = {
				name: viewer_name,
				ll_points: 0,
			};

			new_viewer_obj.user_id = viewer_id;

			const new_viewer = new Viewer({
				name: viewer_name,
				ll_points: 0,
				user_id: viewer_id,
			});
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
});