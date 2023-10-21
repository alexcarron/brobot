const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const RoleIdentifier = require("../../modules/rapid_discord_mafia/RoleIdentifier");
const Game = require("../../modules/rapid_discord_mafia/game");

/* eslint-disable no-unused-vars */
const
	{ PermissionFlagsBits } = require("discord.js"),
	{ faction_names, max_ratios } = require("../../databases/rapid_discord_mafia/constants"),
	{ Phases, GameStates, Subphases, Factions, AbilityUses, Announcements, PhaseWaitTimes, MessageDelays } = require("../../modules/enums"),
	{
		getChannel,
		shuffleArray,
		getRandArrayItem,
		getGuildMember,
		getCategoryChildren,
		getRole,
		logColor,
		wait,
		getUnixTimestamp,
		deferInteraction
	} = require("../../modules/functions"),
	{
		town_discussion_channel_id: day_chat_chnl_id,
		living_role_id,
		pre_game_category_id,
		channels: channel_ids
	} = require("../../databases/ids.json").rapid_discord_mafia,
	rdm_ids = require("../../databases/ids.json").rapid_discord_mafia,
	ids = require("../../databases/ids.json");


const command = new SlashCommand({
	name: "start-game",
	description: "Start an RDM game. Required: Players in players.json, player text channels",
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

	const player_count = global.Game.Players.getPlayerCount();

	// Check if players exist
	if (player_count <= 0) {
		interaction.editReply(`There's no players. Try running \`<startsignups\``);
	}
	// Check if player count equal role amount
	else if (player_count != role_identifier_strings.length) {
		interaction.editReply(`You included ${role_identifier_strings.length} roles, but there's ${player_count} players.`)
	}

	if (
		global.Game.state !== GameStates.ReadyToBegin &&
		interaction.user.id !== ids.users.LL
	) {
		return await interaction.editReply(`The game isn't ready to begin. It's in the phase ${global.Game.state}`);
	}

	await role_identifier_strings.forEach(async role_identifier_str => {
		if (!RoleIdentifier.isValidIdentifierStr(role_identifier_str)) {
			return await interaction.editReply(`**${role_identifier_str}** is not a valid role identifier`);
		}
	});

	await global.Game.start(role_identifier_strings);
}

module.exports = command;
