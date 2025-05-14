const ids = require("../bot-config/discord-ids");
const { RDMRoles } = require("../modules/enums");
const { addRole } = require("../modules/functions");
const { fetchGuild, fetchRole, fetchRoleByName } = require("../utilities/discord-fetch-utils");

const onUserJoinsServer = async function(guildMember) {
	if (guildMember.guild.id === ids.servers.rapid_discord_mafia) {
		const rdmGuild = await fetchGuild(ids.servers.rapid_discord_mafia);
		const spectatorRole = await fetchRoleByName(rdmGuild, RDMRoles.Spectator);

		await addRole(guildMember, spectatorRole);
	}
	else if (guildMember.guild.id === ids.servers.ll_game_show_center) {
		const LLGameShowsGuild = await fetchGuild(ids.servers.ll_game_show_center);
		const viewerRole = await fetchRole(LLGameShowsGuild, ids.ll_game_shows.roles.viewer);

		await addRole(guildMember, viewerRole);
	}
};

module.exports = {onUserJoinsServer};