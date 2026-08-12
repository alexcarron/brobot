import {
	Guild,
	OverwriteData,
	OverwriteType,
	PermissionFlagsBits,
	PermissionOverwriteOptions,
	PermissionResolvable,
	Role,
	TextChannel,
} from "discord.js";

/**
 * Gets the everyone role of a given guild.
 * @param guild The guild whose everyone role you want to fetch.
 * @returns The everyone role of the guild.
 */
export const getEveryoneRole = (guild: Guild): Role => guild.roles.everyone;

/**
 * Creates a permission overwrite object for a Discord channel.
 * @param options - Options for creating the permission overwrite.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are being set.
 * @param [options.allowedPermissions] - An array of permissions that are allowed for the user or role.
 * @param [options.deniedPermissions] - An array of permissions that are denied for the user or role.
 * @returns The permission overwrite object.
 */
export function createPermission({ userOrRoleID, allowedPermissions, deniedPermissions }: { userOrRoleID: string; allowedPermissions?: PermissionResolvable[]; deniedPermissions?: PermissionResolvable[] }): OverwriteData {
	if (!userOrRoleID)
		throw new Error("User or role ID is required");

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	const overwrite: OverwriteData = {
		id: userOrRoleID,
	};

	if (allowedPermissions)
		overwrite.allow = allowedPermissions;

	if (deniedPermissions)
		overwrite.deny = deniedPermissions;

	return overwrite;
}

/**
 * Creates a permission overwrite that denies everyone the ability to view a channel.
 * @param guild - The guild in which the permission overwrite is to be created.
 * @returns The permission overwrite object.
 */
export function createEveryoneDenyViewPermission(guild: Guild): OverwriteData {
	return createPermission({
		// guild.roles.everyone is a Role object — use its id
		userOrRoleID: (guild.roles && 'everyone' in guild.roles) ? (guild.roles.everyone as any).id : guild.id,
		deniedPermissions: [PermissionFlagsBits.ViewChannel],
	});
}

/**
 * Adds permission overwrites to a Discord channel for a specific user or role.
 * @param options - Options for setting permissions.
 * @param options.channel - The channel to which the permissions are applied.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are set.
 * @param [options.allowedPermissions] - An array of permissions to allow.
 * @param [options.deniedPermissions] - An array of permissions to deny.
 * @throws {Error} If neither allowedPermissions nor deniedPermissions are provided, or if they are not arrays.
 * @returns A promise that resolves when the permissions have been set.
 */
export async function addPermissionToChannel(
	{ channel, userOrRoleID, allowedPermissions, deniedPermissions }: {
		channel: TextChannel;
		userOrRoleID: string;
		allowedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		deniedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[]
	}
): Promise<void> {
	const permissions: PermissionOverwriteOptions = {}

	if (!allowedPermissions && !deniedPermissions)
		throw new Error("allowedPermissions or deniedPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	if (allowedPermissions) {
		for (const permission of allowedPermissions) {
			// @ts-ignore
			permissions[permission] = true;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
			// @ts-ignore
			permissions[permission] = false;
		}
	}

	await channel.permissionOverwrites.create(
		userOrRoleID,
		permissions,
	);
}

/**
 * Removes all permission overwrites from a Discord channel for a specific user or role.
 * @param options - Options for removing permissions.
 * @param options.channel - The channel from which the permissions are removed.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are removed.
 * @returns A promise that resolves when the permissions have been removed.
 */
export async function removePermissionFromChannel({ channel, userOrRoleID }: { channel: TextChannel; userOrRoleID: string }): Promise<void> {
	await channel.permissionOverwrites.delete(userOrRoleID);
}

/**
 * Updates the permission overwrites for a Discord channel for a specific user or role.
 * @param options - Options for updating the permissions.
 * @param options.channel - The channel for which the permissions are being updated.
 * @param options.userOrRoleID - The ID of the user or role for which the permissions are being updated.
 * @param [options.allowedPermissions] - An array of permissions that should be allowed for the user or role.
 * @param [options.unsetPermissions] - An array of permissions that should be unset for the user or role.
 * @param [options.deniedPermissions] - An array of permissions that should be denied for the user or role.
 * @throws Will throw an error if none of allowedPermissions, deniedPermissions, or unsetPermissions are provided, or if any of them are not arrays.
 */
