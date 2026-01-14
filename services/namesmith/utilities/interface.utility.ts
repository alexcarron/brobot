import { Interaction } from "discord.js";
import { Player, PlayerID } from '../types/player.types';
import { PlayerService } from "../services/player.service";
import { toNullOnError } from "../../../utilities/error-utils";
import { fetchUserByUsername } from "../../../utilities/discord-fetch-utils";
import { hasProperty } from "../../../utilities/types/type-guards";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Retrieves the player object associated with the user who triggered the given interaction.
 * If no player object is associated with the user, returns null.
 * @param playerService - The player service to use to resolve the player.
 * @param interaction - The interaction to get the player from.
 * @returns The player object associated with the user, or null if no player object is found.
 */
export function getPlayerTriggeringInteraction(
	playerService: PlayerService,
	interaction: Interaction,
): Player | null {
	const userID = interaction.user.id;
	const player = toNullOnError(() =>
		playerService.resolvePlayer(userID)
	);

	return player;
}

/**
 * Resolves a player from a given name, username, or ID.
 * @param playerService - The player service to use to resolve the player.
 * @param playerNameUsernameOrID - The name, username, or ID of the player to resolve.
 * @returns A promise that resolves to the resolved player object, or null if no player is found.
 * @throws {PlayerNotFoundError} If the player is not found.
 */
export async function resolvePlayerFromNameUsernameOrID(
	playerService: PlayerService,
	playerNameUsernameOrID: string
): Promise<Player | null> {
	const playerById = toNullOnError(() =>
		playerService.resolvePlayer(playerNameUsernameOrID)
	);
	if (playerById) return playerById;

	const user = await fetchUserByUsername(playerNameUsernameOrID);
	if (user) {
		const playerByUserId = toNullOnError(() =>
			playerService.resolvePlayer(user.id)
		);
		if (playerByUserId) return playerByUserId;
	}

	const playerByName = playerService.playerRepository.getPlayersByCurrentName(playerNameUsernameOrID)[0];
	if (playerByName) return playerByName;

	return null;
}

/**
 * Resolves a player from a command parameter value and the current player running the command.
 * @param parameters An object containing the following properties:
 * @param parameters.interaction The interaction whose command parameter is being resolved.
 * @param parameters.givenPlayerResolvable The parameter to resolve the player from.
 * @param parameters.playerService The player service to use to resolve the player.
 * @returns A promise that resolves to the resolved player, or a string error message if no player is found.
 */
export const resolveTargetPlayer = async (
	{playerService, interaction, givenPlayerResolvable}: {
		playerService: PlayerService,
		interaction: Interaction,
		givenPlayerResolvable?: string | Player | null,
}): Promise<Player | null> => {
	if (hasProperty(givenPlayerResolvable, 'id')) {
		return toNullOnError(() =>
			playerService.resolvePlayer(givenPlayerResolvable.id)
		);
	}
	else if (typeof givenPlayerResolvable === 'string') {
		return await resolvePlayerFromNameUsernameOrID(playerService, givenPlayerResolvable);
	}
	else {
		return getPlayerTriggeringInteraction(playerService, interaction);
	}
}

export async function getInvalidPlayerMessageOrPlayer(
	interaction: Interaction,
	playerID: PlayerID,
	entityName: string,
): Promise<string | Player> {
		const { playerService } = getNamesmithServices();
		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerID,
		});

		if (maybePlayer === null) {
			if (interaction.user.id === playerID || playerID === null) {
				return `You are not a player, so you do not have ${entityName}.`;
			}
			else {
				return `The given user is not a player, so they do not have ${entityName}.`;
			}
		}

		return maybePlayer;
}