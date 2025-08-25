import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { PlayerResolvable } from "../types/player.types";
import { RecipeResolvable } from "../types/recipe.types";
import { MissingRequiredCharactersError, NonPlayerCraftedError, RecipeNotUnlockedError } from "../utilities/error.utility";

/**
 * Crafts a character using a given recipe and player.
 * @param {{playerService: PlayerService, recipeService: RecipeService, player: PlayerResolvable, recipe: RecipeResolvable}} args - The arguments for crafting a character.
 * @returns {Promise<void>} A promise that resolves when the character is crafted.
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
	if (!playerService.isPlayer(player)) {
		throw new NonPlayerCraftedError(playerService.resolveID(player));
	}

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

	await recipeService.takeInputCharactersFromPlayer(recipe, player);
	await recipeService.giveOutputCharacterToPlayer(recipe, player);

	const newInventory = playerService.getInventory(player);
	const craftedCharacter = recipeService.getOutputCharacters(recipe);
	const recipeUsed = recipeService.resolveRecipe(recipe);
	const playerCrafting = playerService.resolvePlayer(player);

	return {
		newInventory,
		craftedCharacter,
		recipeUsed,
		playerCrafting,
	};
};