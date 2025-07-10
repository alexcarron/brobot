const CharacterRepository = require("../repositories/character.repository");
const { createMockPlayerRepo, createMockVoteRepo, createMockMysteryBoxRepo, createMockCharacterRepo } = require("../repositories/mock-repositories");
const MysteryBoxRepository = require("../repositories/mysteryBox.repository");
const PlayerRepository = require("../repositories/player.repository");
const VoteRepository = require("../repositories/vote.repository");
const MysteryBoxService = require("./mysteryBox.service");
const PlayerService = require("./player.service");
const VoteService = require("./vote.service");

/**
 * Creates a mock PlayerService instance for testing purposes.
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

/**
 * Creates a mock MysteryBoxService instance for testing purposes.
 *
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

const createMockServices = ({mockPlayerRepo, mockVoteRepo, mockMysteryBoxRepo, mockCharacterRepo}) => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	if (mockVoteRepo === undefined || !(mockVoteRepo instanceof VoteRepository))
		mockVoteRepo = createMockVoteRepo();

	if (mockMysteryBoxRepo === undefined || !(mockMysteryBoxRepo instanceof MysteryBoxRepository))
		mockMysteryBoxRepo = createMockMysteryBoxRepo();

	if (mockCharacterRepo === undefined || !(mockCharacterRepo instanceof CharacterRepository))
		mockCharacterRepo = createMockCharacterRepo();

	const playerService = createMockPlayerService(mockPlayerRepo);

	return {
		playerService: playerService,
		voteService: createMockVoteService(mockVoteRepo, playerService),
		mysteryBoxService: createMockMysteryBoxService(mockMysteryBoxRepo, mockCharacterRepo)
	}
};

module.exports = {
	createMockPlayerService,
	createMockVoteService,
	createMockMysteryBoxService,
	createMockServices,
};