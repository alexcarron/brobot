import { fetchUser } from "../../../utilities/discord-fetch-utils";
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
 * Fetches all players from the database and returns an array of autocomplete choices.
 * Each autocomplete choice contains the display name of the player and their ID.
 * @returns A promise that resolves to an array of autocomplete choices.
 */
export function fetchPlayerAutocompleteChoices() {
	const { playerService } = getNamesmithServices();
	const allPlayers = playerService.playerRepository.getPlayers();
	return Promise.all(
		allPlayers.map(async player => {
			const id = player.id;
			const user = await fetchUser(id);
			return {
				name: `${user.displayName}`,
				value: id
			}
		})
	);
}