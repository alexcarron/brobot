import { getCharacters, hasEmoji } from "../../../../../utilities/string-checks-utils";
import { toListOfWords } from "../../../../../utilities/string-manipulation-utils";
import { UTILITY_CHARACTERS } from "../../../constants/characters.constants";
import { Quests } from "../../../constants/quests.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { RecipeID } from "../../../types/recipe.types";
import { hasUtilityCharacter } from "../../../utilities/character.utility";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about crafting characters with recipes.
 */
export const craftingEligibilityChecks = {

	// Experienced Craftsman
	[Quests.EXPERIENCED_CRAFTSMAN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_CRAFTS_NEEDED = 5;
		const NUM_UNIQUE_RECIPES_NEEDED = 3;

		const craftLogs = activityLogService.getCraftLogsTodayByPlayer(player);
		const uniqueRecipesCrafted = new Set<number>();

		for (const log of craftLogs) {
			if (log.involvedRecipe === null) continue;
			uniqueRecipesCrafted.add(log.involvedRecipe.id);
		}

		if (craftLogs.length < NUM_CRAFTS_NEEDED) {
			return toFailure(
				`You have need to craft at least ${NUM_CRAFTS_NEEDED} times to complete the ${quest.name} quest, but you have only crafted ${craftLogs.length} times. You need to craft ${NUM_CRAFTS_NEEDED - craftLogs.length} more times.`
			);
		}

		if (uniqueRecipesCrafted.size < NUM_UNIQUE_RECIPES_NEEDED) {
			const numHas = uniqueRecipesCrafted.size;
			const numNeeded = NUM_UNIQUE_RECIPES_NEEDED;
			return toFailure(
				`You have to craft at least ${numNeeded} different recipes to complete the ${quest.name} quest, but you have only crafted ${numHas}. You need to craft ${numNeeded - numHas} more recipes you have not used before.`
			)
		}

		return PLAYER_MET_CRITERIA_RESULT;
	},

	// Emoji Alchemist
	[Quests.EMOJI_ALCHEMIST.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			if (hasEmoji(recipeLog.involvedRecipe.outputCharacters))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not crafted any emojis today. You must use a recipe that crafts an emoji to complete the "${quest.name}" quest.`);
	},

	// Many for One
	[Quests.MANY_FOR_ONE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_INPUT_CHARACTERS_NEEDED = 3;
		const MAX_OUTPUT_CHARACTERS_NEEDED = 1;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = getCharacters(recipeLog.involvedRecipe.inputCharacters);
			const outputCharacters = getCharacters(recipeLog.involvedRecipe.outputCharacters);

			if (inputCharacters.length >= MIN_INPUT_CHARACTERS_NEEDED && outputCharacters.length <= MAX_OUTPUT_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not crafted a recipe with at least ${MIN_INPUT_CHARACTERS_NEEDED} input characters and at most ${MAX_OUTPUT_CHARACTERS_NEEDED} output character(s) today. You must use a recipe with these requirements to complete the "${quest.name}" quest.`);
	},

	// Crafty Crafter
	[Quests.CRAFTY_CRAFTER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		let numRecipesWithUtilities = 0;
		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = recipeLog.involvedRecipe.inputCharacters;

			if (hasUtilityCharacter(inputCharacters))
				numRecipesWithUtilities++;
		}

		if (numRecipesWithUtilities >= MIN_RECIPES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You crafted only ${numRecipesWithUtilities} recipes with utility characters today. You must craft at least ${MIN_RECIPES_NEEDED} to complete the "${quest.name}" quest.`);
	},

	// Large Output
	[Quests.LARGE_OUTPUT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_OUTPUT_CHARACTERS_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const outputCharacters = getCharacters(recipeLog.involvedRecipe.outputCharacters);

			if (outputCharacters.length >= MIN_NUM_OUTPUT_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not craft a recipe that gave you at least ${MIN_NUM_OUTPUT_CHARACTERS_NEEDED} characters today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Dual Artisan
	[Quests.DUAL_ARTISAN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		const outputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
			continue;

			const outputCharacters = recipeLog.involvedRecipe.outputCharacters;

			if (!outputCharacterToRecipes.has(outputCharacters))
				outputCharacterToRecipes.set(outputCharacters, new Set());

			const recipesSet = outputCharacterToRecipes.get(outputCharacters)!;
			recipesSet.add(recipeLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not craft the exact same character(s) using at least ${MIN_RECIPES_NEEDED} different recipes today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Recipe Remix
	[Quests.RECIPE_REMIX.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		const inputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = recipeLog.involvedRecipe.inputCharacters;

			if (!inputCharacterToRecipes.has(inputCharacters))
				inputCharacterToRecipes.set(inputCharacters, new Set());

			const recipesSet = inputCharacterToRecipes.get(inputCharacters)!;
			recipesSet.add(recipeLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not use the same character(s) in at least ${MIN_RECIPES_NEEDED} different recipes today. You must do that to complete the "${quest.name}" quest.`);
	},

	[Quests.CRAFTING_MARATHON.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_UNIQUE_RECIPES_NEEDED = 15;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const uniqueRecipeIDs = new Set<RecipeID>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			uniqueRecipeIDs.add(craftLog.involvedRecipe.id);
		}

		if (uniqueRecipeIDs.size < NUM_UNIQUE_RECIPES_NEEDED)
			return toFailure(`You have only crafted using ${uniqueRecipeIDs.size} different recipes this week. You need to craft using at least ${NUM_UNIQUE_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.EMOJI_CRAFT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_EMOJIS_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		
		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		let numEmojisCrafted = 0;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			if (hasEmoji(craftLog.involvedRecipe.outputCharacters))
				numEmojisCrafted++;
		}

		if (numEmojisCrafted === 0)
			return toFailure(`You have not crafted any emoji characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		else if (numEmojisCrafted < NUM_EMOJIS_NEEDED)
			return toFailure(`You have only crafted ${numEmojisCrafted} emoji character(s) this week. You need to craft ${NUM_EMOJIS_NEEDED} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.BULK_RECIPE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_INPUT_CHARACTERS_NEEDED = 5;
		const NUM_OUTPUT_CHARACTERS_NEEDED = 1;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		
		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		let minOutputCharacters = Number.POSITIVE_INFINITY;
		let maxInputCharacters = Number.NEGATIVE_INFINITY;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			minOutputCharacters = Math.min(minOutputCharacters, craftLog.involvedRecipe.outputCharacters.length);
			maxInputCharacters = Math.max(maxInputCharacters, craftLog.involvedRecipe.inputCharacters.length);
		}

		if (minOutputCharacters > NUM_OUTPUT_CHARACTERS_NEEDED)
			return toFailure(`You never crafted a recipe that gave you only one character this week. You need to craft a recipe that takes at least ${NUM_INPUT_CHARACTERS_NEEDED} characters and gives you one character to complete the "${quest.name}" quest.`);

		if (maxInputCharacters < NUM_INPUT_CHARACTERS_NEEDED)
			return toFailure(`You only crafted a recipe that gave you one character using at most ${maxInputCharacters} characters this week. You need to craft a recipe using at least ${NUM_INPUT_CHARACTERS_NEEDED} characters to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.UTILITY_MASTER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const utilityCharactersUsed = new Set<string>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const inputCharacters = craftLog.involvedRecipe.inputCharacters;

			if (hasUtilityCharacter(inputCharacters)) {
				const utilityChars = getCharacters(inputCharacters);
				for (const char of utilityChars) {
					if (hasUtilityCharacter(char)) {
						utilityCharactersUsed.add(char);
					}
				}
			}
		}

		if (utilityCharactersUsed.size === 0)
			return toFailure(`You have not used any utility characters in recipes this week. You must craft a recipe with at least one utility character to complete the "${quest.name}" quest.`);

		const allUtilityCharacters = UTILITY_CHARACTERS;
		const missingUtilityCharacters = Array.from(allUtilityCharacters).filter(char => !utilityCharactersUsed.has(char));
		const usedList = toListOfWords(Array.from(utilityCharactersUsed));
		const missingList = toListOfWords(missingUtilityCharacters);

		if (missingUtilityCharacters.length > 0)
			return toFailure(`You have only used the utility characters ${usedList} in your recipes this week. You still need to use ${missingList} in a recipe to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.TRI_FORGE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const outputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const outputCharacters = craftLog.involvedRecipe.outputCharacters;

			if (!outputCharacterToRecipes.has(outputCharacters))
				outputCharacterToRecipes.set(outputCharacters, new Set());

			const recipesSet = outputCharacterToRecipes.get(outputCharacters)!;
			recipesSet.add(craftLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		let maxRecipesForSameOutput = 0;
		for (const recipesSet of outputCharacterToRecipes.values()) {
			if (recipesSet.size > maxRecipesForSameOutput)
				maxRecipesForSameOutput = recipesSet.size;
		}

		if (maxRecipesForSameOutput === 0)
			return toFailure(`You have not crafted any characters this week. You must craft the same character using at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return toFailure(`You have only produced the same character using ${maxRecipesForSameOutput} different recipe(s) this week. You need to produce the same character using at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);
	},

	[Quests.INPUT_REMIX.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const MIN_DISTINCT_OUTPUTS_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const inputCharacterToOutputCharacters = new Map<string, Set<string>>();
		const inputCharacterToRecipes = new Map<string, Set<RecipeID>>();

		let maxRecipesForInput = 0;
		let maxDistinctOutputsForInput = 0;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const inputCharacters = craftLog.involvedRecipe.inputCharacters;
			const outputCharacters = craftLog.involvedRecipe.outputCharacters;

			if (!inputCharacterToOutputCharacters.has(inputCharacters))
				inputCharacterToOutputCharacters.set(inputCharacters, new Set());

			if (!inputCharacterToRecipes.has(inputCharacters))
				inputCharacterToRecipes.set(inputCharacters, new Set());

			const outputCharactersSet = inputCharacterToOutputCharacters.get(inputCharacters)!;
			const recipeIDsSet = inputCharacterToRecipes.get(inputCharacters)!;
			
			outputCharactersSet.add(outputCharacters);
			recipeIDsSet.add(craftLog.involvedRecipe.id);

			if (
				outputCharactersSet.size >= maxDistinctOutputsForInput && 
				recipeIDsSet.size >= maxRecipesForInput
			) {
				maxDistinctOutputsForInput = outputCharactersSet.size;
				maxRecipesForInput = recipeIDsSet.size;
			}
		}

		for (const [inputChars, outputsSet] of inputCharacterToOutputCharacters.entries()) {
			const recipesSet = inputCharacterToRecipes.get(inputChars)!;
			if (recipesSet.size >= MIN_RECIPES_NEEDED && outputsSet.size >= MIN_DISTINCT_OUTPUTS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		if (maxRecipesForInput === 0)
			return toFailure(`You have not crafted any characters this week. You must use the same input characters in at least ${MIN_RECIPES_NEEDED} different recipes and get ${MIN_DISTINCT_OUTPUTS_NEEDED} distinct outputs to complete the "${quest.name}" quest.`);

		if (maxRecipesForInput < MIN_RECIPES_NEEDED)
			return toFailure(`You have only used the same input characters in ${maxRecipesForInput} different recipe(s) this week. You need to use the same input characters in at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return toFailure(`You have only gotten ${maxDistinctOutputsForInput} different character(s) from the same input characters this week. You need to use the same input characters in three different recipes and get ${MIN_DISTINCT_OUTPUTS_NEEDED} distinct characters to complete the "${quest.name}" quest.`);
	},
} as const;
