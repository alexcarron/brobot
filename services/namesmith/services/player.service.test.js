const { createMockDB } = require("../database/mock-database");
const PlayerRepository = require("../repositories/player.repository");
const PlayerService = require("./player.service");

describe('PlayerService', () => {
	let playerService;

	beforeEach(() => {
		const mockDB = createMockDB();
		const mockPlayerRepository = new PlayerRepository(mockDB);

		// Add reusable dummy player data

		jest.spyOn(mockPlayerRepository, 'getInventory');
		playerService = new PlayerService(mockPlayerRepository);
	});

	describe('constructor', () => {
		it('should create a new PlayerService instance', () => {
			expect(playerService).toBeInstanceOf(PlayerService);
			expect(playerService.playerRepository).toBeInstanceOf(PlayerRepository);
		});
	});

	describe('.getInventory()', () => {
		it('should return the inventory of a player', async () => {
			await playerService.getInventory('1234567890');
			expect(playerService.playerRepository.getInventory).toHaveBeenCalledWith('1234567890');
		});
	});
});