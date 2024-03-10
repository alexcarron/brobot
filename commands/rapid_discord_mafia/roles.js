const Parameter = require("../../modules/commands/Paramater");
const ids = require("../../data/ids.json");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, appendElementToNestedProperty: addElementToNestedProperty, appendElementToNestedProperty, toTitleCase } = require("../../modules/functions");

const command = new SlashCommand({
	name: "roles",
	description: "Get a list of all possible roles in the game",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	const role_names_in_faction = {};
	let message = "";

	global.game_manager.role_manager.getListOfRoles().forEach(role => {
		const faction = role.faction;
		const alignment = role.alignment;
		const name = role.name;

		appendElementToNestedProperty(name, role_names_in_faction, faction, alignment);
	});

	for (const [faction, role_names_in_alignment] of Object.entries(role_names_in_faction)) {
		message += `\n## ${toTitleCase(faction)}`;

		for (const [alignment, role_names] of Object.entries(role_names_in_alignment)) {
			message += `\n**${toTitleCase(faction)} ${toTitleCase(alignment)}**`;

			for (const role_name of role_names) {
				message += `\n> ${role_name}`;
			}
			message += "\n";
		}
	}

	interaction.editReply(message);
};
module.exports = command;