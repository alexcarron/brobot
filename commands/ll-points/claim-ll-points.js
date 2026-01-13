const { Parameter } = require('../../services/command-creation/parameter');
const { SlashCommand } = require('../../services/command-creation/slash-command');
const { ids } = require(`../../bot-config/discord-ids`);
const { fetchUser, getRequiredStringParam } = require('../../utilities/discord-fetch-utils.js');
const { confirmInteractionWithButtons, deferInteraction } = require('../../utilities/discord-action-utils');
const { LLPointAccomplishment } = require('../../services/ll-points/ll-point-enums.js');

const Parameters = {
	Accomplishment: new Parameter({
		type: "string",
		name: "for-accomplishment",
		description: "The accomplishment you want to be rewarded for",
		isAutocomplete: true,
	}),
}

module.exports = new SlashCommand({
	name: "claim-ll-points",
	description: "Claim LL Points you think you should have recieved",
	parameters: [
		Parameters.Accomplishment,
	],
	allowsDMs: true,
	execute: async function(interaction) {
		await deferInteraction(interaction);

		let viewer_id = interaction.user.id;
		let viewer = await global.LLPointManager.getViewerById(viewer_id);

		let accomplishment = getRequiredStringParam(interaction, Parameters.Accomplishment.name);

		if (!viewer) {
			if (
				!await confirmInteractionWithButtons({
					interaction,
					message: `You have not been added to the LL Point database yet, would you like to add yourself as **${interaction.user.username}**?`,
					confirmText: `Add Me to the Database`,
					cancelText: `Don't Add Me to the Database`,
					confirmUpdateText: `**${interaction.user.username}** has been added to the LL Point database!`,
					cancelUpdateText: `Canceled LL Point Claim`
				})
			) {
				return
			}
			else {
				await global.LLPointManager.addViewerFromUser(interaction.user);
				await global.LLPointManager.updateDatabase();
				viewer = await global.LLPointManager.getViewerById(interaction.user.id);

				if (!viewer) {
					return await interaction.editReply("There was an error adding you to the LL Point database.");
				}
			}
		}

		// @ts-ignore
		if (!Object.values(LLPointAccomplishment).includes(accomplishment)) {
			return await interaction.editReply(
				`The accomplishment, **${accomplishment}**, doesn't exist.\n` + Object.values(LLPointAccomplishment).join(", ")
			);
		}

		if (
			accomplishment === LLPointAccomplishment.DO_DELTARUNE_QUIZ &&
			viewer.didDeltaruneQuiz
		) {
			return await interaction.editReply(
				`You already were rewarded for ${LLPointAccomplishment.DO_DELTARUNE_QUIZ}`
			);
		}

		if (
			accomplishment === LLPointAccomplishment.DO_UNDERTALE_QUIZ &&
			viewer.didUndertaleQuiz
		) {
			return await interaction.editReply(
				`You already were rewarded for ${LLPointAccomplishment.DO_UNDERTALE_QUIZ}`
			);
		}

		if (
			accomplishment === LLPointAccomplishment.SUBSCRIBE &&
			viewer.isSubscribed
		) {
			return await interaction.editReply(
				`You already were rewarded for ${LLPointAccomplishment.SUBSCRIBE}`
			);
		}

		const LL_user = await fetchUser(ids.users.LL);
		await LL_user.send(`${interaction.user.username}: <@${interaction.user.id}> believes they accomplished ${accomplishment}!`);

		await interaction.editReply(
			`LL has been notified and will verify your accomplishment as soon as they feel like it.`
		);
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

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
	},
});