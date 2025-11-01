import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { Roles } from "../constants/roles.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer, mockPlayers } from "../mocks/mock-data/mock-players";
import { createMockPlayerRepo } from "../mocks/mock-repositories";
import { PlayerAlreadyExistsError, PlayerNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";

describe('PlayerRepository', () => {
	let playerRepository: PlayerRepository;
	let db: DatabaseQuerier;

	const SOME_ROLE = Roles.PROSPECTOR;

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

		it('should not throw error if the number of tokens is negative', () => {
			expect(() => playerRepository.setTokens(mockPlayers[0].id, -500)).not.toThrow();
		});

		it('throws an error if the player is not found', () => {
			makeSure(() => playerRepository.setTokens(INVALID_PLAYER_ID, 500)).throws(PlayerNotFoundError);
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
	});

	describe('getRoleID()', () => {
		it('returns the role ID of a player', () => {
			const player = addMockPlayer(db, {
				role: SOME_ROLE.id,
			});

			const result = playerRepository.getRoleID(player.id);
			expect(result).toEqual(SOME_ROLE.id);
		});

		it('returns the null role ID of a player', () => {
			const result = playerRepository.getRoleID(mockPlayers[0].id);
			expect(result).toBeNull();
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getRoleID(INVALID_PLAYER_ID)).toThrow(PlayerNotFoundError);
		});
	});

	describe('setRoleID()', () => {
		it('sets the role ID of a player', () => {
			playerRepository.setRoleID(mockPlayers[0].id, 1);
			const result = playerRepository.getRoleID(mockPlayers[0].id);
			expect(result).toEqual(1);
		});

		it('sets the role ID of a player to null', () => {
			playerRepository.setRoleID(mockPlayers[0].id, null);
			const result = playerRepository.getRoleID(mockPlayers[0].id);
			expect(result).toBeNull();
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setRoleID(INVALID_PLAYER_ID, 1)).toThrow();
		});
	})

	describe('createPlayer()', () => {
		it('adds a new player to the database', () => {
			playerRepository.createPlayer("new-player-id");

			const result = playerRepository.getPlayerByID("new-player-id");

			expect(result).toEqual({
				id: "new-player-id",
				currentName: "",
				publishedName: null,
				tokens: 0,
				role: null,
				perks: [],
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
	});

	describe('removePlayer()', () => {
		it('removes a player from the database', () => {
			playerRepository.removePlayer(mockPlayers[0].id);
			const maybePlayer = playerRepository.getPlayerByID(mockPlayers[0].id);
			makeSure(maybePlayer).isNull();
		});

		it('throws a PlayerNotFoundError if the player is not found', () => {
			makeSure(() =>
				playerRepository.removePlayer(INVALID_PLAYER_ID)
			).throws(PlayerNotFoundError);
		});
	});

	describe('addPlayer()', () => {
		it('adds a player with minimal fields', () => {
			const player = playerRepository.addPlayer({
				id: "new-player-id",
				currentName: "test",
				publishedName: "test",
				tokens: 0,
				inventory: "",
				lastClaimedRefillTime: null,
				role: null,
				perks: [],
			});

			makeSure(player).toEqual({
				id: "new-player-id",
				currentName: "test",
				publishedName: "test",
				tokens: 0,
				inventory: "",
				lastClaimedRefillTime: null,
				role: null,
				perks: [],
			});

			const resolvedPlayer = playerRepository.getPlayerOrThrow("new-player-id");
			makeSure(resolvedPlayer).is(player);
		});

		it('adds player with complex values for all fields', () => {
			const player = playerRepository.addPlayer({
				id: "new-player-id",
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z'),
				role: Roles.FORTUNE_SEEKER,
				perks: [Perks.DISCOUNT.id, Perks.FASTER_REFILL.name],
			});

			makeSure(player).includesObject({
				id: "new-player-id",
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z')
			});

			makeSure(player.role?.id).is(Roles.FORTUNE_SEEKER.id);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);

			const resolvedPlayer = playerRepository.getPlayerOrThrow("new-player-id");
			makeSure(resolvedPlayer).is(player);
		})

		it('generated an id if not provided', () => {
			const player = playerRepository.addPlayer({
				currentName: "test",
				publishedName: "test",
				tokens: 0,
				inventory: "",
				lastClaimedRefillTime: null,
				role: null,
				perks: [],
			});

			const resolvedPlayer = playerRepository.getPlayerOrThrow(player.id);
			makeSure(resolvedPlayer).is(player);
		});

		it('throws a PlayerAlreadyExistsError if the player already exists', () => {
			makeSure(() =>
				playerRepository.addPlayer({
					id: mockPlayers[0].id,
					currentName: "test",
					publishedName: "test",
					tokens: 0,
					inventory: "",
					lastClaimedRefillTime: null,
					role: null,
					perks: [],
				})
			).throws(PlayerAlreadyExistsError);
		});
	});

	describe('updatePlayer()', () => {
		it('updates a player in the database with minimal fields', () => {
			const player = playerRepository.updatePlayer({
				id: mockPlayers[0].id,
				currentName: "test",
			});

			makeSure(player).toEqual({
				id: mockPlayers[0].id,
				currentName: "test",
				publishedName: mockPlayers[0].publishedName,
				tokens: mockPlayers[0].tokens,
				inventory: mockPlayers[0].inventory,
				lastClaimedRefillTime: mockPlayers[0].lastClaimedRefillTime,
				role: mockPlayers[0].role,
				perks: mockPlayers[0].perks,
			});

			const resolvedPlayer = playerRepository.getPlayerOrThrow(mockPlayers[0].id);
			makeSure(resolvedPlayer).is(player);
		});

		it('updates a player in the database with complex values for all fields', () => {
			const player = playerRepository.updatePlayer({
				id: mockPlayers[0].id,
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z'),
				role: Roles.FORTUNE_SEEKER,
				perks: [Perks.DISCOUNT.id, Perks.FASTER_REFILL.name],
			});

			makeSure(player).includesObject({
				id: mockPlayers[0].id,
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z')
			});

			makeSure(player.role?.id).is(Roles.FORTUNE_SEEKER.id);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);

			const resolvedPlayer = playerRepository.getPlayerOrThrow(mockPlayers[0].id);
			makeSure(resolvedPlayer).is(player);
		});

		it('throws a PlayerNotFoundError if the player does not exist', () => {
			makeSure(() =>
				playerRepository.updatePlayer({
					id: INVALID_PLAYER_ID,
					currentName: "test",
				})
			).throws(PlayerNotFoundError);
		});
	});
});