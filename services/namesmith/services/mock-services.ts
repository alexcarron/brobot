import { createMockDB } from "../database/mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { createMockPlayerRepo, createMockVoteRepo, createMockMysteryBoxRepo, createMockCharacterRepo, createMockGameStateRepo, createMockRecipeRepo } from "../repositories/mock-repositories";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "./game-state.service";
import { MysteryBoxService } from "./mystery-box.service";
import { PlayerService } from "./player.service";
import { RecipeService } from "./recipe.service";
import { VoteService } from "./vote.service";

/**
 * Creates a mock GameStateService instance for testing purposes.
 * @param mockGameStateRepository - The mock game state repository to use.
 * @param mockPlayerService - The mock player service to use.
 * @param mockVoteService - The mock vote service to use.
 * @param mockRecipeService - The mock recipe service to use.
 * @returns A mock instance of the GameStateService.
 */
export const createMockGameStateService = (
	mockGameStateRepository?: GameStateRepository,
	mockPlayerService?: PlayerService,
	mockVoteService?: VoteService,
	mockRecipeService?: RecipeService,
): GameStateService => {
	const sharedDB =
		mockGameStateRepository?.db ??
		mockPlayerService?.playerRepository.db ??
		mockVoteService?.voteRepository.db ??
		createMockDB();

	const gameStateRepository =
		mockGameStateRepository ??
		createMockGameStateRepo(sharedDB);

	const playerService =
		mockPlayerService ??
		createMockPlayerService(createMockPlayerRepo(sharedDB));

	const voteService =
		mockVoteService ??
		createMockVoteService(
			createMockVoteRepo(sharedDB),
			playerService
		);

	const recipeService =
		mockRecipeService ??
		createMockRecipeService(
			createMockRecipeRepo(sharedDB),
			playerService
		);

	return new GameStateService(
		gameStateRepository,
		playerService,
		voteService,
		recipeService
	);
}

/**
 * Creates a mock PlayerService instance for testing purposes.
 * @param mockPlayerRepo - The mock player repository to use.
 * @returns A mock instance of the PlayerService.
 */
export const createMockPlayerService = (
	mockPlayerRepo?: PlayerRepository
): PlayerService => {
	const playerRepo =
		mockPlayerRepo ??
		createMockPlayerRepo();

	return new PlayerService(playerRepo);
}

/**
 * Creates a mock VoteService instance for testing purposes.
 * @param mockVoteRepo - The mock vote repository to use.
 * @param mockPlayerService - The mock player service to use.
 * @returns A mock instance of the VoteService.
 */
export const createMockVoteService = (
	mockVoteRepo?: VoteRepository,
	mockPlayerService?: PlayerService
): VoteService => {
	const sharedDB =
		mockVoteRepo?.db ??
		mockPlayerService?.playerRepository.db ??
		createMockDB();

	const voteRepo =
		mockVoteRepo ??
		createMockVoteRepo(sharedDB);

	const playerService =
		mockPlayerService ??
		createMockPlayerService(createMockPlayerRepo(sharedDB));

	return new VoteService(voteRepo, playerService);
};

/**
 * Creates a mock MysteryBoxService instance for testing purposes.
 * @param mockMysteryBoxRepository - The mock mystery box repository to use.
 * @param mockCharacterRepository - The mock character repository to use.
 * @returns A mock instance of the MysteryBoxService.
 */
export const createMockMysteryBoxService = (
	mockMysteryBoxRepository?: MysteryBoxRepository,
	mockCharacterRepository?: CharacterRepository
): MysteryBoxService => {
	const sharedDB =
		mockMysteryBoxRepository?.db ??
		mockCharacterRepository?.db ??
		createMockDB();

	const mysteryBoxRepo =
		mockMysteryBoxRepository ??
		createMockMysteryBoxRepo(sharedDB);

	const characterRepo =
		mockCharacterRepository ??
		createMockCharacterRepo(sharedDB);

	return new MysteryBoxService(mysteryBoxRepo, characterRepo);
}

