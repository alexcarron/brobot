const DatabaseQuerier = require("../database/database-querier");
const { createMockDB } = require("../database/mock-database");
const { CharacterRepository } = require("../repositories/character.repository");
const { GameStateRepository } = require("../repositories/gameState.repository");
const { createMockMysteryBoxRepo, createMockCharacterRepo, createMockPlayerRepo, createMockGameStateRepo, createMockVoteRepo } = require("../repositories/mock-repositories");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const VoteRepository = require("../repositories/vote.repository");
const GameStateService = require("../services/gameState.service");
const { createMockMysteryBoxService, createMockPlayerService, createMockVoteService, createMockGameStateService } = require("../services/mock-services");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");
const VoteService = require("../services/vote.service");

/**
 * Creates all the mock services and repositories needed for testing.
 * @returns {{mockDB: DatabaseQuerier, mysteryBoxRepository: MysteryBoxRepository, characterRepository: CharacterRepository, playerRepository: PlayerRepository, gameStateRepository: GameStateRepository, voteRepository: VoteRepository, mysteryBoxService: MysteryBoxService, playerService: PlayerService, voteService: VoteService, gameStateService: GameStateService}} An object containing all the mock services and repositories.
 */
const createAllMocks = () => {
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
const setupMockNamesmith = () => {
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

module.exports = { setupMockNamesmith, createAllMocks };