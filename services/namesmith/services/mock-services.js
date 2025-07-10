const { createMockPlayerRepo, createMockVoteRepo } = require("../repositories/mock-repositories");
const PlayerRepository = require("../repositories/player.repository");
const VoteRepository = require("../repositories/vote.repository");
const PlayerService = require("./player.service");
const VoteService = require("./vote.service");

/**
 * Creates a mock PlayerService instance for testing purposes.
 *
 * If the mockPlayerRepo argument is not provided, a mock player repository is created using the createMockPlayerRepo
 * function from the mock-repositories module.
 *
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
 *
 * If the mockVoteRepo argument is not provided, a mock vote repository is created using the createMockVoteRepo
 * function from the mock-repositories module.
 *
 * @param {VoteRepository} [mockVoteRepo] - The mock vote repository to use.
 * @returns {VoteService} A mock instance of the VoteService.
 */
const createMockVoteService = (mockVoteRepo, mockPlayerService) => {
	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	if (mockPlayerService === undefined || !(mockPlayerService instanceof PlayerService))
		mockPlayerService = createMockPlayerService();

	return new VoteService(mockVoteRepo, mockPlayerService);
};

const createMockServices = ({mockPlayerRepo, mockVoteRepo}) => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	const playerService = createMockPlayerService(mockPlayerRepo);

	return {
		playerService: playerService,
		voteService: createMockVoteService(mockVoteRepo, playerService),
	}
};

module.exports = {
	createMockPlayerService,
	createMockVoteService,
	createMockServices
};