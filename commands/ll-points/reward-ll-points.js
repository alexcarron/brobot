const { PermissionFlagsBits } = require('discord.js');
const { Parameter } = require('../../services/command-creation/parameter');
const { SlashCommand } = require('../../services/command-creation/slash-command');
const { LLPointAccomplishment, LLPointReward } = require('../../services/ll-points/ll-point-enums.js');
const { deferInteraction } = require('../../utilities/discord-action-utils');
const { LLPointManager } = require('../../services/ll-points/ll-point-manager.js');
const { getRequiredStringParam, getStringParamValue } = require('../../utilities/discord-fetch-utils');

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

module.exports = new SlashCommand({
	name: "reward-ll-points",
	description: "Give LL Points to a viewer because of their accomplishments.",
	allowsDMs: true,
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.ViewerName,
		Parameters.Accomplishment,
		Parameters.ThingParticipatedIn,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		let viewer_name = getRequiredStringParam(interaction, Parameters.ViewerName.name);
		let viewer = global.LLPointManager.getViewerByName(viewer_name);

		let
			accomplishment = getRequiredStringParam(interaction, Parameters.Accomplishment.name),
			game_name = getStringParamValue(interaction, Parameters.ThingParticipatedIn.name) || undefined;

		if (!viewer) {
			return await interaction.editReply(`The viewer, **${viewer_name}**, doesn't exist.`);
		}

		// @ts-ignore
		if (!Object.values(LLPointAccomplishment).includes(accomplishment)) {
			return await interaction.editReply(
				`The accomplishment, **${accomplishment}**, doesn't exist.\n` + Object.values(LLPointAccomplishment).join(", ")
			);
		}

		const result_msg = await viewer.giveReward(accomplishment, game_name);

		if (result_msg !== "Success")
			return await interaction.editReply(result_msg);

		let current_ll_points = global.LLPointManager.viewers.get(viewer_name).ll_points;
		// @ts-ignore
		let accomplishment_key = Object.keys(LLPointAccomplishment).find(key => LLPointAccomplishment[key] === accomplishment);

		if (accomplishment_key === undefined)
			return await interaction.editReply(`The accomplishment, **${accomplishment}**, doesn't exist.`);

		await interaction.editReply(
			// @ts-ignore
			`Giving **${viewer_name}** \`${LLPointReward[accomplishment_key]}\` LL Point(s) for "*${accomplishment}*"\n` +
			`They now have \`${current_ll_points}\` LL Point(s).`
		);
		await global.LLPointManager.updateDatabase();
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		if (focused_param.name === Parameters.Accomplishment.name) {
			autocomplete_values = Object.values(LLPointAccomplishment)
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
});