export async function changePermissionOnChannel(
	{ channel, userOrRoleID, allowedPermissions, unsetPermissions, deniedPermissions }: {
		channel: TextChannel;
		userOrRoleID: string;
		allowedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		unsetPermissions?: (keyof typeof PermissionFlagsBits)[] | string[];
		deniedPermissions?: (keyof typeof PermissionFlagsBits)[] | string[]
	}
): Promise<void> {
	const permissions: Record<string, boolean | null> = {}

	if (!allowedPermissions && !deniedPermissions && !unsetPermissions)
		throw new Error("allowedPermissions, deniedPermissions, or unsetPermissions are required");

	if (allowedPermissions && !Array.isArray(allowedPermissions))
		throw new Error("Allowed permissions must be an array");

	if (deniedPermissions && !Array.isArray(deniedPermissions))
		throw new Error("Denied permissions must be an array");

	if (unsetPermissions && !Array.isArray(unsetPermissions))
		throw new Error("Unset permissions must be an array");

	if (allowedPermissions) {
		for (const permission of allowedPermissions) {
			permissions[permission] = true;
		}
	}

	if (unsetPermissions) {
		for (const permission of unsetPermissions) {
			permissions[permission] = null;
		}
	}

	if (deniedPermissions) {
		for (const permission of deniedPermissions) {
			permissions[permission] = false;
		}
	}

	await channel.permissionOverwrites.edit(
		userOrRoleID,
		permissions,
	);
}

/**
 * Opens a Discord channel to allow everyone to view it but not send messages.
 * @param channel - The channel to be opened for viewing.
 * @param options - Options for opening the channel.
 * @param options.isReadOnly - Whether to deny @everyone the ability to send messages in the channel. Defaults to false.
 */
export async function openChannel(channel: TextChannel, options: { isReadOnly?: boolean } = {}): Promise<void> {
	const everyoneRole = getEveryoneRole(channel.guild);
	const isReadOnly = options?.isReadOnly ?? false;

	await changePermissionOnChannel({
		channel: channel,
		userOrRoleID: everyoneRole.id,
		// @ts-ignore
		unsetPermissions: [PermissionFlagsBits.ViewChannel],
		// @ts-ignore
		deniedPermissions: isReadOnly ? [PermissionFlagsBits.SendMessages] : undefined,
	});
}

/**
 * Removes all permission overwrites from a Discord channel.
 * @param channel - The channel from which all permission overwrites are to be removed.
 * @returns A promise that resolves when all permission overwrites have been removed.
 */
export async function removeAllPermissionsFromChannel(channel: TextChannel): Promise<void> {
	await channel.permissionOverwrites.set([]);
}

/**
 * Closes a Discord channel to deny everyone the ability to view it.
 * @param channel - The channel to be closed from viewing.
 */
export async function closeChannel(channel: TextChannel): Promise<void> {
	const everyoneRole = getEveryoneRole(channel.guild);

	const existingOverwrites = channel.permissionOverwrites.cache.map(overwrite => ({
		id: overwrite.id,
		type: overwrite.type,
		allow: overwrite.allow.bitfield,
		deny: overwrite.deny.bitfield,
	}));

	const hasEveryone = existingOverwrites.some(overwrite => overwrite.id === everyoneRole.id);

	const newOverwrites = hasEveryone
		? existingOverwrites.map(overwrite =>
			overwrite.id === everyoneRole.id
				? { ...overwrite, deny: BigInt(overwrite.deny) | PermissionFlagsBits.ViewChannel }
				: overwrite
		)
		: [
			...existingOverwrites,
			{
				id: everyoneRole,
				type: OverwriteType.Role,
				allow: BigInt(0),
				deny: PermissionFlagsBits.ViewChannel,
			},
		];

	await channel.edit({
		// @ts-ignore
		permissionOverwrites: newOverwrites,
	});
}
