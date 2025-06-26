const { ChatInputCommandInteraction, PermissionFlagsBits } = require("discord.js");
const { Parameter } = require("../../services/command-creation/parameter");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../utilities/discord-action-utils");
const { getStringParamValue } = require("../../utilities/discord-fetch-utils");
const { LLPointManager } = require("../../services/ll-points/ll-point-manager");

const Parameters = {
	ViewerName: new Parameter({
		type: "string",
		name: "viewer-name",
		description: "The name of the viewer whose name you want to change",
		isRequired: true,
		isAutocomplete: true,
	}),
	NewViewerName: new Parameter({
		type: "string",
		name: "new-viewer-name",
		description: "The new name of the viewer",
		isRequired: true,
	}),
}

const command = new SlashCommand({
	name: "rename-viewer",
	description: "Rename a viewer in the LL Point Manager",
});
command.parameters = [
	Parameters.ViewerName,
	Parameters.NewViewerName,
]
command.allowsDMs = true;
command.required_permissions = [PermissionFlagsBits.Administrator];

/**
 * @param {ChatInputCommandInteraction} interaction
 * @description Rename a viewer in the LL Point Manager
 * @returns {Promise<void>}
 */
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	const viewerName = getStringParamValue(interaction, Parameters.ViewerName.name);
	const newViewerName = getStringParamValue(interaction, Parameters.NewViewerName.name);

	const llPointManager = global.LLPointManager;
	llPointManager.changeNameOfViewer(viewerName, newViewerName);

	await editReplyToInteraction(interaction, `Successfully renamed ${viewerName} to ${newViewerName}`);
};

command.autocomplete = LLPointManager.getViewersAutocompleteValues;

module.exports = command;