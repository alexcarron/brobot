import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { createMockPlayerRepo, createMockVoteRepo, createMockMysteryBoxRepo, createMockCharacterRepo, createMockGameStateRepo } from "../repositories/mock-repositories";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "./game-state.service";
import { MysteryBoxService } from "./mystery-box.service";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";

/**
 * Creates a mock GameStateService instance for testing purposes.
 * @param gameStateRepository - The mock game state repository to use.
 * @param playerService - The mock player service to use.
 * @param voteService - The mock vote service to use.
 * @returns A mock instance of the GameStateService.
 */
export const createMockGameStateService = (
	gameStateRepository?: GameStateRepository,
	playerService?: PlayerService,
	voteService?: VoteService
): GameStateService => {
	if (gameStateRepository === undefined || !(gameStateRepository instanceof GameStateRepository))
		gameStateRepository = createMockGameStateRepo();

	if (playerService === undefined || !(playerService instanceof PlayerService))
		playerService = createMockPlayerService();

	if (voteService === undefined || !(voteService instanceof VoteService))
		voteService = createMockVoteService();

	return new GameStateService(gameStateRepository, playerService, voteService);
}

/**
 * Creates a mock PlayerService instance for testing purposes.
 * @param mockPlayerRepo - The mock player repository to use.
 * @returns A mock instance of the PlayerService.
 */
export const createMockPlayerService =
(mockPlayerRepo?: PlayerRepository): PlayerService => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	return new PlayerService(mockPlayerRepo);
}

/**
 * Creates a mock VoteService instance for testing purposes.
 * @param mockVoteRepo- The mock vote repository to use.
 * @param mockPlayerService - The mock player service to use.
 * @returns A mock instance of the VoteService.
 */
export const createMockVoteService =
(mockVoteRepo?: VoteRepository, mockPlayerService?: PlayerService): VoteService => {
	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	if (mockPlayerService === undefined || !(mockPlayerService instanceof PlayerService))
		mockPlayerService = createMockPlayerService();

	return new VoteService(mockVoteRepo, mockPlayerService);
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
	if (mockMysteryBoxRepository === undefined || !(mockMysteryBoxRepository instanceof MysteryBoxRepository))
		mockMysteryBoxRepository = createMockMysteryBoxRepo();

	if (mockCharacterRepository === undefined || !(mockCharacterRepository instanceof CharacterRepository))
		mockCharacterRepository = createMockCharacterRepo();

	return new MysteryBoxService(mockMysteryBoxRepository, mockCharacterRepository);
}

/**
 * Creates mock service instances for testing purposes.
 *
 * The following services are created with the given mock repositories:
 * - PlayerService
 * - VoteService
 * - MysteryBoxService
 * - GameStateService
 *
 * If any of the mock repository parameters are undefined, a default mock repository
 * instance is created for the respective service.
 * @param options - An object with the mock repository instances to use.
 * @param options.mockPlayerRepo - The mock player repository to use.
 * @param options.mockVoteRepo - The mock vote repository to use.
 * @param options.mockMysteryBoxRepo - The mock mystery box repository to use.
 * @param options.mockCharacterRepo - The mock character repository to use.
 * @param options.gameStateRepository - The mock game state repository to use.
 * @returns An object with the created mock service instances.
 */
export const createMockServices = ({
	mockPlayerRepo,
	mockVoteRepo,
	mockMysteryBoxRepo,
	mockCharacterRepo,
	gameStateRepository
}: {
	mockPlayerRepo?: PlayerRepository,
	mockVoteRepo?: VoteRepository,
	mockMysteryBoxRepo?: MysteryBoxRepository,
	mockCharacterRepo?: CharacterRepository,
	gameStateRepository?: GameStateRepository
} = {}): {
	playerService: PlayerService,
	voteService: VoteService,
	mysteryBoxService: MysteryBoxService,
	gameStateService: GameStateService
} => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	if (mockMysteryBoxRepo === undefined || !(mockMysteryBoxRepo instanceof MysteryBoxRepository))
		mockMysteryBoxRepo = createMockMysteryBoxRepo();

	if (mockCharacterRepo === undefined || !(mockCharacterRepo instanceof CharacterRepository))
		mockCharacterRepo = createMockCharacterRepo();

	if (gameStateRepository === undefined || !(gameStateRepository instanceof GameStateRepository))
		gameStateRepository = createMockGameStateRepo();

	const playerService = createMockPlayerService(mockPlayerRepo);
	const voteService = createMockVoteService(mockVoteRepo, playerService);
	const mysteryBoxService = createMockMysteryBoxService(mockMysteryBoxRepo, mockCharacterRepo);
	const gameStateService = createMockGameStateService(gameStateRepository, playerService, voteService);

	return {
		playerService: playerService,
		voteService: voteService,
		mysteryBoxService: mysteryBoxService,
		gameStateService: gameStateService
	}
};