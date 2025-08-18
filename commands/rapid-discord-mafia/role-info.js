const { Parameter } = require("../../services/command-creation/parameter");
const { ids } = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { getRequiredStringParam } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	RoleName: new Parameter({
		type: "string",
		name: "role-name",
		description: "The name of role you want information on",
		isAutocomplete: true,
	}),
}

module.exports = new SlashCommand({
	name: "role-info",
	description: "Get information about a specific role",
	parameters: [
		Parameters.RoleName,
	],
	required_servers: [ids.servers.rapid_discord_mafia],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		const role_name = getRequiredStringParam(interaction, Parameters.RoleName.name)
		const role = global.game_manager.role_manager.getRole(role_name);

		interaction.editReply(role.toString());
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		const all_roles = global.game_manager.role_manager.getListOfRoles() ?? [];

		autocomplete_values =
			all_roles
				.map(role => {return {name: role.name, value: role.name}})
				.filter(autocomplete_entry =>
					autocomplete_entry.value.toLowerCase().startsWith(entered_value.toLowerCase())
				);

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no roles to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);
	}
});