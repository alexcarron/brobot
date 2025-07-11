const { createMockDB } = require("../database/mock-database");
const { createMockMysteryBoxRepo, createMockCharacterRepo, createMockPlayerRepo, createMockGameStateRepo, createMockVoteRepo } = require("../repositories/mock-repositories");
const { createMockMysteryBoxService, createMockPlayerService, createMockVoteService, createMockGameStateService } = require("../services/mock-services");

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

module.exports = { setupMockNamesmith };