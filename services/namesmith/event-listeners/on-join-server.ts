import { GuildMember } from "discord.js";
import { ids } from "../../../bot-config/discord-ids";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Checks if a guild member is a member of the Namesmith server.
 * @param guildMember - The guild member to check.
 * @returns True if the guild member is in the Namesmith server, false otherwise.
 */
export const isMemberInNamesmith = function(guildMember: GuildMember): boolean {
	return guildMember.guild.id === ids.servers.NAMESMITH;
}


/**
 * Handles actions to be taken when a user joins the Namesmith server.
 * @param guildMember - The guild member who joined the Namesmith server.
 */
export const onUserJoinsNamesmith = async function(guildMember: GuildMember) {
	const { playerService } = getNamesmithServices();
	await playerService.addNewPlayer(guildMember.id);
}