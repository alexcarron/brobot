import { createMockDB } from "./mock-database";
import { createMockMysteryBoxRepo, createMockCharacterRepo, createMockPlayerRepo, createMockGameStateRepo, createMockVoteRepo, createMockRecipeRepo, createMockTradeRepo, createMockPerkRepo } from "./mock-repositories";
import { createMockMysteryBoxService, createMockPlayerService, createMockVoteService, createMockGameStateService, createMockCharacterService, createMockRecipeService, createMockTradeService } from "./mock-services";
import { NamesmithDependencies } from "../types/namesmith.types";

/**
 * Sets up a mock Namesmith server with mock repositories and services. This is
 * used by the event listeners to simulate the game state and player state
 * during testing.
 * This function should be called before any of the event listeners are set up
 * and before any tests are run.
 * @returns An object containing all the mock services and repositories.
 */
export const setupMockNamesmith = (): NamesmithDependencies => {
	const mockDB = createMockDB();

	global.namesmith = {};
	global.namesmith.mysteryBoxRepository =
		createMockMysteryBoxRepo(mockDB);

	global.namesmith.characterRepository =
		createMockCharacterRepo(mockDB);

	global.namesmith.playerRepository =
		createMockPlayerRepo(mockDB);

	global.namesmith.gameStateRepository =
		createMockGameStateRepo(mockDB);

	global.namesmith.voteRepository =
		createMockVoteRepo(mockDB);

	global.namesmith.recipeRepository =
		createMockRecipeRepo(mockDB);

	global.namesmith.tradeRepository =
		createMockTradeRepo(mockDB);

	global.namesmith.perkRepository =
		createMockPerkRepo(mockDB);

	global.namesmith.mysteryBoxService = createMockMysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository,
	);

	global.namesmith.characterService = createMockCharacterService(
		global.namesmith.characterRepository,
	);

	global.namesmith.playerService = createMockPlayerService(
		global.namesmith.playerRepository,
	);

	global.namesmith.voteService = createMockVoteService(
		global.namesmith.voteRepository,
		global.namesmith.playerService,
	);

	global.namesmith.recipeService = createMockRecipeService(
		global.namesmith.recipeRepository,
		global.namesmith.playerService,
	);

	global.namesmith.tradeService = createMockTradeService(
		global.namesmith.tradeRepository,
		global.namesmith.playerService,
	);

	global.namesmith.gameStateService = createMockGameStateService(
		global.namesmith.gameStateRepository,
		global.namesmith.playerService,
		global.namesmith.voteService,
	);

	return {
		db: mockDB,

		mysteryBoxRepository: global.namesmith.mysteryBoxRepository,
		characterRepository: global.namesmith.characterRepository,
		playerRepository: global.namesmith.playerRepository,
		voteRepository: global.namesmith.voteRepository,
		gameStateRepository: global.namesmith.gameStateRepository,
		recipeRepository: global.namesmith.recipeRepository,
		tradeRepository: global.namesmith.tradeRepository,
		perkRepository: global.namesmith.perkRepository,

		mysteryBoxService: global.namesmith.mysteryBoxService,
		characterService: global.namesmith.characterService,
		playerService: global.namesmith.playerService,
		voteService: global.namesmith.voteService,
		gameStateService: global.namesmith.gameStateService,
		recipeService: global.namesmith.recipeService,
		tradeService: global.namesmith.tradeService
	};
}