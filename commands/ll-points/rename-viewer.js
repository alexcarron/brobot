const { PermissionFlagsBits } = require("discord.js");
const { Parameter } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const { getRequiredStringParam } = require("../../utilities/discord-fetch-utils");
const { LLPointManager } = require("../../services/ll-points/ll-point-manager");

const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the viewer whose name you want to change",
		isAutocomplete: true,
	}),
	NewViewerName: new Parameter({
		type: "string",
		name: "new-viewer-name",
		description: "The new name of the viewer",
	}),
}

module.exports = new SlashCommand({
	name: "rename-viewer",
	description: "Rename a viewer in the LL Point Manager",
	parameters: [
		Parameters.ViewerName,
		Parameters.NewViewerName,
	],
	allowsDMs: true,
	required_permissions: [PermissionFlagsBits.Administrator],
	execute: async function(interaction) {
		await deferInteraction(interaction);
		const viewerName = getRequiredStringParam(interaction, Parameters.ViewerName.name);
		const newViewerName = getRequiredStringParam(interaction, Parameters.NewViewerName.name);

		const llPointManager = global.LLPointManager;
		llPointManager.changeNameOfViewer(viewerName, newViewerName);

		await editReplyToInteraction(interaction, `Successfully renamed ${viewerName} to ${newViewerName}`);
	},
	autocomplete: LLPointManager.getViewersAutocompleteValues,
});