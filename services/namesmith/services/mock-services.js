const { createMockPlayerRepo } = require("../repositories/mock-repositories");
const PlayerRepository = require("../repositories/player.repository");
const PlayerService = require("./player.service");

const createMockPlayerService = (mockPlayerRepo) => {
	if (mockPlayerRepo === undefined || !(mockPlayerRepo instanceof PlayerRepository))
		mockPlayerRepo = createMockPlayerRepo();

	return new PlayerService(mockPlayerRepo);
}

const createMockServices = (mockPlayerRepo) => ({
	playerService: createMockPlayerService(mockPlayerRepo)
});

module.exports = {
	createMockPlayerService,
	createMockServices
};