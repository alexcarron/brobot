const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { LLPointAccomplishments } = require('../../modules/enums.js')
const { deferInteraction, confirmAction } = require("../../modules/functions.js");
const LLPointManager = require('../../modules/llpointmanager.js');
const ids = require(`../../bot-config/discord-ids.js`);
const { fetchUser } = require('../../utilities/discord-fetch-utils.js');

const Parameters = {
	Accomplishment: new Parameter({
		type: "string",
		name: "for-accomplishment",
		description: "The accomplishment you want to be rewarded for",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "claim-ll-points",
	description: "Claim LL Points you think you should have recieved",
});
command.parameters = [
	Parameters.Accomplishment,
]
command.allowsDMs = true;
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	let
		viewer_id = interaction.user.id,
		viewer = await global.LLPointManager.getViewerById(viewer_id);

	let
		accomplishment = interaction.options.getString(Parameters.Accomplishment.name);

	if (!viewer) {
		if (
			!await confirmAction({
				interaction,
				message: `You have not been added to the LL Point database yet, would you like to add yourself as **${interaction.user.username}**?`,
				confirm_txt: `Add Me to the Database`,
				cancel_txt: `Don't Add Me to the Database`,
				confirm_update_txt: `**${interaction.user.username}** has been added to the LL Point database!`,
				cancel_update_txt: `Canceled LL Point Claim`
			})
		) {
			return
		}
		else {
			await global.LLPointManager.addViewerFromUser(interaction.user);
			await global.LLPointManager.updateDatabase();
			viewer = await global.LLPointManager.getViewerById(interaction.user.id);
		}
	}

	if (!Object.values(LLPointAccomplishments).includes(accomplishment)) {
		return await interaction.editReply(
			`The accomplishment, **${accomplishment}**, doesn't exist.\n` + Object.values(LLPointAccomplishments).join(", ")
		);
	}

	console.log({viewer, accomplishment});

	if (
		accomplishment === LLPointAccomplishments.DoDeltaruneQuiz &&
		viewer.didDeltaruneQuiz
	) {
		return await interaction.editReply(
			`You already were rewarded for ${LLPointAccomplishments.DoDeltaruneQuiz}`
		);
	}

	if (
		accomplishment === LLPointAccomplishments.DoUndertaleQuiz &&
		viewer.didUndertaleQuiz
	) {
		return await interaction.editReply(
			`You already were rewarded for ${LLPointAccomplishments.DoUndertaleQuiz}`
		);
	}

	if (
		accomplishment === LLPointAccomplishments.Subscribe &&
		viewer.isSubscribed
	) {
		return await interaction.editReply(
			`You already were rewarded for ${LLPointAccomplishments.Subscribe}`
		);
	}

	const LL_user = await fetchUser(ids.users.LL);
	await LL_user.send(`${interaction.user.username}: <@${interaction.user.id}> believes they accomplished ${accomplishment}!`);

	await interaction.editReply(
		`LL has been notified and will verify your accomplishment as soon as they feel like it.`
	);
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

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
module.exports = command;