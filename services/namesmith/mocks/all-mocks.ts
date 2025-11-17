import { NamesmithDependencies } from "../types/namesmith.types";
import { createMockDB } from "./mock-database";
import { createMockRoleRepo, createMockCharacterRepo, createMockGameStateRepo, createMockMysteryBoxRepo, createMockPerkRepo, createMockPlayerRepo, createMockRecipeRepo, createMockTradeRepo, createMockVoteRepo, createMockQuestRepo, createMockActivityLogRepo } from "./mock-repositories";
import { createMockActivityLogService, createMockCharacterService, createMockGameStateService, createMockMysteryBoxService, createMockPerkService, createMockPlayerService, createMockQuestService, createMockRecipeService, createMockRoleService, createMockTradeService, createMockVoteService } from "./mock-services";

/**
 * Creates all the mock services and repositories needed for testing.
 * @returns An object containing all the mock services and repositories.
 */
export const createAllMocks = (): NamesmithDependencies => {
	const mockDB = createMockDB();

	const mysteryBoxRepository = createMockMysteryBoxRepo(mockDB);
	const characterRepository = createMockCharacterRepo(mockDB);
	const voteRepository = createMockVoteRepo(mockDB);
	const gameStateRepository = createMockGameStateRepo(mockDB);
	const recipeRepository = createMockRecipeRepo(mockDB);
	const perkRepository = createMockPerkRepo(mockDB);
	const roleRepository = createMockRoleRepo(mockDB, perkRepository);
	const playerRepository = createMockPlayerRepo(mockDB, roleRepository, perkRepository);
	const tradeRepository = createMockTradeRepo(mockDB, playerRepository);
	const questRepository = createMockQuestRepo(mockDB);
	const activityLogRepository = createMockActivityLogRepo(mockDB, playerRepository, recipeRepository, questRepository);

	const mysteryBoxService = createMockMysteryBoxService(mysteryBoxRepository, characterRepository);
	const characterService = createMockCharacterService(characterRepository);
	const playerService = createMockPlayerService(playerRepository);
	const voteService = createMockVoteService(voteRepository, playerService);
	const recipeService = createMockRecipeService(recipeRepository, playerService);
	const tradeService = createMockTradeService(tradeRepository, playerService);
	const gameStateService = createMockGameStateService(gameStateRepository, playerService, voteService);
	const perkService = createMockPerkService(perkRepository, roleRepository, playerService);
	const roleService = createMockRoleService(roleRepository, playerService);
	const activityLogService = createMockActivityLogService(activityLogRepository);
	const questService = createMockQuestService(questRepository, activityLogService, playerService);

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
		questRepository,
		activityLogRepository,

		mysteryBoxService,
		characterService,
		playerService,
		voteService,
		gameStateService,
		recipeService,
		tradeService,
		perkService,
		roleService,
		questService,
		activityLogService,
	};
}