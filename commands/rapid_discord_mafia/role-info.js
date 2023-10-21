const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../databases/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction } = require("../../modules/functions");
const roles = require("../../modules/rapid_discord_mafia/roles");

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
	const role = Object.values(roles).find(role => role.name === role_name);

	interaction.editReply(role.toString(isInfoOnly=true));
};
command.autocomplete = async function(interaction) {
	let autocomplete_values;
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	autocomplete_values =
		Object.values(roles)
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

	console.log({autocomplete_values});

	await interaction.respond(
		autocomplete_values
	);
};

module.exports = command;