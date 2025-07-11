const { mockPlayers } = require("../repositories/mock-repositories");
const PlayerRepository = require("../repositories/player.repository");
const { changeDiscordNameOfPlayer, sendToPublishedNamesChannel, sendToNamesToVoteOnChannel, isNonPlayer, resetMemberToNewPlayer } = require("../utilities/discord-action.utility");
const { fetchNamesmithGuildMembers } = require("../utilities/discord-fetch.utility");
const { createMockPlayerService } = require("./mock-services");
const PlayerService = require("./player.service");

jest.mock("../utilities/discord-action.utility", () => ({
	changeDiscordNameOfPlayer: jest.fn(),
	sendToPublishedNamesChannel: jest.fn(),
	sendToNamesToVoteOnChannel: jest.fn(),
	isNonPlayer: jest.fn((member) => Promise.resolve(
		member.isPlayer === undefined ?
			false :
			!member.isPlayer
	)),
	resetMemberToNewPlayer: jest.fn(),
}));

jest.mock("../utilities/discord-fetch.utility", () => ({
	fetchNamesmithGuildMember: jest.fn( (playerID) =>
		Promise.resolve({ id: playerID })
	),
	fetchNamesmithGuildMembers: jest.fn(() =>
		Promise.resolve(mockPlayers.map((player) => ({ id: player.id })))
	),
}));

jest.mock("../../../utilities/discord-action-utils", () => ({
	addButtonToMessageContents: jest.fn(),
}));

