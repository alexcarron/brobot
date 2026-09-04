import { getCharacterDifferences } from "../../../utilities/data-structure-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		newName: string,
		unusedCharacters: string[],
	}>(),

	notAPlayer: provides<{}>(),
	hasExtraCharacters: provides<{
		extraCharacters: string
	}>(),
})

/**
 * Rearranges a player's current name into a new name.
 * @param parameters - The parameters for the function
 * @param parameters.player - The player rearranging their name
 * @param parameters.newName - The new arrangement of characters to set as the player's current name
 * @returns The new name and any characters not used in it in the player's inventory.
 * - hasExtraCharacters if the new name contains characters the player does not have in their inventory.
 */
export const rearrangeName = (
	{player: playerResolvable, newName}: {
		player: PlayerResolvable;
		newName: string;
	}
) => {
	const {playerService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer({});
	}

	const inventory = playerService.getInventory(playerResolvable);
	const { extraCharacters } = getCharacterDifferences(inventory, newName);

	if (extraCharacters.length > 0) {
		return result.failure.hasExtraCharacters({
			extraCharacters: extraCharacters.join(''),
		});
	}

	const nameBefore = playerService.getCurrentName(playerResolvable);
	playerService.changeCurrentName(playerResolvable, newName);

	activityLogService.logRearrangeName({
		playerRearrangingName: playerResolvable,
		nameBefore,
	});

	const unusedCharacters = playerService.getUnusedInventoryCharacters(playerResolvable, newName);

	return result.success({
		newName,
		unusedCharacters,
	});
};
