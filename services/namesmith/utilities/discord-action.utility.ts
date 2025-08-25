import {
	memberHasRole,
	setNicknameOfMember,
	removeRoleFromMember,
	addRoleToMember,
	closeChannel,
	openChannel,
	removeAllRolesFromMember
} from "../../../utilities/discord-action-utils";
import { ids } from "../../../bot-config/discord-ids";
import {
	fetchPublishedNamesChannel,
	fetchNamesmithGuildMember,
	fetchNamesToVoteOnChannel,
	fetchTheWinnerChannel,
	fetchNamesmithChannel
} from "./discord-fetch.utility";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { GuildMember, TextChannel } from "discord.js";
import { MessageContentResolvable } from "../../../utilities/types/discord-types";

const MAX_NAME_LENGTH = 32;
const NO_NAME = "˙";


/**
 * Changes a player's current name in Discord.
 * @param playerID The ID of the player to modify.
 * @param newName The new name to assign to the guild member.
 * @throws {Error} - If the new name is longer than MAX_NAME_LENGTH.
 * @returns A promise that resolves once the nickname has been modified.
 */
export const changeDiscordNameOfPlayer = async (playerID: string, newName: string): Promise<void> => {
	if (newName.length > MAX_NAME_LENGTH) {
		throw new InvalidArgumentError(`changeDiscordNameOfPlayer: newName must be less than or equal to ${MAX_NAME_LENGTH}.`);
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

export const sendToChannel = async (
	channelId: string,
	message: Parameters<TextChannel["send"]>[0]
): Promise<void> => {
	const channel = await fetchNamesmithChannel(channelId);
	await channel.send(message);
}

/**
 * Sends a message to the published names channel.
 * @param message The message to be sent.
 * @returns A promise that resolves once the message has been sent.
 */
export const sendToPublishedNamesChannel = async (message: string): Promise<void> => {
	const publishedNamesChannel = await fetchPublishedNamesChannel();
	await publishedNamesChannel.send(message);
}

/**
 * Sends a message to the 'Names to Vote On' channel.
 * @param message The message to be sent.
 * @returns A promise that resolves once the message has been sent.
 */
export const sendToNamesToVoteOnChannel = async (message: MessageContentResolvable): Promise<void> => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await namesToVoteOnChannel.send(message);
}

/**
 * Opens the 'Names to Vote On' channel to allow everyone to view it but not send messages.
 * @returns A promise that resolves once the channel has been opened.
 */
export const openNamesToVoteOnChannel = async (): Promise<void> => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await openChannel(namesToVoteOnChannel);
}

/**
 * Closes the 'Names to Vote On' channel to everyone so they can't view it until it is opened again.
 * @returns A promise that resolves once the channel has been closed.
 */
export const closeNamesToVoteOnChannel = async () => {
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await closeChannel(namesToVoteOnChannel);
}

/**
 * Sends a message to the 'The Winner' channel.
 * @param message The message to be sent.
 * @returns A promise that resolves once the message has been sent.
 */
export const sendMessageToTheWinnerChannel = async (message: string) => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await theWinnerChannel.send(message);
}

/**
 * Opens the 'The Winner' channel to allow everyone to view it but not send messages.
 * @returns A promise that resolves once the channel has been opened.
 */
export const openTheWinnerChannel = async () => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await openChannel(theWinnerChannel);
}

/**
 * Closes the 'The Winner' channel to everyone so they can't view it until it is opened again.
 * @returns A promise that resolves once the channel has been closed.
 */
export const closeTheWinnerChannel = async () => {
	const theWinnerChannel = await fetchTheWinnerChannel();
	await closeChannel(theWinnerChannel);
}

/**
 * Checks if a guild member is not a player (i.e. has the Spectator or Staff role).
 * @param guildMember The guild member to check.
 * @returns True if the guild member is not a player, false otherwise.
 */
export const isNonPlayer = async (guildMember: GuildMember): Promise<boolean> => {
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

/**
 * Resets a guild member to a new player by removing all roles, giving them the No Name role, and setting their nickname to the default No Name.
 * @param guildMember The guild member to reset.
 * @returns A promise that resolves once the guild member has been reset.
 */
export const resetMemberToNewPlayer = async (guildMember: GuildMember) => {
	await removeAllRolesFromMember(guildMember);
	await addRoleToMember(guildMember, ids.namesmith.roles.noName);
	await setNicknameOfMember(guildMember, NO_NAME);
}