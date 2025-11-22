import { getRandomNameUUID } from "../../../../utilities/random-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { RecipeRepository } from "../../repositories/recipe.repository";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerResolvable } from "../../types/player.types";
import { Recipe, RecipeResolvable } from "../../types/recipe.types";
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { craftCharacters } from "../../workflows/craft-characters.workflow";

/**
 * Adds a recipe to the database with the given properties.
 * @param db - The in-memory database.
 * @param recipeDefinition - The recipe data to add.
 * @param recipeDefinition.id - The ID of the recipe.
 * @param recipeDefinition.inputCharacters - The input characters of the recipe.
 * @param recipeDefinition.outputCharacters - The output characters of the recipe.
 * @returns The added recipe with an ID.
 */
export const addMockRecipe = (
	db: DatabaseQuerier,
	recipeDefinition: Partial<Recipe> = {}
): Recipe => {
	const recipeRepository = RecipeRepository.fromDB(db);

	const {
		id = undefined,
		inputCharacters = getRandomNameUUID(),
		outputCharacters = getRandomNameUUID(),
	} = recipeDefinition;

	return recipeRepository.addRecipe({ id, inputCharacters, outputCharacters });
};

/**
 * Forces a player to craft a recipe by giving them the input characters.
 * Used for testing purposes.
 * @param playerResolvable - The player resolvable to force to craft the recipe.
 * @param recipeResolvable - The recipe resolvable to force the player to craft.
 * @returns The result of the craftCharacters workflow.
 */
export function forcePlayerToCraft(
	playerResolvable: PlayerResolvable,
	recipeResolvable: RecipeResolvable
) {
	const { playerService, recipeService } = getNamesmithServices();
	const recipe = recipeService.resolveRecipe(recipeResolvable);
	playerService.giveCharacters(playerResolvable, recipe.inputCharacters);

	return returnIfNotFailure(
		craftCharacters({
			player: playerResolvable,
			recipe: recipeResolvable
		})
	)
}