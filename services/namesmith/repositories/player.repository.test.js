const { createMockDB, addMockPlayer } = require("../database/mock-database");
const PlayerRepository = require("./player.repository");

describe('PlayerRepository', () => {
	let mockDB;

	/**
	 * @type {PlayerRepository}
	 */
	let playerRepository;

	const mockPlayers = [
		{
			id: "1234567890",
			currentName: "John Doe",
			publishedName: "John Doe",
			tokens: 10,
			role: "magician",
			inventory: "John Doe",
		},
		{
			id: "1234567891",
			currentName: "abcdefgh",
			publishedName: "abcd",
			tokens: 0,
			role: "magician",
			inventory: "abcdefghijklmnopqrstuvwxyz",
		},
		{
			id: "1234567892",
			currentName: "UNPUBLISHED",
			publishedName: null,
			tokens: 0,
			role: "magician",
			inventory: "UNPUBLISHED",
		}
	];

	beforeEach(() => {
		mockDB = createMockDB();
		playerRepository = new PlayerRepository(mockDB);
		for (const player of mockPlayers) {
			addMockPlayer(mockDB, player);
		}
	});

  describe('getPlayers()', () => {
    it('returns an array of player objects', async () => {
      const result = await playerRepository.getPlayers();
      expect(result).toEqual(mockPlayers);
    });
  });

  describe('getPlayerByID()', () => {
		it('returns a player object', async () => {
			const result = await playerRepository.getPlayerByID(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0]);
		});

		it('returns undefined if the player is not found', async () => {
			const result = await playerRepository.getPlayerByID("invalid-id");
			expect(result).toBeUndefined();
		});
  });

	describe('getPlayersWithoutPublishedNames()', () => {
		it('returns an array of player objects without a published name', async () => {
			const result = await playerRepository.getPlayersWithoutPublishedNames();

			expect(result).toEqual(
				mockPlayers.filter(player => player.publishedName === null)
			);
		});
	});

	describe('getInventory()', () => {
		it('returns the inventory of a player', async () => {
			const result = await playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.getInventory("invalid-id")).rejects.toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('returns the current name of a player', async () => {
			const result = await playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.getCurrentName("invalid-id")).rejects.toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('changes the current name of a player', async () => {
			await playerRepository.changeCurrentName(mockPlayers[0].id, "new name");
			const result = await playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.changeCurrentName("invalid-id", "new name")).rejects.toThrow();
		});

		it('throws an error if the new name is too long', async () => {
			await expect(playerRepository.changeCurrentName(mockPlayers[1].id, "a".repeat(33))).rejects.toThrow();
		});

		it('throws an error if the new name is empty', async () => {
			await expect(playerRepository.changeCurrentName(mockPlayers[1].id)).rejects.toThrow();
		});
	});

	describe('getPublishedName()', () => {
		it('returns the published name of a player', async () => {
			const result = await playerRepository.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].publishedName);
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.getPublishedName("invalid-id")).rejects.toThrow();
		});
	});

	describe('publishName()', () => {
		it('changes the published name of a player', async () => {
			await playerRepository.publishName(mockPlayers[0].id, "new name");
			const result = await playerRepository.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.publishName("invalid-id", "new name")).rejects.toThrow();
		});

		it('throws an error if the new name is too long', async () => {
			await expect(playerRepository.publishName(mockPlayers[1].id, "a".repeat(33))).rejects.toThrow();
		});

		it('throws an error if the new name is empty', async () => {
			await expect(playerRepository.publishName(mockPlayers[1].id)).rejects.toThrow();
		});
	});

	describe('addPlayer()', () => {
		it('adds a new player to the database', async () => {
			await playerRepository.addPlayer("new-player-id");

			const result = await playerRepository.getPlayerByID("new-player-id");

			expect(result).toEqual({
				id: "new-player-id",
				currentName: "",
				publishedName: null,
				tokens: 0,
				role: null,
				inventory: "",
			});
		});

		it('throws an error if the player already exists', async () => {
			await expect(playerRepository.addPlayer(mockPlayers[0].id)).rejects.toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the player repository', async () => {
			await playerRepository.reset();
			const result = await playerRepository.getPlayers();
			expect(result).toEqual([]);
		});
	});

	describe('addCharacterToInventory', () => {
		it('adds a character to the player inventory', async () => {
			await playerRepository.addCharacterToInventory(mockPlayers[0].id, "A");
			const result = await playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual(
				mockPlayers[0].inventory + "A"
			);
		});

		it('throws an error if the player is not found', async () => {
			await expect(playerRepository.addCharacterToInventory("invalid-id", "A")).rejects.toThrow();
		});

		it('throws an error if the character does not exist', async () => {
			await expect(playerRepository.addCharacterToInventory(mockPlayers[0].id)).rejects.toThrow();
		});

		it('throws an error if the character is too long', async () => {
			await expect(playerRepository.addCharacterToInventory(mockPlayers[1].id, "aa")).rejects.toThrow();
		});
	})
});