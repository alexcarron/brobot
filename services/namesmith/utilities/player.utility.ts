import { getCachedUser } from "../../../utilities/discord/guild-member-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";

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