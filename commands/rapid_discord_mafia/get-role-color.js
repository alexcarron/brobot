const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const ids = require("../../databases/ids.json");
const { deferInteraction, getRole, getGuildMember, addRole } = require("../../modules/functions");
const { playlist_info } = require("play-dl");

const Parameters = {
	Color: new Parameter({
		type: "string",
		name: "role-color",
		description: "The color you want your name to be outside of games",
		isAutocomplete: true,
	})
};

const command = new SlashCommand({
	name: "get-role-color",
	description: "Give your name a custom color outside of games",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.parameters = [
	Parameters.Color,
];
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const role_color = interaction.options.getString(Parameters.Color.name);

	if (
		!role_color.startsWith("#")
	) {
		const non_digits = [...entered_value.slice(1).matchAll(/[^0-9a-fA-F]/g)];
		const digits = [...entered_value.slice(1).matchAll(/[0-9a-fA-F]/g)];
		if (
			non_digits.length > 0 ||
			digits.length == 6
		) {
			return await interaction.editReply(`\`${role_color}\` is not a valid role color`);
		}
	}

	const color_num = parseInt(role_color.replace(/^#/, ''), 16);
	const user = interaction.user;
	const user_guild_member = await getGuildMember(interaction.guild, user.id);
	const user_name = user.username;
	const role_name = user_name + "'s Role Color";
	let role = await getRole(interaction.guild, role_name);

	if (role) {
		role.setColor(color_num);
	}
	else {
		role = await interaction.guild.roles.create(
			{
				name: role_name,
				color: color_num,
			}
		)
		role = await getRole(interaction.guild, role_name);

		addRole(user_guild_member, role);
	};

	await interaction.editReply(`Your role color has been changed to \`${role_color}\``)
}
command.autocomplete = async function(interaction) {
	const focused_param = await interaction.options.getFocused(true);
	if (!focused_param) return;
	const entered_value = focused_param.value;

	let custom_autocomplete_entry = "[Invalid Custom Hex Color Input]";

	if (entered_value.startsWith("#")) {
		const non_digits = [...entered_value.slice(1).matchAll(/[^0-9a-fA-F]/g)];
		const digits = [...entered_value.slice(1).matchAll(/[0-9a-fA-F]/g)];

		if (
			non_digits.length <= 0 &&
			digits.length <= 6
		) {
			const num_extra_0s_needed = 6-digits.length;
			custom_autocomplete_entry = entered_value + "0".repeat(num_extra_0s_needed);
		}
		else {
			custom_autocomplete_entry = "[Custom Hex Color Must Consist of 6 Hexadecimal Numbers]";
		}
	}
	else {
		custom_autocomplete_entry = "[Custom Hex Color Input Must Start With \"#\"]";
	}

	let autocomplete_values = [{name: custom_autocomplete_entry, value: custom_autocomplete_entry}];
	if (custom_autocomplete_entry.startsWith("["))
		autocomplete_values = [{name: custom_autocomplete_entry, value: entered_value}];

	let default_values = [
		{name: "Red", value: "#db3e3e"},
		{name: "Orange", value: "#db7e3e"},
		{name: "Yellow", value: "#e9d400"},
		{name: "Olive", value: "#a2ce24"},
		{name: "Lime Green", value: "#4fce24"},
		{name: "Aquamarine", value: "#24ce7b"},
		{name: "Cyan", value: "#24cec5"},
		{name: "Aqua Blue", value: "#24a0ce"},
		{name: "Dark Blue", value: "#2a4adf"},
		{name: "Purple", value: "#693bee"},
		{name: "Magenta", value: "#af2ee9"},
		{name: "Pink", value: "#e22ee9"},
		{name: "Hot Pink", value: "#e92e85"},
		{name: "Gray", value: "#7c7c7c"},
	];

	default_values = default_values.filter(autocomplete_entry =>
		autocomplete_entry.name.toLowerCase().startsWith(
			entered_value.toLowerCase()
		)
	);

	autocomplete_values = [
		...autocomplete_values,
		...default_values,
	];

	if (Object.values(autocomplete_values).length <= 0) {
		autocomplete_values = [{name: "There are no colors to choose from", value: "[N/A]"}];
	}
	else if (Object.values(autocomplete_values).length > 25) {
		autocomplete_values.splice(25);
	}

	await interaction.respond(
		autocomplete_values
	);
}

module.exports = command;
