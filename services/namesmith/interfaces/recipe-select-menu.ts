import { StringSelectMenuInteraction } from "discord.js";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { RecipeResolvable } from "../types/recipe.types";
import { fetchRecipesChannel } from "../utilities/discord-fetch.utility";
import { craftCharacters } from "../workflows/craft-characters.workflow";
import { replyToInteraction } from "../../../utilities/discord-action-utils";
import { escapeDiscordMarkdown } from "../../../utilities/string-manipulation-utils";
import { RecipeService } from "../services/recipe.service";
import { attempt } from "../../../utilities/error-utils";
import { DiscordSelectMenu } from '../../../utilities/discord-interfaces/discord-select-menu';

const onRecipeSelected = async (
	player: PlayerResolvable,
	recipe: RecipeResolvable,
	interaction: StringSelectMenuInteraction,
) => {
	const result = await craftCharacters({
		...getNamesmithServices(),
		player,
		recipe
	});

	if (result.isNonPlayerCrafted()) {
		await replyToInteraction(interaction,
			'You\'re not a player, so you can\'t craft a character.'
		);
		return;
	}
	else if (result.isMissingRequiredCharacters()) {
		const { missingCharacters } = result;

		const missingCharactersDisplay =
			escapeDiscordMarkdown(missingCharacters);

		await replyToInteraction(interaction,
			`You are missing ${missingCharacters.length} required characters for this recipe: ${missingCharactersDisplay}`
		);
		return;
	}
	else if (result.isRecipeNotUnlocked()) {
		await replyToInteraction(interaction,
			"You must unlock this recipe before you can use it."
		);
		return;
	}

	const {newInventory, craftedCharacters: craftedCharacter, recipeUsed} = result;
	await replyToInteraction(interaction, escapeDiscordMarkdown(
		`Successfully crafted ${craftedCharacter} using ${recipeUsed.inputCharacters}\n` +
		`Your inventory now contains ${newInventory}`
	));
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
	await recipeSelectMenu.setIn(recipeChannel);
}

export const regenerateRecipeSelectMenu = async (
	{recipeService}: {recipeService: RecipeService},
) => {
	const recipeSelectMenu = createRecipeSelectMenu({recipeService});
	const recipeChannel = await fetchRecipesChannel();
	await attempt(
		recipeSelectMenu.regenerate({channel: recipeChannel})
	).ignoreError().execute();
}