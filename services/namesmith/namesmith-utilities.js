const { GuildMember } = require("discord.js");
const { memberHasRole, setNicknameOfMember, removeRoleFromMember, addRoleToMember } = require("../../utilities/discord-action-utils");
const ids = require("../../bot-config/discord-ids");
const { fetchPublishedNamesChannel, fetchNamesmithGuildMember } = require("./namesmith-discord-entities");
const { publishNameInDatabase, getPublishedNameInDatabase } = require("./namesmith-database-utils");

const MAX_NAME_LENGTH = 32;

/**
 * Adds a character to a guild member's nickname.
 * @param {GuildMember} guildMember The guild member whose nickname is to be modified.
 * @param {string} character The character to add to the guild member's nickname.
 * @returns {Promise<void>} A promise that resolves once the nickname has been modified.
 */
const addCharacterToMember = async (guildMember, character) => {
	const currentNickname = guildMember.nickname;

	if (currentNickname + 1 >= MAX_NAME_LENGTH)
		return;

	if (await memberHasRole(guildMember, ids.namesmith.roles.noName)) {
		await setNicknameOfMember(guildMember, character);
		await removeRoleFromMember(guildMember, ids.namesmith.roles.noName);
		await addRoleToMember(guildMember, ids.namesmith.roles.smithedName);
	}
	else {
		const newNickname = currentNickname + character;
		await guildMember.setNickname(newNickname);
	}
}

/**
 * Retrieves the current name of a player.
 * @param {string} playerID The ID of the player whose name is to be retrieved.
 * @returns {Promise<string>} The current name of the player.
 */
const fetchPlayerName = async (playerID) => {
	const playerMember = await fetchNamesmithGuildMember(playerID);
	return playerMember.nickname;
}

const publishNameOfPlayer = async (playerID) => {
	const publishedNamesChannel = await fetchPublishedNamesChannel();
	const currentName = await fetchPlayerName(playerID);

	await publishedNamesChannel.send(
		`<@${playerID}> has published their name: \`${currentName}\``
	);

	publishNameInDatabase(playerID, currentName);
}

/**
 * Retrieves the name a player has currently published
 * @param {string} playerID The ID of the player whose name is to be retrieved.
 * @returns {string} The published name of the player.
 */
const getPublishedNameOfPlayer = (playerID) => {
  return getPublishedNameInDatabase(playerID);
}

module.exports = { addCharacterToMember, fetchPlayerName, publishNameOfPlayer, getPublishedNameOfPlayer };