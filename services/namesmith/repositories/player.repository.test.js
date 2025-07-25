const { createMockPlayerRepo, mockPlayers } = require("./mock-repositories");
const PlayerRepository = require("./player.repository");

describe('PlayerRepository', () => {
	/**
	 * @type {PlayerRepository}
	 */
	let playerRepository;

	beforeEach(() => {
		playerRepository = createMockPlayerRepo();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

  describe('getPlayers()', () => {
    it('returns an array of player objects', () => {
      const result = playerRepository.getPlayers();
      expect(result).toEqual(mockPlayers);
    });
  });

  describe('getPlayerByID()', () => {
		it('returns a player object', () => {
			const result = playerRepository.getPlayerByID(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0]);
		});

		it('returns undefined if the player is not found', () => {
			const result = playerRepository.getPlayerByID("invalid-id");
			expect(result).toBeUndefined();
		});
  });

  describe('.doesPlayerExist()', () => {
		it('returns true if the player is found', () => {
			const result = playerRepository.doesPlayerExist(mockPlayers[0].id);
			expect(result).toBe(true);
		});

		it('returns false if the player is not found', () => {
			const result = playerRepository.doesPlayerExist("invalid-id");
			expect(result).toBe(false);
		});
  });

	describe('getPlayersWithoutPublishedNames()', () => {
		it('returns an array of player objects without a published name', () => {
			const result = playerRepository.getPlayersWithoutPublishedNames();

			expect(result).toEqual(
				mockPlayers.filter(player => player.publishedName === null)
			);
		});
	});

	describe('getInventory()', () => {
		it('returns the inventory of a player', () => {
			const result = playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getInventory("invalid-id")).toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('returns the current name of a player', () => {
			const result = playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getCurrentName("invalid-id")).toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('changes the current name of a player', () => {
			playerRepository.changeCurrentName(mockPlayers[0].id, "new name");
			const result = playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.changeCurrentName("invalid-id", "new name")).toThrow();
		});

		it('throws an error if the new name is too long', () => {
			expect(() => playerRepository.changeCurrentName(mockPlayers[1].id, "a".repeat(33))).toThrow();
		});

		it('throws an error if the new name is empty', () => {
			expect(() => playerRepository.changeCurrentName(mockPlayers[1].id)).toThrow();
		});
	});

	describe('getPublishedName()', () => {
		it('returns the published name of a player', () => {
			const result = playerRepository.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].publishedName);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getPublishedName("invalid-id")).toThrow();
		});
	});

	describe('publishName()', () => {
		it('changes the published name of a player', () => {
			playerRepository.publishName(mockPlayers[0].id, "new name");
			const result = playerRepository.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.publishName("invalid-id", "new name")).toThrow();
		});

		it('throws an error if the new name is too long', () => {
			expect(() => playerRepository.publishName(mockPlayers[1].id, "a".repeat(33))).toThrow();
		});

		it('throws an error if the new name is empty', () => {
			expect(() => playerRepository.publishName(mockPlayers[1].id)).toThrow();
		});
	});

	describe('addPlayer()', () => {
		it('adds a new player to the database', () => {
			playerRepository.addPlayer("new-player-id");

			const result = playerRepository.getPlayerByID("new-player-id");

			expect(result).toEqual({
				id: "new-player-id",
				currentName: "",
				publishedName: null,
				tokens: 0,
				role: null,
				inventory: "",
			});
		});

		it('throws an error if the player already exists', () => {
			expect(() => playerRepository.addPlayer(mockPlayers[0].id)).toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the player repository', () => {
			playerRepository.reset();
			const result = playerRepository.getPlayers();
			expect(result).toEqual([]);
		});
	});

	describe('addCharacterToInventory', () => {
		it('adds a character to the player inventory', () => {
			playerRepository.addCharacterToInventory(mockPlayers[0].id, "A");
			const result = playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual(
				mockPlayers[0].inventory + "A"
			);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.addCharacterToInventory("invalid-id", "A")).toThrow();
		});

		it('throws an error if the character does not exist', () => {
			expect(() => playerRepository.addCharacterToInventory(mockPlayers[0].id)).toThrow();
		});

		it('throws an error if the character is too long', () => {
			expect(() => playerRepository.addCharacterToInventory(mockPlayers[1].id, "aa")).toThrow();
		});
	})
});