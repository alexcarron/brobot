import { toDateFromTimeString } from "../../../utilities/date-time-utils";
import { Perk } from "../types/perk.types";
import { DBPlayer, MinimalPlayer, Player } from "../types/player.types";

/**
 * Checks if a given value is an object with the properties of a player.
 * @param value - The value to check.
 * @returns If the value is an object with the properties of a player.
 */
export const isPlayer = (value: unknown): value is Player => (
	value !== null &&
	typeof value === 'object' &&
	'id' in value &&
	typeof value.id === 'string' &&
	'currentName' in value &&
	typeof value.currentName === 'string' &&
	'publishedName' in value &&
	(
		value.publishedName === null ||
		typeof value.publishedName === 'string'
	) &&
	'tokens' in value &&
	typeof value.tokens === 'number' &&
	'role' in value &&
	(
		value.role === null ||
		typeof value.role === 'string'
	) &&
	'inventory' in value &&
	typeof value.inventory === 'string'
);

/**
 * Converts a DBPlayer object to a MinimalPlayer object.
 * @param dbPlayer - The DBPlayer object to convert.
 * @returns A MinimalPlayer object with the converted properties.
 */
export function toMinimalPlayerObject(dbPlayer: DBPlayer): MinimalPlayer {
	const dbLastClaimedRefillTime = dbPlayer.lastClaimedRefillTime
	let lastClaimedRefillTime = null;

	if (dbLastClaimedRefillTime !== null) {
		lastClaimedRefillTime = toDateFromTimeString(dbLastClaimedRefillTime);
	}

	return {
		...dbPlayer,
		lastClaimedRefillTime
	};
}

/**
 * Converts a DBPlayer object to a Player object.
 * @param dbPlayer - The database player object to convert.
 * @param perks - The perks associated with the player.
 * @returns The converted player object.
 */
export function toPlayerObject(dbPlayer: DBPlayer, perks: Perk[]): Player {
	const minimalPlayer = toMinimalPlayerObject(dbPlayer);

	return {
		...minimalPlayer,
		role: null,
		perks
	};
}