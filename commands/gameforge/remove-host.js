const { PermissionFlagsBits } = require("discord.js");
const Parameter = require("../../modules/commands/Paramater");
const SlashCommand = require("../../modules/commands/SlashCommand");
const { deferInteraction, getRole, getGuild, removeRole, getGuildMember, addRole } = require("../../modules/functions");
const ids = require(`../../databases/ids.json`);
const GameForge = require("../../modules/gameforge/gameforge");
const { GameForgeBadges } = require("../../modules/enums");

const Parameters = {
	HostRemoving: new Parameter({
		type: "string",
		name: "host-removing",
		description: "The host you want removed",
		isAutocomplete: true,
	})
}

const command = new SlashCommand({
	name: "remove-host",
	description: "Remove an incative hosts",
});
command.parameters = [
	Parameters.HostRemoving,
]
command.required_permissions = [PermissionFlagsBits.Administrator]
command.required_servers = [ids.servers.gameforge];
command.execute = async function(interaction) {
	await deferInteraction(interaction);
	const host_id = interaction.options.getString(Parameters.HostRemoving.name);
	const host = global.GameForge.getHostByID(host_id);

	Object.values(GameForgeBadges).forEach(badge_name =>
		host.removeBadge(badge_name)
	);

	await global.GameForge.removeHostByID(host_id);
	await interaction.editReply(`Removed ${host.name} of ${host_id}.`);

	try {
		const gameforge_guild = await getGuild(ids.servers.gameforge)
		const host_role = await getRole(gameforge_guild, "Host")
		const outsider_role = await getRole(gameforge_guild, "Outsider")
		const host_guild_member = await getGuildMember(gameforge_guild, host_id)
		await removeRole(host_guild_member, host_role)
		await addRole(host_guild_member, outsider_role)
	}
	catch (error) {
		console.error(error)
		console.log("Failed to remove role")
	}
}
command.autocomplete = GameForge.getHostsAutocomplete
module.exports = command;