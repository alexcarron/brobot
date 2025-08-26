import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../database/mock-database";
import { createMockPlayerRepo, mockPlayers } from "./mock-repositories";
import { PlayerRepository } from "./player.repository";

describe('PlayerRepository', () => {
	let playerRepository: PlayerRepository;
	let db: DatabaseQuerier;

	beforeEach(() => {
		playerRepository = createMockPlayerRepo();
		db = playerRepository.db;
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

		it('returns null if the player is not found', () => {
			const result = playerRepository.getPlayerByID("invalid-id");
			expect(result).toBeNull();
		});
  });

	describe('getPlayersByCurrentName()', () => {
		it('should return an array of both players with the same current name', () => {
			const sameNamePlayer = addMockPlayer(db, {
				currentName: mockPlayers[0].currentName,
			});

			const result = playerRepository.getPlayersByCurrentName(mockPlayers[0].currentName);

			expect(result).toEqual([mockPlayers[0], sameNamePlayer]);
		})

		it('should return an array of a single player with the same current name', () => {
			const result = playerRepository.getPlayersByCurrentName(mockPlayers[0].currentName);

			expect(result).toEqual([mockPlayers[0]]);
		});

		it('should return an empty array if no players have the same current name', () => {
			const result = playerRepository.getPlayersByCurrentName("invalid-name");

			expect(result).toEqual([]);
		});
	})

  describe('doesPlayerExist()', () => {
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

	describe('setInventory()', () => {
		it('sets the inventory of a player', () => {
			playerRepository.setInventory(mockPlayers[0].id, "new inventory");
			const result = playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual("new inventory");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setInventory("invalid-id", "new inventory")).toThrow();
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

		it('throws an error if the character is too long', () => {
			expect(() => playerRepository.addCharacterToInventory(mockPlayers[1].id, "aa")).toThrow();
		});
	})
});