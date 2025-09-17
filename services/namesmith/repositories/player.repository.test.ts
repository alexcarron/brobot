import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, mockPlayers } from "../mocks/mock-data/mock-players";
import { createMockPlayerRepo } from "../mocks/mock-repositories";
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
			const result = playerRepository.getPlayerByID(INVALID_PLAYER_ID);
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
			const result = playerRepository.doesPlayerExist(INVALID_PLAYER_ID);
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

	describe('getPlayersWithPublishedNames()', () => {
		it('returns an array of player objects with a published name', () => {
			const result = playerRepository.getPlayersWithPublishedNames();

			expect(result).toEqual(
				mockPlayers.filter(player => player.publishedName !== null)
			);
		});
	})

	describe('getInventory()', () => {
		it('returns the inventory of a player', () => {
			const result = playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getInventory(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('setInventory()', () => {
		it('sets the inventory of a player', () => {
			playerRepository.setInventory(mockPlayers[0].id, "new inventory");
			const result = playerRepository.getInventory(mockPlayers[0].id);
			expect(result).toEqual("new inventory");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setInventory(INVALID_PLAYER_ID, "new inventory")).toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('returns the current name of a player', () => {
			const result = playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getCurrentName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('changes the current name of a player', () => {
			playerRepository.changeCurrentName(mockPlayers[0].id, "new name");
			const result = playerRepository.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.changeCurrentName(INVALID_PLAYER_ID, "new name")).toThrow();
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
			expect(() => playerRepository.getPublishedName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('publishName()', () => {
		it('changes the published name of a player', () => {
			playerRepository.publishName(mockPlayers[0].id, "new name");
			const result = playerRepository.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.publishName(INVALID_PLAYER_ID, "new name")).toThrow();
		});

		it('throws an error if the new name is too long', () => {
			expect(() => playerRepository.publishName(mockPlayers[1].id, "a".repeat(33))).toThrow();
		});
	});

	describe('getTokens()', () => {
		it('returns the number of tokens a player has', () => {
			const result = playerRepository.getTokens(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].tokens);
		});

		it('returns a large amount of tokens a player has', () => {
			const mockPlayer = addMockPlayer(db, {
				tokens: 928831923
			});

			const result = playerRepository.getTokens(mockPlayer.id);
			expect(result).toEqual(928831923);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getTokens(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('setTokens()', () => {
		it('sets the number of tokens a player has', () => {
			playerRepository.setTokens(mockPlayers[0].id, 500);
			const result = playerRepository.getTokens(mockPlayers[0].id);
			expect(result).toEqual(500);
		});

		it('throws error if the number of tokens is negative', () => {
			expect(() => playerRepository.setTokens(mockPlayers[0].id, -500)).toThrow();
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setTokens(INVALID_PLAYER_ID, 500)).toThrow();
		});
	});

	describe('getLastClaimedRefillTime()', () => {
		it('returns the last claimed refill time of a player', () => {
			const result = playerRepository.getLastClaimedRefillTime(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].lastClaimedRefillTime);
		});

		it('returns the date of a player that has claimed a refill', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime: new Date()
			});

			const result = playerRepository.getLastClaimedRefillTime(mockPlayer.id);
			expect(result).toEqual(mockPlayer.lastClaimedRefillTime);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getLastClaimedRefillTime(INVALID_PLAYER_ID)).toThrow();
		})
	})

	describe('setLastClaimedRefillTime()', () => {
		it('sets the last claimed refill time of a player to a date', () => {
			const DATE = new Date();
			playerRepository.setLastClaimedRefillTime(mockPlayers[0].id, DATE);
			const result = playerRepository.getLastClaimedRefillTime(mockPlayers[0].id);
			expect(result).toEqual(DATE);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setLastClaimedRefillTime(INVALID_PLAYER_ID, new Date())).toThrow();
		})
	})

	describe('addPlayer()', () => {
		it('adds a new player to the database', () => {
			playerRepository.createPlayer("new-player-id");

			const result = playerRepository.getPlayerByID("new-player-id");

			expect(result).toEqual({
				id: "new-player-id",
				currentName: "",
				publishedName: null,
				tokens: 0,
				role: null,
				inventory: "",
				lastClaimedRefillTime: null
			});
		});

		it('throws an error if the player already exists', () => {
			expect(() => playerRepository.createPlayer(mockPlayers[0].id)).toThrow();
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
			expect(() => playerRepository.addCharacterToInventory(INVALID_PLAYER_ID, "A")).toThrow();
		});

		it('throws an error if the character is too long', () => {
			expect(() => playerRepository.addCharacterToInventory(mockPlayers[1].id, "aa")).toThrow();
		});
	})
});