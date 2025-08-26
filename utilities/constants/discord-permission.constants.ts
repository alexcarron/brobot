import { PermissionFlagsBits } from "discord.js";

export type DiscordPermissionName = keyof typeof PermissionFlagsBits;

export const PERMISSION_NAMES = Object.freeze(
	Object.keys(PermissionFlagsBits) as DiscordPermissionName[]
);

export const PermissionNames: Record<DiscordPermissionName, DiscordPermissionName> = {} as Record<DiscordPermissionName, DiscordPermissionName>;

for (const permissionName of PERMISSION_NAMES) {
  PermissionNames[permissionName] = permissionName;
}

Object.freeze(PermissionNames);
