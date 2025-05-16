const Parameter = require("../../services/command-creation/parameter");
const ids = require("../../bot-config/discord-ids.js");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { toTitleCase } = require("../../utilities/text-formatting-utils.js");
const { appendToNestedProperty } = require("../../utilities/data-structure-utils.js");

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

		appendToNestedProperty(role_names_in_faction, [faction, alignment], name);
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