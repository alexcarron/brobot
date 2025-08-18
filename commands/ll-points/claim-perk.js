const { Parameter } = require('../../services/command-creation/parameter');
const { SlashCommand } = require('../../services/command-creation/slash-command');
const { deferInteraction } = require('../../utilities/discord-action-utils.js');
const { ids } = require(`../../bot-config/discord-ids`);
const { fetchUser, getRequiredStringParam } = require('../../utilities/discord-fetch-utils.js');
const { confirmInteractionWithButtons } = require('../../utilities/discord-action-utils.js');
const { LLPointPerk } = require('../../services/ll-points/ll-point-enums.js');

const Parameters = {
	Perk: new Parameter({
		type: "string",
		name: "perk-claiming",
		description: "The perk that you want to claim",
		isAutocomplete: true,
	}),
}

module.exports = new SlashCommand({
	name: "claim-perk",
	description: "Claim a perk for your LL Point Tier that you want to recieve",
	parameters: [
		Parameters.Perk,
	],
	allowsDMs: true,
	required_servers: [ids.ll_game_shows.server_id],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		let viewer_id = interaction.user.id;
		let viewer = await global.LLPointManager.getViewerById(viewer_id);

		let perk = getRequiredStringParam(interaction, Parameters.Perk.name);

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
			}
		}

		// @ts-ignore
		if (!Object.values(LLPointPerk).includes(perk)) {
			return await interaction.editReply(
				`The perk, **${perk}**, doesn't exist.\n` + Object.values(LLPointPerk).join(", ")
			);
		}

		const LL_user = await fetchUser(ids.users.LL);
		await LL_user.send(`${interaction.user.username}: <@${interaction.user.id}> wants to redeem their perk, ${perk}!`);

		await interaction.editReply(
			`LL has been notified and will redeem your perk if it's valid and possible as soon as they feel like it.`
		);
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		autocomplete_values = Object.values(LLPointPerk)
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
});