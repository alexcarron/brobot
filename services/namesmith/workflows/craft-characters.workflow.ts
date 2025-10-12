import { getCharacterDifferences } from "../../../utilities/data-structure-utils";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { PlayerResolvable } from '../types/player.types';
import { Recipe, RecipeResolvable } from "../types/recipe.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		newInventory: string,
		craftedCharacters: string,
		recipeUsed: Recipe,
	}>(),

	nonPlayerCrafted: provides<{}>(),
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
	{playerService, recipeService, player, recipe}: {
		playerService: PlayerService;
		recipeService: RecipeService;
		player: PlayerResolvable;
		recipe: RecipeResolvable;
	}
) => {
	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayerCrafted({});
	}

	const hasRequiredCharacters = recipeService.playerHasInputCharacters(recipe, player);
	if (!hasRequiredCharacters) {
		player = playerService.resolvePlayer(player);
		recipe = recipeService.resolveRecipe(recipe);
		const { missingCharacters } =
			getCharacterDifferences(recipe.inputCharacters, player.inventory);

		return result.failure.missingRequiredCharacters({
			missingCharacters: missingCharacters.join(''),
		});
	}

	const isUnlocked = recipeService.isUnlockedForPlayer(recipe, player);
	if (!isUnlocked) {
		return result.failure.recipeNotUnlocked({});
	}

	recipeService.giveOutputAndTakeInputCharactersFromPlayer(recipe, player);

	const newInventory = playerService.getInventory(player);
	const craftedCharacters = recipeService.getOutputCharacters(recipe);
	const recipeUsed = recipeService.resolveRecipe(recipe);

	return result.success({
		newInventory,
		craftedCharacters,
		recipeUsed,
	});
};