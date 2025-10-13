import { NamesmithDependencies } from "../types/namesmith.types";
import { createMockDB } from "./mock-database";
import { crateMockRoleRepo, createMockCharacterRepo, createMockGameStateRepo, createMockMysteryBoxRepo, createMockPerkRepo, createMockPlayerRepo, createMockRecipeRepo, createMockTradeRepo, createMockVoteRepo } from "./mock-repositories";
import { createMockCharacterService, createMockGameStateService, createMockMysteryBoxService, createMockPlayerService, createMockRecipeService, createMockTradeService, createMockVoteService } from "./mock-services";

/**
 * Creates all the mock services and repositories needed for testing.
 * @returns An object containing all the mock services and repositories.
 */
export const createAllMocks = (): NamesmithDependencies => {
	const mockDB = createMockDB();

	const mysteryBoxRepository = createMockMysteryBoxRepo(mockDB);
	const characterRepository = createMockCharacterRepo(mockDB);
	const playerRepository = createMockPlayerRepo(mockDB);
	const voteRepository = createMockVoteRepo(mockDB);
	const gameStateRepository = createMockGameStateRepo(mockDB);
	const recipeRepository = createMockRecipeRepo(mockDB);
	const tradeRepository = createMockTradeRepo(mockDB);
	const perkRepository = createMockPerkRepo(mockDB);
	const roleRepository = crateMockRoleRepo(mockDB);

	const mysteryBoxService = createMockMysteryBoxService(mysteryBoxRepository, characterRepository);
	const characterService = createMockCharacterService(characterRepository);
	const playerService = createMockPlayerService(playerRepository);
	const voteService = createMockVoteService(voteRepository, playerService);
	const recipeService = createMockRecipeService(recipeRepository, playerService);
	const tradeService = createMockTradeService(tradeRepository, playerService);
	const gameStateService = createMockGameStateService(gameStateRepository, playerService, voteService);

	return {
		db: mockDB,

		mysteryBoxRepository,
		characterRepository,
		playerRepository,
		voteRepository,
		gameStateRepository,
		recipeRepository,
		tradeRepository,
		perkRepository,
		roleRepository,

		mysteryBoxService,
		characterService,
		playerService,
		voteService,
		gameStateService,
		recipeService,
		tradeService
	};
}