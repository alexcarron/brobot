/**
 * @fileoverview Utility functions for doing Discord actions related to Namesmith
 */

const { memberHasRole, setNicknameOfMember, removeRoleFromMember, addRoleToMember, createPermission, removePermissionFromChannel, addPermissionToChannel, changePermissionOnChannel, closeChannel, openChannel, memberHasAnyRole } = require("../../../utilities/discord-action-utils");
const ids = require("../../../bot-config/discord-ids");
const { fetchPublishedNamesChannel, fetchNamesmithGuildMember, fetchNamesToVoteOnChannel, fetchTheWinnerChannel } = require("./discord-entity.utility");
const { getEveryoneRole } = require("../../../utilities/discord-fetch-utils");
const { PermissionFlagsBits } = require("discord.js");

const MAX_NAME_LENGTH = 32;
const NO_NAME = "ˑ";


/**
 * Changes a player's current name in Discord.
 * @param {string} playerID The ID of the player to modify.
 * @param {string} newName The new name to assign to the guild member.
 * @throws {Error} - If the new name is longer than MAX_NAME_LENGTH.
 * @returns {Promise<void>} A promise that resolves once the nickname has been modified.
 */
const changeDiscordNameOfPlayer = async (playerID, newName) => {
	if (newName.length > MAX_NAME_LENGTH) {
		throw new Error(`changeDiscordNameOfPlayer: newName must be less than or equal to ${MAX_NAME_LENGTH}.`);
	}
	const guildMember = await fetchNamesmithGuildMember(playerID);

	const hasNoNameRole = await memberHasRole(guildMember, ids.namesmith.roles.noName);
	if (hasNoNameRole && newName.length > 0) {
		await removeRoleFromMember(guildMember, ids.namesmith.roles.noName);
		await addRoleToMember(guildMember, ids.namesmith.roles.smithedName);
	}
	else if (!hasNoNameRole && newName.length <= 0) {
		newName = NO_NAME;
		await removeRoleFromMember(guildMember, ids.namesmith.roles.smithedName);
		await addRoleToMember(guildMember, ids.namesmith.roles.noName);
	}

	await setNicknameOfMember(guildMember, newName);
}

/**
 * Sends a message to the published names channel.
 * @param {string} message The message to be sent.
 * @returns {Promise<void>} A promise that resolves once the message has been sent.
 */
const sendToPublishedNamesChannel = async (message) => {
	const publishedNamesChannel = await fetchPublishedNamesChannel();
	await publishedNamesChannel.send(message);
}

/**
 * Sends a message to the 'Names to Vote On' channel.
 * @param {string} message The message to be sent.
 * @returns {Promise<void>} A promise that resolves once the message has been sent.
 */
const sendToNamesToVoteOnChannel = async (message) => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await namesToVoteOnChannel.send(message);
}

/**
 * Opens the 'Names to Vote On' channel to allow everyone to view it but not send messages.
 * @returns {Promise<void>} A promise that resolves once the channel has been opened.
 */
const openNamesToVoteOnChannel = async () => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await openChannel(namesToVoteOnChannel);
}

/**
 * Closes the 'Names to Vote On' channel to everyone so they can't view it until it is opened again.
 * @returns {Promise<void>} A promise that resolves once the channel has been closed.
 */
const closeNamesToVoteOnChannel = async () => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await closeChannel(namesToVoteOnChannel);
}

/**
 * Sends a message to the 'The Winner' channel.
 * @param {string} message The message to be sent.
 * @returns {Promise<void>} A promise that resolves once the message has been sent.
 */
const sendMessageToTheWinnerChannel = async (message) => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await theWinnerChannel.send(message);
}

/**
 * Opens the 'The Winner' channel to allow everyone to view it but not send messages.
 * @returns {Promise<void>} A promise that resolves once the channel has been opened.
 */
const openTheWinnerChannel = async () => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await openChannel(theWinnerChannel);
}

/**
 * Closes the 'The Winner' channel to everyone so they can't view it until it is opened again.
 * @returns {Promise<void>} A promise that resolves once the channel has been closed.
 */
const closeTheWinnerChannel = async () => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await closeChannel(theWinnerChannel);
}

/**
 * Checks if a guild member is not a player (i.e. has the Spectator or Staff role).
 * @param {GuildMember} guildMember The guild member to check.
 * @returns {Promise<boolean>} True if the guild member is not a player, false otherwise.
 */
const isNonPlayer = async (guildMember) => {
	const nonPlayerRoles = [
		ids.namesmith.roles.spectator,
		ids.namesmith.roles.staff
	]

	for (const role of nonPlayerRoles) {
		const hasRole = await memberHasRole(guildMember, role);
		if (hasRole) return true;
	}

	return false;
}

module.exports = { changeDiscordNameOfPlayer, sendToPublishedNamesChannel, sendToNamesToVoteOnChannel, openNamesToVoteOnChannel, closeNamesToVoteOnChannel, sendMessageToTheWinnerChannel, openTheWinnerChannel, closeTheWinnerChannel, isNonPlayer };