import { createMockDB } from "./mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { createMockPlayerRepo, createMockVoteRepo, createMockMysteryBoxRepo, createMockCharacterRepo, createMockGameStateRepo, createMockRecipeRepo, createMockTradeRepo, createMockPerkRepo } from "./mock-repositories";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { RecipeRepository } from "../repositories/recipe.repository";
import { TradeRepository } from "../repositories/trade.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "../services/game-state.service";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { RecipeService } from "../services/recipe.service";
import { TradeService } from "../services/trade.service";
import { VoteService } from "../services/vote.service";
import { NamesmithServices } from "../types/namesmith.types";
import { CharacterService } from "../services/character.service";
import { PerkRepository } from "../repositories/perk.repository";
import { PerkService } from "../services/perk.service";

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
 * Creates a mock TradeService instance for testing purposes.
 * If any of the mock repository parameters are undefined, a default mock repository instance is created for the respective service.
 * @param mockTradeRepository - The mock trade repository to use.
 * @param mockPlayerService - The mock player service to use.
 * @returns A mock instance of the TradeService.
 */
export const createMockTradeService = (
	mockTradeRepository?: TradeRepository,
	mockPlayerService?: PlayerService,
) => {
  const sharedDB =
    mockTradeRepository?.db ??
    mockPlayerService?.playerRepository.db ??
    createMockDB();

  const tradeRepository =
		mockTradeRepository ??
		createMockTradeRepo(sharedDB);

  const playerService =
    mockPlayerService ??
    createMockPlayerService(createMockPlayerRepo(sharedDB));

  return new TradeService(tradeRepository, playerService);
}

export const createMockCharacterService = (
	mockCharacterRepository?: CharacterRepository
) => {
	const characterRepository =
		mockCharacterRepository ??
		createMockCharacterRepo();

	return new CharacterService(characterRepository);
}

export const createMockPerkService = (
	mockPerkRepository?: PerkRepository,
	mockPlayerService?: PlayerService,
) => {
	const sharedDB =
		mockPerkRepository?.db ??
		mockPlayerService?.playerRepository.db ??
		createMockDB();

	const perkRepository =
		mockPerkRepository ??
		createMockPerkRepo(sharedDB);

	const playerService =
		mockPlayerService ??
		createMockPlayerService(createMockPlayerRepo(sharedDB));

	return new PerkService(perkRepository, playerService);
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
 * @param options.mockGameStateRepo - The mock game state repository to use.
 * @param options.mockTradeRepo - The mock trade repository to use.
 * @param options.mockPerkRepo - The mock perk repository to use.
 * @returns An object with the created mock service instances.
 */
export const createMockServices = ({
	mockPlayerRepo,
	mockVoteRepo,
	mockMysteryBoxRepo,
	mockCharacterRepo,
	mockRecipeRepo,
	mockGameStateRepo,
	mockTradeRepo,
	mockPerkRepo,
}: {
	mockPlayerRepo?: PlayerRepository,
	mockVoteRepo?: VoteRepository,
	mockMysteryBoxRepo?: MysteryBoxRepository,
	mockCharacterRepo?: CharacterRepository,
	mockRecipeRepo?: RecipeRepository,
	mockGameStateRepo?: GameStateRepository,
	mockTradeRepo?: TradeRepository,
	mockPerkRepo?: PerkRepository,
} = {}): NamesmithServices => {
	const sharedDB =
		mockPlayerRepo?.db ??
		mockVoteRepo?.db ??
		mockMysteryBoxRepo?.db ??
		mockCharacterRepo?.db ??
		mockRecipeRepo?.db ??
		mockGameStateRepo?.db ??
		mockTradeRepo?.db ??
		mockPerkRepo?.db ??
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

	const gameStateRepo =
		mockGameStateRepo ??
		createMockGameStateRepo(sharedDB);

	const tradeRepo =
		mockTradeRepo ??
		createMockTradeRepo(sharedDB);

	const perkRepo =
		mockPerkRepo ??
		createMockPerkRepo(sharedDB);

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
		gameStateRepo, playerService, voteService
	);
	const tradeService = createMockTradeService(
		tradeRepo, playerService
	);
	const characterService = createMockCharacterService(
		characterRepo
	);
	const perkService = createMockPerkService(
		perkRepo, playerService
	);

	return {
		playerService: playerService,
		voteService: voteService,
		mysteryBoxService: mysteryBoxService,
		recipeService: recipeService,
		gameStateService: gameStateService,
		tradeService: tradeService,
		characterService: characterService,
		perkService: perkService,
	}
};