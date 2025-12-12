import { getCharacterDifferences } from "../../../utilities/data-structure-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from '../types/player.types';
import { Recipe, RecipeResolvable } from "../types/recipe.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		newInventory: string,
		craftedCharacters: string,
		recipeUsed: Recipe,
	}>(),

	notAPlayer: provides<{}>(),
	missingRequiredCharacters: provides<{
		missingCharacters: string
	}>(),
	recipeNotUnlocked: provides<{}>(),
})


/**
 * Crafts a character using a given recipe and player.
 * @param parameters - The parameters for the function
 * @param parameters.playerService - The player service
 * @param parameters.recipeService - The recipe service
 * @param parameters.player - The player who is crafting the character
 * @param parameters.recipe - The recipe used to craft the character
 * @returns An object containing the new inventory, the crafted character, the recipe used, and the player who is crafting the character.
 * - MissingRequiredCharactersError if the player does not have all the required characters to craft the character.
 * - RecipeNotUnlockedError if the recipe is not unlocked for the player.
 */
export const craftCharacters = (
	{player: playerResolvable, recipe: recipeResolvable}: {
		player: PlayerResolvable;
		recipe: RecipeResolvable;
	}
) => {
	const {playerService, recipeService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer({});
	}

	const hasRequiredCharacters = recipeService.playerHasInputCharacters(recipeResolvable, playerResolvable);
	if (!hasRequiredCharacters) {
		const player = playerService.resolvePlayer(playerResolvable);
		const recipe = recipeService.resolveRecipe(recipeResolvable);
		const { missingCharacters } =
			getCharacterDifferences(recipe.inputCharacters, player.inventory);

		return result.failure.missingRequiredCharacters({
			missingCharacters: missingCharacters.join(''),
		});
	}

	const isUnlocked = recipeService.isUnlockedForPlayer(recipeResolvable, playerResolvable);
	if (!isUnlocked) {
		return result.failure.recipeNotUnlocked({});
	}

	const nameBefore = playerService.getCurrentName(playerResolvable);
	recipeService.giveOutputAndTakeInputCharactersFromPlayer(recipeResolvable, playerResolvable);

	const newInventory = playerService.getInventory(playerResolvable);
	const craftedCharacters = recipeService.getOutputCharacters(recipeResolvable);
	const recipeUsed = recipeService.resolveRecipe(recipeResolvable);

	activityLogService.logCraftCharacters({
		playerCrafting: playerResolvable,
		recipeUsed,
		nameBefore,
	});

	return result.success({
		newInventory,
		craftedCharacters,
		recipeUsed,
	});
};