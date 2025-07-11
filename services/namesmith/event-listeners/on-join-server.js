const { GuildMember } = require("discord.js");
const ids = require("../../../bot-config/discord-ids");
const { fetchRole } = require("../../../utilities/discord-fetch-utils");
const { addRoleToMember, setNicknameOfMember } = require("../../../utilities/discord-action-utils");
const { getNamesmithServices } = require("../services/get-namesmith-services");

const NO_NAME = "ˑ";

/**
 * Checks if a guild member is a member of the Namesmith server.
 * @param {GuildMember} guildMember - The guild member to check.
 * @returns {boolean} True if the guild member is in the Namesmith server, false otherwise.
 */
const isMemberInNamesmith = function(guildMember) {
	return guildMember.guild.id === ids.servers.namesmith;
}


/**
 * Handles actions to be taken when a user joins the Namesmith server.
 *
 * @param {GuildMember} guildMember - The guild member who joined the Namesmith server.
 * @returns {Promise<void>} A promise that resolves once roles are assigned and the nickname is set.
 */
const onUserJoinsNamesmith = async function(guildMember) {
	await playerService.addNewPlayer(guildMember.id);
}

module.exports = { isMemberInNamesmith, onUserJoinsNamesmith };