import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../database/mock-database";
import { CharacterRepository } from "../repositories/character.repository";
import { GameStateRepository } from "../repositories/game-state.repository";
import { createMockMysteryBoxRepo, createMockCharacterRepo, createMockPlayerRepo, createMockGameStateRepo, createMockVoteRepo } from "../repositories/mock-repositories";
import { MysteryBoxRepository } from "../repositories/mystery-box.repository";
import { PlayerRepository } from "../repositories/player.repository";
import { VoteRepository } from "../repositories/vote.repository";
import { GameStateService } from "../services/game-state.service";
import { createMockMysteryBoxService, createMockPlayerService, createMockVoteService, createMockGameStateService } from "../services/mock-services";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { VoteService } from "../services/vote.service";

/**
 * Creates all the mock services and repositories needed for testing.
 * @returns An object containing all the mock services and repositories.
 */
export const createAllMocks = (): {
	mockDB: DatabaseQuerier,
	mysteryBoxRepository: MysteryBoxRepository,
	characterRepository: CharacterRepository,
	playerRepository: PlayerRepository,
	gameStateRepository: GameStateRepository,
	voteRepository: VoteRepository,
	mysteryBoxService: MysteryBoxService,
	playerService: PlayerService,
	voteService: VoteService,
	gameStateService: GameStateService
} => {
	const mockDB = createMockDB();

	const mysteryBoxRepository = createMockMysteryBoxRepo(mockDB);
	const characterRepository = createMockCharacterRepo(mockDB);
	const playerRepository = createMockPlayerRepo(mockDB);
	const gameStateRepository = createMockGameStateRepo(mockDB);
	const voteRepository = createMockVoteRepo(mockDB);

	const mysteryBoxService = createMockMysteryBoxService(mysteryBoxRepository, characterRepository);

	const playerService = createMockPlayerService(playerRepository);

	const voteService = createMockVoteService(voteRepository, playerService);

	const gameStateService = createMockGameStateService(gameStateRepository, playerService, voteService);

	return {
		mockDB,

		mysteryBoxRepository,
		characterRepository,
		playerRepository,
		gameStateRepository,
		voteRepository,

		mysteryBoxService,
		playerService,
		voteService,
		gameStateService
	};
}

/**
 * Sets up a mock Namesmith server with mock repositories and services. This is
 * used by the event listeners to simulate the game state and player state
 * during testing.
 *
 * This function should be called before any of the event listeners are set up
 * and before any tests are run.
 */
export const setupMockNamesmith = () => {
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

	global.namesmith.mysteryBoxService = createMockMysteryBoxService(
		global.namesmith.mysteryBoxRepository,
		global.namesmith.characterRepository,
	);

	global.namesmith.playerService = createMockPlayerService(
		global.namesmith.playerRepository,
	);

	global.namesmith.voteService = createMockVoteService(
		global.namesmith.voteRepository,
		global.namesmith.playerService,
	);

	global.namesmith.gameStateService = createMockGameStateService(
		global.namesmith.gameStateRepository,
		global.namesmith.playerService,
		global.namesmith.voteService,
	);
}