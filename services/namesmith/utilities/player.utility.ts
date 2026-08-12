import { getCachedUser } from "../../../utilities/discord/guild-member-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player } from "../types/player.types";

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
	'publishedNames' in value &&
	Array.isArray(value.publishedNames) &&
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
 * Gets all players from the database and returns an array of autocomplete choices, reading each player's Discord display name from cache instead of fetching.
 * @returns An array of autocomplete choices.
 */
export function getPlayerAutocompleteChoicesFromCache() {
	const { playerService } = getNamesmithServices();
	const allPlayers = playerService.playerRepository.getPlayers();
	return allPlayers.map(player => {
		const cachedUser = getCachedUser(player.id);
		return {
			name: cachedUser?.displayName ?? player.currentName,
			value: player.id
		}
	});
}