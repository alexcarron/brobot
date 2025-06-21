const { GuildMember } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const { fetchRole } = require("../../utilities/discord-fetch-utils");
const { addRoleToMember, setNicknameOfMember } = require("../../utilities/discord-action-utils");
const { loadObjectFromJsonInGitHub } = require("../../utilities/github-json-storage-utils");
const { logInfo, logSuccess } = require("../../utilities/logging-utils");

const NO_NAME = "ˑ";
const GITHUB_JSON_FILE_NAME = "namesmith";

/**
 * Sets up Namesmith by loading the Namesmith data from a GitHub JSON file into the global object.
 * @returns {Promise<void>} A promise that resolves once the Namesmith data has been loaded and set up.
 */
const setupNamesmith = async () => {
	logInfo("Setting up Namesmith...");

	const namesmithData = await loadObjectFromJsonInGitHub(GITHUB_JSON_FILE_NAME);

	global.namesmith = namesmithData;

	logSuccess("Namesmith set up");
}

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
	const namesmithGuild = guildMember.guild;
	const noNameRole = await fetchRole(namesmithGuild, ids.namesmith.roles.noName);

	await addRoleToMember(guildMember, noNameRole);

	await setNicknameOfMember(guildMember, NO_NAME);
}

module.exports = { isMemberInNamesmith, onUserJoinsNamesmith, setupNamesmith };