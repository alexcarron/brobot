const Parameter = require('../../modules/commands/Paramater.js');
const SlashCommand = require('../../modules/commands/SlashCommand.js');
const { LLPointPerks } = require('../../modules/enums.js')
const { deferInteraction, confirmAction, getUser } = require("../../modules/functions.js");
const ids = require(`../../bot-config/discord-ids.js`)

const Parameters = {
	Perk: new Parameter({
		type: "string",
		name: "perk-claiming",
		description: "The perk that you want to claim",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "claim-perk",
	description: "Claim a perk for your LL Point Tier that you want to recieve",
});
command.parameters = [
	Parameters.Perk,
]
command.allowsDMs = true;
command.required_servers = [ids.ll_game_shows.server_id];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	let
		viewer_id = interaction.user.id,
		viewer = await global.LLPointManager.getViewerById(viewer_id);

	let
		perk = interaction.options.getString(Parameters.Perk.name);

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

	if (!Object.values(LLPointPerks).includes(perk)) {
		return await interaction.editReply(
			`The perk, **${perk}**, doesn't exist.\n` + Object.values(LLPointPerks).join(", ")
		);
	}

	console.log({viewer, perk});

	const LL_user = await getUser(ids.users.LL);
	await LL_user.send(`${interaction.user.username}: <@${interaction.user.id}> wants to redeem their perk, ${perk}!`);

	await interaction.editReply(
		`LL has been notified and will redeem your perk if it's valid and possible as soon as they feel like it.`
	);
}
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	autocomplete_values = Object.values(LLPointPerks)
		.map((perk_str) => {
			return {name: perk_str, value: perk_str}
		})
		.filter(autocomplete_entry =>
			autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase())
		);

	if (Object.values(autocomplete_values).length <= 0) {
		autocomplete_values = [{name: "Sorry, there are no perks to choose from", value: "N/A"}];
	}
	else if (Object.values(autocomplete_values).length > 25) {
		autocomplete_values.splice(25);
	}

	await interaction.respond(
		autocomplete_values
	);
}
module.exports = command;