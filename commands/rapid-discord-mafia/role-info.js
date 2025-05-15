const Parameter = require("../../services/command-creation/Paramater");
const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../services/command-creation/SlashCommand");
const { deferInteraction } = require("../../utilities/discord-action-utils");

const Parameters = {
	RoleName: new Parameter({
		type: "string",
		name: "role-name",
		description: "The name of role you want information on",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "role-info",
	description: "Get information about a specific role",
});
command.parameters = [
	Parameters.RoleName,
];
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const role_name = interaction.options.getString(Parameters.RoleName.name)
	const role = global.game_manager.role_manager.getRole(role_name);

	interaction.editReply(role.toString(isInfoOnly=true));
};
command.autocomplete = async function(interaction) {
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
};

module.exports = command;