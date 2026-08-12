import { Guild, GuildMember, Role, RoleResolvable } from "discord.js";
import { discordCollectionToArray } from "../data-structure-utils";
import { Role as RapidDiscordMafiaRole } from "../../services/rapid-discord-mafia/role";

/**
 * Fetches a role from a given guild using a given role ID.
 * @param guild The guild that the role belongs to.
 * @param roleID The ID of the role to fetch.
 * @returns A Promise that resolves with the Role object if successful, or rejects with an Error if not.
 */
export async function fetchRole(guild: Guild, roleID: string): Promise<Role> {
	const role = await guild.roles.fetch(roleID);

	if (!role)
		throw new Error(`fetchRole: role is null, got ${role}`);

	return role;
}

/**
 * Fetches all roles in a given guild.
 * @param guild The guild whose roles we want to fetch.
 * @returns A Promise that resolves with a array of all roles in the guild.
 */
export async function fetchRolesInGuild(guild: Guild): Promise<Role[]> {
	const roles = await guild.roles.fetch();
	return discordCollectionToArray(roles);
}

/**
 * Fetches a role from a given guild using a given role name.
 * @param guild The guild that the role belongs to.
 * @param roleName The name of the role to fetch.
 * @returns A Promise that resolves with the Role object if successful, or rejects with an Error if not.
 */
export async function fetchRoleByName(guild: Guild, roleName: string): Promise<Role> {
	const rolesInGuild = await fetchRolesInGuild(guild);
	const role = rolesInGuild.find((role) => role.name === roleName);

	if (!role)
		throw new Error(`fetchRoleByName: Could not find role with name ${roleName}, got ${role}`);

	return role;
}

/**
 * Adds a role to a guild member.
 * @param guildMember The guild member we want to add the role to.
 * @param role The role we want to add to the guild member.
 * @returns A promise that resolves when the role is added.
 */
export async function addRoleToMember(guildMember: GuildMember, role: RoleResolvable): Promise<void> {
	await guildMember.roles.add(role);
}

/**
 * Removes a role from a guild member.
 * @param guildMember The guild member we want to remove the role from.
 * @param role The role or role ID we want to remove from the guild member.
 * @returns A promise that resolves when the role is removed.
 */
export async function removeRoleFromMember(guildMember: GuildMember, role: RoleResolvable): Promise<void> {
	// If member does not have role, do nothing
	if (!guildMember.roles.cache.some((memberRole) => memberRole.id === role)) return;

	await guildMember.roles.remove(role);
}

/**
 * Removes all roles from a guild member.
 * @param guildMember The guild member we want to remove all roles from.
 * @returns A promise that resolves when all roles have been removed.
 */
export async function removeAllRolesFromMember(guildMember: GuildMember): Promise<void> {
	for (const roleId of guildMember.roles.cache.keys()) {
		if (roleId === guildMember.guild.id) continue;
		await removeRoleFromMember(guildMember, roleId);
	}
}

/**
 * Checks if a guild member has a given role.
 * @param guildMember - The guild member to check.
 * @param roleID - The role to check for.
 * @param useCache - Whether to use the guild member's cache.
 * @returns True if the guild member has the given role, false otherwise.
 */
export async function memberHasRole(guildMember: GuildMember, roleID: RapidDiscordMafiaRole | string, useCache = false): Promise<boolean> {
	if (!(guildMember instanceof GuildMember))
		throw new Error("Guild member object must be an instance of GuildMember");

	if (roleID instanceof RapidDiscordMafiaRole)
		// @ts-ignore
		roleID = roleID.id;

	if (typeof roleID !== "string")
		throw new Error("Role ID must be a string");

	if (!useCache)
		await guildMember.fetch();

	return guildMember.roles.cache.some(role => role.id === roleID);
}
