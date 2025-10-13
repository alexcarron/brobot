import { logInfo, logSuccess } from "../../../utilities/logging-utils";
import { setupDatabase } from "../database/setup-database";
import { regenerateRecipeSelectMenu } from "../interfaces/recipe-select-menu";
import { regenerateAllTradeMessages } from "../interfaces/trading/trade-message";
import { regenerateVoteDisplay } from "../interfaces/voting/voting-messages";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PerkRepository } from "../repositories/perk.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RoleRepository } from "../repositories/role.repository";
import { TradeRepository } from "../repositories/trade.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { CharacterService } from "../services/character.service";
import { GameStateService } from "../services/game-state.service";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { TradeService } from "../services/trade.service";
import { VoteService } from "../services/vote.service";
import { NamesmithDependencies } from "../types/namesmith.types";
import { setupEventListeners } from "./setup-event-listeners";

/**
 * Initializes all the dependencies required for the Namesmith game to run.
 * This sets up all the repositories and services with the correct dependencies.
 * It should be called before any of the event listeners are set up, and before any tests are run.
 * @returns The dependencies required for the Namesmith game to run.
 */
export const initializeDependencies = async (): Promise<NamesmithDependencies> => {
	const db = await setupDatabase();

	const mysteryBoxRepository = new MysteryBoxRepository(db);
	const characterRepository = new CharacterRepository(db);
	const playerRepository = new PlayerRepository(db);
	const gameStateRepository = new GameStateRepository(db);
	const voteRepository = new VoteRepository(db);
	const recipeRepository = new RecipeRepository(db);
	const tradeRepository = new TradeRepository(db);
	const perkRepository = new PerkRepository(db);
	const roleRepository = new RoleRepository(db);

	const mysteryBoxService = new MysteryBoxService(
		mysteryBoxRepository,
		characterRepository,
	);

	const characterService = new CharacterService(
		characterRepository,
	);

	const playerService = new PlayerService(
		playerRepository,
	);

	const voteService = new VoteService(
		voteRepository,
		playerService,
	);

	const recipeService = new RecipeService(
		recipeRepository,
		playerService,
	);

	const tradeService = new TradeService(
		tradeRepository,
		playerService,
	);

	const gameStateService = new GameStateService(
		gameStateRepository,
		playerService,
		voteService,
		recipeService
	);

	const namesmithDependencies: NamesmithDependencies = {
		db,
		mysteryBoxRepository, characterRepository, playerRepository, gameStateRepository, voteRepository, recipeRepository, tradeRepository, perkRepository, roleRepository,
		mysteryBoxService, characterService, playerService, voteService, recipeService, tradeService, gameStateService
	};

	global.namesmith = namesmithDependencies;

	return namesmithDependencies
};

/**
 * Sets up Namesmith by loading and setting up the necessary repositories and services when the bot starts up.
 */
export const setupNamesmith = async () => {
	logInfo("Setting up Namesmith...");
	await initializeDependencies();

	const { gameStateService, recipeService, playerService, tradeService } = getNamesmithServices();

	setupEventListeners();

	if (gameStateService.hasStarted()) {
		gameStateService.scheduleGameEvents();

		await regenerateRecipeSelectMenu({recipeService});
		await regenerateVoteDisplay({playerService});
		await regenerateAllTradeMessages({tradeService, playerService});
	}


	logSuccess("Namesmith set up");
}