const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const RoleIdentifier = require("../../modules/rapid_discord_mafia/RoleIdentifier");

/* eslint-disable no-unused-vars */
const
	{ PermissionFlagsBits } = require("discord.js"),
	{ GameStates } = require("../../modules/enums"),
	{
		deferInteraction
	} = require("../../modules/functions"),
	ids = require("../../bot-config/discord-ids.json");


const command = new SlashCommand({
	name: "start-game",
	description: "Start an RDM game.",
});
command.required_servers = [ids.servers.rapid_discord_mafia];
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	new Parameter({
		type: "string",
		name: "role-identifiers",
		description: "A comma-seperated list of the role identifiers that will be in this game's role list",
	})
];
command.execute = async function execute(interaction, role_identifiers_str) {
	await deferInteraction(interaction);

	role_identifiers_str = interaction.options.getString(command.parameters[0].name);
	const role_identifier_strings = role_identifiers_str.split(', ');

	const player_count = global.game_manager.player_manager.getPlayerCount();

	// Check if players exist
	if (player_count <= 0) {
		interaction.editReply(`There's no players. Try running \`<startsignups\``);
	}
	// Check if player count equal role amount
	else if (player_count != role_identifier_strings.length) {
		return await interaction.editReply(`You included ${role_identifier_strings.length} roles, but there's ${player_count} players.`)
	}

	if (
		global.game_manager.state !== GameStates.ReadyToBegin &&
		interaction.user.id !== ids.users.LL
	) {
		return await interaction.editReply(`The game isn't ready to begin. It's in the phase ${global.game_manager.state}`);
	}

	await role_identifier_strings.forEach(async role_identifier_str => {
		if (!RoleIdentifier.isValidIdentifierStr(role_identifier_str)) {
			return await interaction.editReply(`**${role_identifier_str}** is not a valid role identifier`);
		}
	});

	console.log({role_identifier_strings});
	await global.game_manager.start(RoleIdentifier.convertIdentifierStrings(role_identifier_strings));
}

module.exports = command;