describe('PlayerService', () => {
	/**
	 * @type {PlayerService}
	 */
	let playerService;

	beforeEach(() => {
		playerService = createMockPlayerService();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	})

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

		it('should change the current name to an empty name', async () => {
			await playerService.changeCurrentName(mockPlayers[0].id, "");
			const result = await playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				"ˑ"
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

	describe('.addCharacterToName()', () => {
		it('should add a character to the current name of a player', async () => {
			await playerService.addCharacterToName(mockPlayers[0].id, "a");
			const currentName = await playerService.getCurrentName(mockPlayers[0].id);
			const inventory = await playerService.getInventory(mockPlayers[0].id);
			expect(currentName).toEqual(mockPlayers[0].currentName + "a");
			expect(inventory).toEqual(mockPlayers[0].inventory + "a");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				mockPlayers[0].currentName + "a"
			);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.addCharacterToName("invalid-id", "a")).rejects.toThrow();
		});

		it('should throw an error if the character is too long', async () => {
			await expect(playerService.addCharacterToName(mockPlayers[1].id, "aa")).rejects.toThrow();
		});

		it('should throw an error if the character does not exist', async () => {
			await expect(playerService.addCharacterToName(mockPlayers[1].id)).rejects.toThrow();
		});
	});

	describe(".getPublishedName()", () => {
		it("should return the published name of a player", async () => {
			const result = await playerService.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].publishedName);
		});

		it("should throw an error if the player is not found", async () => {
			await expect(playerService.getPublishedName("invalid-id")).rejects.toThrow();
		});
	});

	describe(".publishName()", () => {
		it("should publish the player's current name", async () => {
			await playerService.publishName(mockPlayers[2].id);

			const publishedName = await playerService.getPublishedName(mockPlayers[2].id);
			expect(publishedName).toEqual(mockPlayers[2].currentName);
			expect(sendToPublishedNamesChannel).toHaveBeenCalled();
		});

		it("should throw an error if the player is not found", async () => {
			await expect(playerService.publishName("invalid-id", "new name")).rejects.toThrow();
		});

		it("should not publish name if it is an empty string", async () => {
			await playerService.changeCurrentName(mockPlayers[1].id, "");
			await playerService.publishName(mockPlayers[1].id);

			const publishedName = await playerService.getPublishedName(mockPlayers[1].id);
			expect(publishedName).toEqual(mockPlayers[1].publishedName);
			expect(sendToPublishedNamesChannel).not.toHaveBeenCalled();
		});
	});

	describe('.publishUnpublishedNames()', () => {
		it('should publish all unpublished names', async () => {
			await playerService.publishUnpublishedNames();

			for (const player of mockPlayers) {
				if (!player.publishedName) {
					const publishedName = await playerService.getPublishedName(player.id);
					expect(publishedName).toEqual(player.currentName);
				}
			}
		});
	});

	describe('.finalizeName()', () => {
		it('should change current name of player to their published name when they have one', async () => {
			await playerService.finalizeName(mockPlayers[1].id);
			const currentName = await playerService.getCurrentName(mockPlayers[1].id);
			expect(currentName).toEqual(mockPlayers[1].publishedName);
			expect(sendToNamesToVoteOnChannel).toHaveBeenCalled();
		});

		it('should not change current name of player to their published name when they don\'t have one', async () => {
			await playerService.finalizeName(mockPlayers[2].id);
			const currentName = await playerService.getCurrentName(mockPlayers[2].id);
			const publishedName = await playerService.getPublishedName(mockPlayers[2].id);
			expect(currentName).toEqual(mockPlayers[2].currentName);
			expect(publishedName).toEqual(mockPlayers[2].publishedName);
			expect(sendToNamesToVoteOnChannel).not.toHaveBeenCalled();
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.finalizeName("invalid-id")).rejects.toThrow();
		});
	});

	describe('.finalizeAllNames()', () => {
		it('should finalize all names', async () => {
			await playerService.finalizeAllNames();
			for (const player of mockPlayers) {
				if (player.publishedName === null) continue;
				const currentName = await playerService.getCurrentName(player.id);
				const publishedName = await playerService.getPublishedName(player.id);
				expect(currentName).toEqual(publishedName);
			}
		});
	});

	describe('.addNewPlayer()', () => {
		it('should add a new player', async () => {
			await playerService.addNewPlayer("new-player-id");
			const players = await playerService.playerRepository.getPlayers();
			expect(players.length).toBe(mockPlayers.length + 1);

			const mockMember = {
				id: "new-player-id",
			}
			expect(resetMemberToNewPlayer).toHaveBeenCalledWith(mockMember, expect.anything());
		});

		it('should throw an error if the player already exists', async () => {
			await expect(playerService.addNewPlayer(mockPlayers[0].id)).rejects.toThrow();
			expect(resetMemberToNewPlayer).not.toHaveBeenCalled();
			const players = await playerService.playerRepository.getPlayers();
			expect(players.length).toBe(mockPlayers.length);
		});

		it('should throw an error if the ID is invalid', async () => {
			await expect(playerService.addNewPlayer(1234567899)).rejects.toThrow();
			expect(resetMemberToNewPlayer).not.toHaveBeenCalled();
			const players = await playerService.playerRepository.getPlayers();
			expect(players.length).toBe(mockPlayers.length);
		});
	});

	describe('.addEveryoneInServer()', () => {
		it('should add all players in the server', async () => {
			jest.spyOn(playerService, 'addNewPlayer');
			fetchNamesmithGuildMembers.mockResolvedValue([
				{ id: "1", isPlayer: true },
				{ id: "2", isPlayer: true },
				{ id: "3", isPlayer: false },
			]);

			await playerService.addEveryoneInServer();

			expect(playerService.addNewPlayer).toHaveBeenCalledWith("1");
			expect(playerService.addNewPlayer).toHaveBeenCalledWith("2");
			expect(playerService.addNewPlayer).not.toHaveBeenCalledWith("3");
		});

		it('should skip players that already exist', async () => {
			jest.spyOn(playerService, 'addNewPlayer');

			fetchNamesmithGuildMembers.mockResolvedValue([
				{ id: mockPlayers[0].id, isPlayer: true },
				{ id: mockPlayers[1].id, isPlayer: true },
				{ id: mockPlayers[2].id, isPlayer: true },
				{ id: "3", isPlayer: true },
			]);

			await playerService.addEveryoneInServer();

			expect(playerService.addNewPlayer).not.toHaveBeenCalledWith(mockPlayers[0].id);
			expect(playerService.addNewPlayer).not.toHaveBeenCalledWith(mockPlayers[1].id);
			expect(playerService.addNewPlayer).not.toHaveBeenCalledWith(mockPlayers[2].id);
			expect(playerService.addNewPlayer).toHaveBeenCalledWith("3");
		});
	});

	describe('.reset()', () => {
		it('should reset the player repository', async () => {
			await playerService.reset();
			const players = await playerService.playerRepository.getPlayers();
			expect(players.length).toBe(0);
			expect(playerService.getCurrentName(mockPlayers[0].id)).rejects.toThrow();
		});
	});
});