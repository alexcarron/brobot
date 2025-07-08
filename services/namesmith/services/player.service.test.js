const { createMockDB } = require("../database/mock-database");
const { mockPlayers } = require("../repositories/mock-repositories");
const PlayerRepository = require("../repositories/player.repository");
const { changeDiscordNameOfPlayer } = require("../utilities/discord-action.utility");
const { createMockPlayerService } = require("./mock-services");
const PlayerService = require("./player.service");

jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn()
}));


describe('PlayerService', () => {
	let playerService;

	beforeEach(() => {
		playerService = createMockPlayerService();
	});

	describe('constructor', () => {
		it('should create a new PlayerService instance', () => {
			expect(playerService).toBeInstanceOf(PlayerService);
			expect(playerService.playerRepository).toBeInstanceOf(PlayerRepository);
		});
	});

	describe('.getInventory()', () => {
		it('should return the inventory of a player', async () => {
			const result = await playerService.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.getInventory("invalid-id")).rejects.toThrow();
		});
	});

	describe('.getCurrentName()', () => {
		it('should return the current name of a player', async () => {
			const result = await playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.getCurrentName("invalid-id")).rejects.toThrow();
		});
	});

	describe('.changeCurrentName()', () => {

		it('should change the current name of a player', async () => {
			await playerService.changeCurrentName(mockPlayers[0].id, "new name");
			const result = await playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				"new name"
			);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.changeCurrentName("invalid-id", "new name")).rejects.toThrow();
		});

		it('should throw an error if the new name is too long', async () => {
			await expect(playerService.changeCurrentName(mockPlayers[1].id, "a".repeat(33))).rejects.toThrow();
		});

		it('should throw an error if the new name is empty', async () => {
			await expect(playerService.changeCurrentName(mockPlayers[1].id)).rejects.toThrow();
		});
	});
});