import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { PlayerResolvable } from "../types/player.types";
import { RecipeResolvable } from "../types/recipe.types";
import { MissingRequiredCharactersError, RecipeNotUnlockedError } from "../utilities/error.utility";

/**
 * Crafts a character using a given recipe and player.
 * @param {{playerService: PlayerService, recipeService: RecipeService, player: PlayerResolvable, recipe: RecipeResolvable}} args
 * @throws {MissingRequiredCharactersError} If the player does not have all the required characters to craft the character.
 * @throws {RecipeNotUnlockedError} If the recipe is not unlocked for the player.
 */
export const craftCharacter = async (
	{playerService, recipeService, player, recipe}: {
		playerService: PlayerService;
		recipeService: RecipeService;
		player: PlayerResolvable;
		recipe: RecipeResolvable;
	}
) => {
	const hasRequiredCharacters = recipeService.playerHasInputCharacters(recipe, player);
	if (!hasRequiredCharacters) {
		throw new MissingRequiredCharactersError(
			playerService.resolvePlayer(player),
			recipeService.resolveRecipe(recipe)
		);
	}

	const isUnlocked = recipeService.isUnlockedForPlayer(recipe, player);
	if (!isUnlocked) {
		throw new RecipeNotUnlockedError(
			playerService.resolvePlayer(player),
			recipeService.resolveRecipe(recipe)
		);
	}

	recipeService.takeInputCharactersFromPlayer(recipe, player);
	recipeService.giveOutputCharacterToPlayer(recipe, player);

	return {
		newInventory: playerService.getInventory(player),
		craftedCharacter: recipeService.getOutputCharacters(recipe),
	};
};