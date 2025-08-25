import { RecipeRepository } from "../repositories/recipe.repository";
import { Recipe, RecipeID, RecipeResolvable } from "../types/recipe.types";
import { RecipeNotFoundError } from "../utilities/error.utility";
import { isRecipe } from "../utilities/recipe.utility";
import { PlayerResolvable } from '../types/player.types';
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with recipes.
 */
export class RecipeService {
	constructor (
		public recipeRepository: RecipeRepository,
		public playerService: PlayerService,
	) {}

	/**
	 * Resolves a recipe resolvable to a recipe object.
	 * @param recipeResolvable - The recipe resolvable to resolve.
	 * @returns The resolved recipe object.
	 * @throws {RecipeNotFoundError} If the recipe with the given ID is not found.
	 */
	resolveRecipe(recipeResolvable: RecipeResolvable): Recipe {
		if (isRecipe(recipeResolvable))
			return recipeResolvable;

		const recipe = this.recipeRepository.getRecipeByID(recipeResolvable);

		if (recipe === null)
			throw new RecipeNotFoundError(recipeResolvable);

		return recipe;
	}

	/**
	 * Retrieves all recipes in the game.
	 * @returns An array of all recipes in the game.
	 */
	getRecipes(): Recipe[] {
		return this.recipeRepository.getRecipes();
	}


	/**
	 * Returns a string representation of a recipe's input characters followed by
	 * an arrow (➔) and the recipe's output characters.
	 * @param recipeResolvable - The recipe resolvable for which to get the display name.
	 * @returns The display name of the recipe.
	 */
	getDisplayName(recipeResolvable: RecipeResolvable): string {
		const recipe = this.resolveRecipe(recipeResolvable);
		const ARROW = '➔';
		return `${recipe.inputCharacters} ${ARROW} ${recipe.outputCharacters}`;
	}

	/**
	 * Retrieves the ID of a recipe.
	 * @param recipeResolvable - The recipe resolvable for which the ID is being retrieved.
	 * @returns The ID of the recipe.
	 */
	getID(recipeResolvable: RecipeResolvable): RecipeID {
		const recipe = this.resolveRecipe(recipeResolvable);
		return recipe.id;
	}

	/**
	 * Retrieves the output characters for a given recipe.
	 * @param recipeResolvable - The recipe resolvable for which the output characters are being retrieved.
	 * @returns The output characters string for the recipe.
	 */
	getOutputCharacters(recipeResolvable: RecipeResolvable): string {
		const recipe = this.resolveRecipe(recipeResolvable);
		return recipe.outputCharacters;
	}

	/**
	 * Determines if a recipe is unlocked for a given player.
	 * @param recipeResolvable - The recipe resolvable to check for unlocking.
	 * @param playerResolvable - The player resolvable for whom the recipe unlock status is being checked.
	 * @returns A boolean indicating if the recipe is unlocked for the player.
	 */
	isUnlockedForPlayer(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		recipeResolvable: RecipeResolvable,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		playerResolvable: PlayerResolvable
	): boolean {
		// TODO: Add logic for locking recipes or delete this method
		return true;
	}

	/**
	 * Checks if a player has all the characters needed to use a recipe.
	 * @param recipeResolvable - The recipe to check if the player has the needed characters for.
	 * @param playerResolvable - The player to check if they have the needed characters for the recipe.
	 * @returns Whether the player has the needed characters for the recipe.
	 */
	playerHasInputCharacters(
		recipeResolvable: RecipeResolvable,
		playerResolvable: PlayerResolvable
	): boolean {
		const recipe = this.resolveRecipe(recipeResolvable);
		const inputCharacters = recipe.inputCharacters;

		const hasNeededCharacters = this.playerService.hasCharacters(playerResolvable, inputCharacters);

		return hasNeededCharacters;
	}

	/**
	 * Takes the input characters from a player's inventory needed to use a recipe.
	 * @param recipeResolvable - The recipe to take the input characters for.
	 * @param playerResolvable - The player from whom the input characters are being taken.
	 */
	async takeInputCharactersFromPlayer(
		recipeResolvable: RecipeResolvable,
		playerResolvable: PlayerResolvable
	): Promise<void> {
		const recipe = this.resolveRecipe(recipeResolvable);
		const inputCharacters = recipe.inputCharacters;
		await this.playerService.removeCharacters(playerResolvable, inputCharacters);
	}

	/**
	 * Gives the output characters of a recipe to a player after they have used the recipe.
	 * @param recipeResolvable - The recipe whose output characters are being given to the player.
	 * @param playerResolvable - The player who is receiving the output characters.
	 */
	async giveOutputCharacterToPlayer(
		recipeResolvable: RecipeResolvable,
		playerResolvable: PlayerResolvable
	): Promise<void> {
		const recipe = this.resolveRecipe(recipeResolvable);
		const outputCharacters = recipe.outputCharacters;
		await this.playerService.giveCharacters(playerResolvable, outputCharacters);
	}
}