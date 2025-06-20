const ids = require("../bot-config/discord-ids");
const { isMemberInNamesmith, onUserJoinsNamesmith } = require("../services/namesmith/namesmith-lifecycle");
const { RDMDiscordRole } = require("../services/rapid-discord-mafia/discord-service");
const { addRoleToMember } = require("../utilities/discord-action-utils");
const { fetchGuild, fetchRole, fetchRoleByName } = require("../utilities/discord-fetch-utils");

const onUserJoinsServer = async function(guildMember) {
	if (guildMember.guild.id === ids.servers.rapid_discord_mafia) {
		const rdmGuild = await fetchGuild(ids.servers.rapid_discord_mafia);
		const spectatorRole = await fetchRoleByName(rdmGuild, RDMDiscordRole.SPECTATOR);

		await addRoleToMember(guildMember, spectatorRole);
	}
	else if (guildMember.guild.id === ids.servers.ll_game_show_center) {
		const LLGameShowsGuild = await fetchGuild(ids.servers.ll_game_show_center);
		const viewerRole = await fetchRole(LLGameShowsGuild, ids.ll_game_shows.roles.viewer);

		await addRoleToMember(guildMember, viewerRole);
	}
	else if (guildMember.guild.id === ids.sandSeason3.guild) {
		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);
    const spectatorRole = await fetchRole(sandSeason3Guild, ids.sandSeason3.roles.spectator);

		await addRoleToMember(guildMember, spectatorRole);
	}

	if (isMemberInNamesmith(guildMember)) {
		await onUserJoinsNamesmith(guildMember);
	}
};

module.exports = {onUserJoinsServer};