const ids = require("../bot-config/discord-ids");
const { RDMRoles } = require("../modules/enums");
const { getRole, addRole, getRoleById } = require("../modules/functions");
const { fetchGuild } = require("../utilities/discord-fetch-utils");

const onUserJoinsServer = async function(guildMember) {
	if (guildMember.guild.id === ids.servers.rapid_discord_mafia) {
		const rdmGuild = await fetchGuild(ids.servers.rapid_discord_mafia);
		const spectatorRole = await getRole(rdmGuild, RDMRoles.Spectator);

		await addRole(guildMember, spectatorRole);
	}
	else if (guildMember.guild.id === ids.servers.ll_game_show_center) {
		const LLGameShowsGuild = await fetchGuild(ids.servers.ll_game_show_center);
		const viewerRole = await getRoleById(LLGameShowsGuild, ids.ll_game_shows.roles.viewer);

		await addRole(guildMember, viewerRole);
	}
};

module.exports = {onUserJoinsServer};