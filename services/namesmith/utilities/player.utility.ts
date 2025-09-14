import { toDateFromTimeString } from "../../../utilities/date-time-utils";
import { DBPlayer, Player } from "../types/player.types";

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
 * Converts a DBPlayer object to a Player object.
 * @param dbPlayer - The database player object to convert.
 * @returns The converted player object.
 */
export function toPlayerObject(dbPlayer: DBPlayer): Player {
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