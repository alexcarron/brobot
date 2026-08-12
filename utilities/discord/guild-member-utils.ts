import { ChatInputCommandInteraction, Guild, GuildMember, User } from "discord.js";
import { discordCollectionToArray } from "../data-structure-utils";
import { assertClientSetup } from "./client-utils";

/**
 * Fetches a user from Discord using the global client.
 * @param userID The ID of the user to fetch.
 * @returns A Promise that resolves with the User object if successful, or rejects with an Error if not.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchUser(userID: string): Promise<User> {
	assertClientSetup();
	return await global.client.users.fetch(userID);
}

/**
 * Fetches a guild member from a given guild using a given guild member ID.
 * @param guild The guild that the guild member belongs to.
 * @param guildMemberID The ID of the guild member to fetch.
 * @returns A Promise that resolves with the GuildMember object if successful, or rejects with an Error if not.
 */
export async function fetchGuildMember(guild: Guild, guildMemberID: string): Promise<GuildMember> {
	return await guild.members.fetch(guildMemberID);
}

/**
 * Fetches all members from a given guild.
 * @param guild The guild whose members you want to fetch.
 * @returns A Promise that resolves with an array of all guild members.
 * @throws {Error} If the client is not setup or not ready.
 */
export async function fetchAllGuildMembers(guild: Guild): Promise<GuildMember[]> {
	const members = await guild.members.fetch();
	return discordCollectionToArray(members);
}

/**
 * Retrieves the guild member object from a slash command interaction.
 * @param interaction - The interaction object from which to get the guild member.
 * @returns The guild member who initiated the interaction.
 * @throws {Error} If the member object is not an instance of GuildMember.
 */
export function getMemberOfInteraction(interaction: ChatInputCommandInteraction): GuildMember {
	if (!(interaction.member instanceof GuildMember))
		throw new Error("Guild member object must be an instance of GuildMember");

	return interaction.member;
}

/**
 * Gets the nickname of the user who invoked a slash command.
 * @param interaction The interaction object of the slash command.
 * @returns The nickname of the user who invoked the slash command.
 */
export function getNicknameOfInteractionUser(interaction: ChatInputCommandInteraction): string | null {
	const member = getMemberOfInteraction(interaction);
	return member.nickname;
}

/**
 * Sets the nickname of a guild member.
 * @param guildMember - The guild member whose nickname is to be set.
 * @param newNickname - The new nickname for the guild member.
 * @returns A promise that resolves when the nickname has been set.
 */
export async function setNicknameOfMember(guildMember: GuildMember, newNickname: string): Promise<void> {
	await guildMember.setNickname(newNickname);
}

/**
 * Attempts to fetch a user by username.
 * - Checks cache
 * - Checks all guild members (if available)
 * - Optionally fetches uncached members from Discord API
 * @param username The username or tag (e.g. "SomeUser" or "SomeUser#1234")
 * @returns The User object or null if not found
 */
export async function fetchUserByUsername(username: string): Promise<User | null> {
	assertClientSetup();
	const client = global.client;
	const user = client.users.cache.find(
		user => user.username === username || user.tag === username
	);
	if (user) return user;

	for (const guild of client.guilds.cache.values()) {
		const member = guild.members.cache.find(
			m => m.user.username === username || m.user.tag === username
		);
		if (member) return member.user;
	}

	for (const guild of client.guilds.cache.values()) {
		try {
			const fetched = await guild.members.fetch({ query: username, limit: 1 });
			if (fetched.size > 0) {
				const member = fetched.first();
				if (member) return member.user;
			}
		}
		catch {
			// Do nothing
		}
	}

	return null;
}
