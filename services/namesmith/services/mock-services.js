const { CharacterRepository } = require("../repositories/character.repository");
const GameStateRepository = require("../repositories/gameState.repository");
const { createMockPlayerRepo, createMockVoteRepo, createMockMysteryBoxRepo, createMockCharacterRepo, createMockGameStateRepo } = require("../repositories/mock-repositories");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const VoteRepository = require("../repositories/vote.repository");
const GameStateService = require("./gameState.service");
const MysteryBoxService = require("./mysteryBox.service");
const PlayerService = require("./player.service");
const VoteService = require("./vote.service");

/**
 * Creates a mock GameStateService instance for testing purposes.
 * @param {GameStateRepository} gameStateRepository - The mock game state repository to use.
 * @param {PlayerService} playerService - The mock player service to use.
 * @param {VoteService} voteService - The mock vote service to use.
 * @returns {GameStateService} A mock instance of the GameStateService.
 */
const createMockGameStateService = (gameStateRepository, playerService, voteService) => {
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
 * @param {PlayerRepository} [mockPlayerRepo] - The mock player repository to use.
 * @returns {PlayerService} A mock instance of the PlayerService.
 */
const createMockPlayerService = (mockPlayerRepo) => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	return new PlayerService(mockPlayerRepo);
}

/**
 * Creates a mock VoteService instance for testing purposes.
 * @param {VoteRepository} mockVoteRepo - The mock vote repository to use.
 * @param {PlayerService} mockPlayerService - The mock player service to use.
 * @returns {VoteService} A mock instance of the VoteService.
 */
const createMockVoteService = (mockVoteRepo, mockPlayerService) => {
	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	if (mockPlayerService === undefined || !(mockPlayerService instanceof PlayerService))
		mockPlayerService = createMockPlayerService();

	return new VoteService(mockVoteRepo, mockPlayerService);
};

/**
 * Creates a mock MysteryBoxService instance for testing purposes.
 * @param {MysteryBoxRepository} [mockMysteryBoxRepository] - The mock mystery box repository to use.
 * @param {CharacterRepository} [mockCharacterRepository] - The mock character repository to use.
 * @returns {MysteryBoxService} A mock instance of the MysteryBoxService.
 */
const createMockMysteryBoxService = (mockMysteryBoxRepository, mockCharacterRepository) => {
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
 * @param {{mockPlayerRepo: PlayerRepository, mockVoteRepo: VoteRepository, mockMysteryBoxRepo: MysteryBoxRepository, mockCharacterRepo: CharacterRepository, gameStateRepository: GameStateRepository}} options - An object with the mock repository instances to use.
 * @returns {{playerService: PlayerService, voteService: VoteService, mysteryBoxService: MysteryBoxService, gameStateService: GameStateService}} An object with the created mock service instances.
 */
const createMockServices = ({mockPlayerRepo, mockVoteRepo, mockMysteryBoxRepo, mockCharacterRepo, gameStateRepository} = {}) => {
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

module.exports = {
	createMockPlayerService,
	createMockVoteService,
	createMockMysteryBoxService,
	createMockGameStateService,
	createMockServices,
};