/**
 * Creates a mock RecipeService instance for testing purposes.
 * If any of the mock repository parameters are undefined, a default mock repository
 * instance is created for the respective service.
 * @param mockRecipeRepository - The mock recipe repository to use.
 * @param mockPlayerService - The mock player service to use.
 * @returns A mock instance of the RecipeService.
 */
export const createMockRecipeService = (
	mockRecipeRepository?: RecipeRepository,
	mockPlayerService?: PlayerService,
) => {
  const sharedDB =
    mockRecipeRepository?.db ??
    mockPlayerService?.playerRepository.db ??
    createMockDB();

  const recipeRepository =
		mockRecipeRepository ??
		createMockRecipeRepo(sharedDB);

  const playerService =
    mockPlayerService ??
    createMockPlayerService(createMockPlayerRepo(sharedDB));

  return new RecipeService(recipeRepository, playerService);
}

/**
 * Creates mock service instances for testing purposes.

 * If any of the mock repository parameters are undefined, a default mock repository
 * instance is created for the respective service.
 * @param options - An object with the mock repository instances to use.
 * @param options.mockPlayerRepo - The mock player repository to use.
 * @param options.mockVoteRepo - The mock vote repository to use.
 * @param options.mockMysteryBoxRepo - The mock mystery box repository to use.
 * @param options.mockCharacterRepo - The mock character repository to use.
 * @param options.mockRecipeRepo - The mock recipe repository to use.
 * @param options.mockGameStateRepository - The mock game state repository to use.
 * @returns An object with the created mock service instances.
 */
export const createMockServices = ({
	mockPlayerRepo,
	mockVoteRepo,
	mockMysteryBoxRepo,
	mockCharacterRepo,
	mockRecipeRepo,
	mockGameStateRepository
}: {
	mockPlayerRepo?: PlayerRepository,
	mockVoteRepo?: VoteRepository,
	mockMysteryBoxRepo?: MysteryBoxRepository,
	mockCharacterRepo?: CharacterRepository,
	mockRecipeRepo?: RecipeRepository,
	mockGameStateRepository?: GameStateRepository
} = {}): {
	playerService: PlayerService,
	voteService: VoteService,
	mysteryBoxService: MysteryBoxService,
	recipeService: RecipeService,
	gameStateService: GameStateService
} => {
	const sharedDB =
		mockPlayerRepo?.db ??
		mockVoteRepo?.db ??
		mockMysteryBoxRepo?.db ??
		mockCharacterRepo?.db ??
		mockRecipeRepo?.db ??
		mockGameStateRepository?.db ??
		createMockDB();

	const playerRepo =
		mockPlayerRepo ??
		createMockPlayerRepo(sharedDB);

	const voteRepo =
		mockVoteRepo ??
		createMockVoteRepo(sharedDB);

	const mysteryBoxRepo =
		mockMysteryBoxRepo ??
		createMockMysteryBoxRepo(sharedDB);

	const characterRepo =
		mockCharacterRepo ??
		createMockCharacterRepo(sharedDB);

	const recipeRepo =
		mockRecipeRepo ??
		createMockRecipeRepo(sharedDB);

	const gameStateRepository =
		mockGameStateRepository ??
		createMockGameStateRepo(sharedDB);

	const playerService = createMockPlayerService(playerRepo);
	const voteService = createMockVoteService(
		voteRepo, playerService
	);
	const mysteryBoxService = createMockMysteryBoxService(
		mysteryBoxRepo, characterRepo
	);
	const recipeService = createMockRecipeService(
		recipeRepo, playerService
	);
	const gameStateService = createMockGameStateService(
		gameStateRepository, playerService, voteService
	);

	return {
		playerService: playerService,
		voteService: voteService,
		mysteryBoxService: mysteryBoxService,
		recipeService: recipeService,
		gameStateService: gameStateService
	}
};