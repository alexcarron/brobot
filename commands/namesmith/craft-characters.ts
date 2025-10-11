import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { RecipeService } from "../../services/namesmith/services/recipe.service";
import { PlayerID } from "../../services/namesmith/types/player.types";
import { Recipe, RecipeID } from "../../services/namesmith/types/recipe.types";
import { craftCharacters } from "../../services/namesmith/workflows/craft-characters.workflow";
import { isIntegerString } from "../../utilities/string-checks-utils";

/**
 * Returns the display string for a recipe option in the autocomplete menu.
 * @param parameters - The parameters for the function
 * @param parameters.recipeService - The recipe service
 * @param parameters.recipe - The recipe object
 * @param parameters.playerID - The ID of the player
 * @returns The display string for the recipe option.
 */
function getRecipeOptionDisplayName(
	{recipeService, recipe, playerID}: {
		recipeService: RecipeService,
		recipe: Recipe,
		playerID: PlayerID
}) {
	const {id} = recipe;
	const displayName = recipeService.getDisplayName(id);
	const isCraftable = recipeService.playerHasInputCharacters(id, playerID);
	const craftableSymbol = isCraftable ? '✅' : '❌';

	return `${craftableSymbol} ${displayName}`;
}

export const command = new SlashCommand({
	name: "craft-characters",
	description: "Craft characters using a recipe",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.CRAFT_CHARACTERS],
	parameters: [
		new Parameter({
			type: ParameterTypes.STRING,
			name: "input",
			description: "The characters consumed in the crafting recipe",
			autocomplete: (enteredValue, user, enteredValueByParameter) => {
				const { recipeService } = getNamesmithServices();

				const recipes = recipeService.getRecipes();
				const playerID = user.id;
				let enteredOutputValue = enteredValueByParameter.output ?? '';
				if (enteredOutputValue.startsWith("ENTERED VALUE: ")) {
					enteredOutputValue = enteredOutputValue.substring(
						"ENTERED VALUE: ".length
					);
				}

				const filteredRecipes = recipes
					.filter(({id, inputCharacters, outputCharacters}) => {
						// Ignore recipes that don't have the entered output characters
						if (enteredOutputValue !== '') {
							if (isIntegerString(enteredOutputValue)) {
								const recipe = recipeService.resolveRecipe(Number(enteredOutputValue));
								return recipe.id === id;
							}

							if (!outputCharacters.includes(enteredOutputValue))
								return false;
						}

						// Ignore recipes that don't have the entered input characters
						if (enteredValue !== '') {
							if (!inputCharacters.includes(enteredValue))
								return false;
						}

						return true;
					});

				const sortedRecipes = recipeService.sortByCraftableByPlayer(
					filteredRecipes,
					playerID
				)

				const autocompleteChoices = sortedRecipes.map(recipe => {
					const {id: recipeID} = recipe;
					const stringID = recipeID.toString();
					const name = getRecipeOptionDisplayName({recipeService, recipe, playerID});

					return {
						name: name,
						value: stringID
					}
				});

				if (enteredValue !== '') {
					autocompleteChoices.unshift({
						name: enteredValue,
						value: `ENTERED VALUE: ${enteredValue}`
					});
				}

				return autocompleteChoices;
			}
		}),
		new Parameter({
			type: ParameterTypes.STRING,
			name: "output",
			description: "The characters produced by the crafting recipe",
			autocomplete: (enteredValue, user, enteredValueByParameter) => {
				const { recipeService } = getNamesmithServices();

				const recipes = recipeService.getRecipes();
				const playerID = user.id;
				let enteredInputValue = enteredValueByParameter.input ?? '';
				if (enteredInputValue.startsWith("ENTERED VALUE: ")) {
					enteredInputValue = enteredInputValue.substring(
						"ENTERED VALUE: ".length
					);
				}

				const filteredRecipes = recipes
					.filter(({id, inputCharacters, outputCharacters}) => {
						// Ignore recipes that don't have the entered input characters
						if (enteredInputValue !== '') {
							if (isIntegerString(enteredInputValue)) {
								const recipe = recipeService.resolveRecipe(Number(enteredInputValue));
								return recipe.id === id;
							}

							if (!inputCharacters.includes(enteredInputValue))
								return false;
						}

						// Ignore recipes that don't have the entered output characters
						if (enteredValue !== '') {
							if (!outputCharacters.includes(enteredValue))
								return false;
						}

						return true;
					});

				const sortedRecipes = recipeService.sortByCraftableByPlayer(
					filteredRecipes,
					playerID
				)

				const autocompleteChoices = sortedRecipes.map(recipe => {
					const {id: recipeID} = recipe;
					const stringID = recipeID.toString();
					const name = getRecipeOptionDisplayName({recipeService, recipe, playerID});

					return {
						name: name,
						value: stringID
					}
				});

				if (enteredValue !== '') {
					autocompleteChoices.unshift({
						name: enteredValue,
						value: `ENTERED VALUE: ${enteredValue}`
					});
				}

				return autocompleteChoices;
			}
		})
	],
	execute: async function execute(interaction, {
		input: maybeRecipeIDFromInput,
		output: maybeRecipeIDFromOutput
	}) {
		let recipeID: RecipeID | null = null;

		if (isIntegerString(maybeRecipeIDFromInput)) {
			recipeID = parseInt(maybeRecipeIDFromInput);
		}
		else if (isIntegerString(maybeRecipeIDFromOutput)) {
			recipeID = parseInt(maybeRecipeIDFromOutput);
		}
		else {
			return 'You must select a recipe from the autocomplete options to successfully craft characters.';
		}

		const result = await craftCharacters({
			...getNamesmithServices(),
			player: interaction.user.id,
			recipe: recipeID,
		});

		if (result.isNonPlayerCrafted()) {
			return `You're not a player, so you can't craft characters.`;
		}
		else if (result.isRecipeNotUnlocked()) {
			return `You haven't unlocked this recipe yet.`;
		}
		else if (result.isMissingRequiredCharacters()) {
			const { missingCharacters } = result;
			return `You are missing ${missingCharacters.length} required characters for this recipe: ${missingCharacters}`;
		}

		const {newInventory, craftedCharacters, recipeUsed} = result;

		return (
			`Successfully crafted ${craftedCharacters} using ${recipeUsed.inputCharacters}\n` +
			`Your inventory now contains ${newInventory}`
		);
	}
});