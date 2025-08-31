import { logInfo, logSuccess } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { regenerateRecipeSelectMenu } from "../interfaces/recipe-select-menu";
import { regenerateVoteDisplay } from "../interfaces/voting-display";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "../services/game-state.service";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { VoteService } from "../services/vote.service";

export const initializeServices = async () => {
	const db = await setupDatabase();

	global.namesmith = {};
	global.namesmith.mysteryBoxRepository =
		new MysteryBoxRepository(db);

	global.namesmith.characterRepository =
		new CharacterRepository(db);

	global.namesmith.playerRepository =
		new PlayerRepository(db);

	global.namesmith.gameStateRepository =
		new GameStateRepository(db);

	global.namesmith.voteRepository =
		new VoteRepository(db);

	global.namesmith.recipeRepository =
		new RecipeRepository(db);

	global.namesmith.mysteryBoxService = new MysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository,
	);

	global.namesmith.playerService = new PlayerService(
		global.namesmith.playerRepository,
	);

	global.namesmith.voteService = new VoteService(
		global.namesmith.voteRepository,
		global.namesmith.playerService,
	);

	global.namesmith.recipeService = new RecipeService(
		global.namesmith.recipeRepository,
		global.namesmith.playerService,
	);

	const gameStateService = new GameStateService(
		global.namesmith.gameStateRepository,
		global.namesmith.playerService,
		global.namesmith.voteService,
		global.namesmith.recipeService
	);

	global.namesmith.gameStateService = gameStateService;
};

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
export const setupNamesmith = async () => {
	logInfo("Setting up Namesmith...");
	await initializeServices();

	const { gameStateService, recipeService, playerService } = getNamesmithServices();

	gameStateService.scheduleGameEvents();

	await regenerateRecipeSelectMenu({recipeService});
	await regenerateVoteDisplay({playerService});

	logSuccess("Namesmith set up");
}