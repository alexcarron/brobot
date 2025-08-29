import { StringSelectMenuInteraction } from "discord.js";
import { attempt } from "../../../utilities/error-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { RecipeResolvable } from "../types/recipe.types";
import { fetchRecipesChannel } from "../utilities/discord-fetch.utility";
import { MissingRequiredCharactersError, NonPlayerCraftedError, RecipeNotUnlockedError } from "../utilities/error.utility";
import { craftCharacter } from "../workflows/craft-character.workflow";
import { replyToInteraction, setChannelMessage } from "../../../utilities/discord-action-utils";
import { escapeDiscordMarkdown } from "../../../utilities/string-manipulation-utils";
import { RecipeService } from "../services/recipe.service";
import { DiscordSelectMenu } from "../../../utilities/discord-interface-utils";

const onRecipeSelected = async (
	player: PlayerResolvable,
	recipe: RecipeResolvable,
	interaction: StringSelectMenuInteraction,
) => {
	await attempt(
		craftCharacter({...getNamesmithServices(), player, recipe})
	)
		.onError(NonPlayerCraftedError, async (error) => {
			await replyToInteraction(interaction, error.userFriendlyMessage);
		})
		.onError(MissingRequiredCharactersError, async (error) => {
			await replyToInteraction(interaction, error.userFriendlyMessage);
		})
		.onError(RecipeNotUnlockedError, async (error) => {
			await replyToInteraction(interaction, error.userFriendlyMessage);
		})
		.onError(async (error) => {
			const errorMessage =
				(error as any).userFriendlyMessage ??
				error.message ??
				"An unknown error has occurred.";

			await replyToInteraction(interaction, errorMessage);
		})
		.onSuccess(async ({newInventory, craftedCharacter, recipeUsed}) => {
			await replyToInteraction(interaction, escapeDiscordMarkdown(
				`Successfully crafted ${craftedCharacter} using ${recipeUsed.inputCharacters}\n` +
				`Your inventory now contains ${newInventory}`
			));
		})
		.execute();
}

export const createRecipeSelectMenu = (
	{recipeService}: {recipeService: RecipeService},
): DiscordSelectMenu => {
	const allRecipes = recipeService.getRecipes();
	const options = allRecipes.map(recipe => ({
			label: recipeService.getDisplayName(recipe),
			value: recipeService.getID(recipe).toString()
	}));

	const recipeSelectMenu = new DiscordSelectMenu({
		promptText: "Select a recipe to instantly craft a character",
		placeholderText: "Select a recipe here...",
		menuID: "namesmith-recipes",
		options: options,
		onOptionSelected: async (interaction) => {
			const optionSelected = interaction.values[0];
			const idSelected = parseInt(optionSelected);

			const userID = interaction.user.id;

			await onRecipeSelected(userID, idSelected, interaction);
		}
	});

	return recipeSelectMenu;
}

export const sendRecipeSelectMenu = async (
	{recipeService}: {recipeService: RecipeService},
) => {
	const recipeSelectMenu = createRecipeSelectMenu({recipeService});
	const recipeChannel = await fetchRecipesChannel();
	await setChannelMessage(recipeChannel, recipeSelectMenu.getMessageContents());
}

export const regenerateRecipeSelectMenu = async (
	{recipeService}: {recipeService: RecipeService},
) => {
	const recipeSelectMenu = createRecipeSelectMenu({recipeService});
	const recipeChannel = await fetchRecipesChannel();
	await recipeSelectMenu.regenerate({channel: recipeChannel});
}