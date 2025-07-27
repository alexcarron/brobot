const { Parameter } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { PermissionFlagsBits } = require('discord.js');
const { LLPointManager } = require('../../services/ll-points/ll-point-manager.js');
const { findStringStartingWith } = require('../../utilities/text-formatting-utils.js');
const { deferInteraction } = require('../../utilities/discord-action-utils.js');
const { getRequiredStringParam, getRequiredNumberParam } = require("../../utilities/discord-fetch-utils");

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

module.exports = new SlashCommand({
	name: "add-ll-points",
	description: "Give a certain amount of LL Points to a viewer",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.ViewerName,
		Parameters.LLPointAmount,
	],
	allowsDMs: true,
	execute: async function(interaction) {
		deferInteraction(interaction, "Adding LL Points...");

		const viewer_name_arg = getRequiredStringParam(interaction, Parameters.ViewerName.name);
		const added_points = getRequiredNumberParam(interaction, Parameters.LLPointAmount.name);

		let viewer = await global.LLPointManager.getViewerByName(viewer_name_arg);
		let viewer_name = viewer_name_arg;

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

		await global.LLPointManager.viewers.get(viewer_name).addLLPoints(added_points);
		await global.LLPointManager.updateDatabase();
		let current_ll_points = await global.LLPointManager.viewers.get(viewer_name).ll_points;

		await interaction.editReply(
			`Giving **${viewer_name}** \`${added_points}\` LL Point(s)...\n` +
			`They now have \`${current_ll_points}\` LL Point(s).`
		);
	},
	autocomplete: LLPointManager.getViewersAutocompleteValues,
});