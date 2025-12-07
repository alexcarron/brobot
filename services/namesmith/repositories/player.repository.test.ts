import { makeSure } from "../../../utilities/jest/jest-utils";
import { Perks } from "../constants/perks.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { Player } from "../types/player.types";
import { Role } from "../types/role.types";
import { PlayerAlreadyExistsError, PlayerNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";
import { RoleRepository } from "./role.repository";

describe('PlayerRepository', () => {
	let playerRepository: PlayerRepository;
	let db: DatabaseQuerier;

	let SOME_ROLE: Role;
	let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let ALL_PLAYERS: Player[];

	beforeEach(() => {
		playerRepository = PlayerRepository.asMock();
		db = playerRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		SOME_OTHER_PLAYER = addMockPlayer(db);
		ALL_PLAYERS = playerRepository.getPlayers();
		SOME_ROLE = RoleRepository.asMock().getRoles()[0];
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

  describe('getPlayers()', () => {
    it('returns an array of player objects', () => {
      const players = playerRepository.getPlayers();
      makeSure(players).isNotEmpty();
			makeSure(players).haveProperties('id', 'currentName', 'publishedName', 'tokens', 'role', 'perks', 'inventory', 'lastClaimedRefillTime');
    });
  });

  describe('getPlayerByID()', () => {
		it('returns a player object', () => {
			const result = playerRepository.getPlayerByID(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER);
		});

		it('returns null if the player is not found', () => {
			const result = playerRepository.getPlayerByID(INVALID_PLAYER_ID);
			expect(result).toBeNull();
		});
  });

	describe('getPlayersByCurrentName()', () => {
		it('should return an array of both players with the same current name', () => {
			const namedPlayer = addMockPlayer(db, {
				currentName: "Thompson",
			});
			const sameNamePlayer = addMockPlayer(db, {
				currentName: namedPlayer.currentName,
			});

			const returnedPlayers = playerRepository.getPlayersByCurrentName(namedPlayer.currentName);

			makeSure(returnedPlayers).contains(namedPlayer, sameNamePlayer);
		})

		it('should return an array of a single player with the same current name', () => {
			const namedPlayer = addMockPlayer(db, {
				currentName: "Thompson",
			});

			const result = playerRepository.getPlayersByCurrentName(namedPlayer.currentName);

			expect(result).toEqual([namedPlayer]);
		});

		it('should return an empty array if no players have the same current name', () => {
			const result = playerRepository.getPlayersByCurrentName("invalid-name");

			expect(result).toEqual([]);
		});
	})

  describe('doesPlayerExist()', () => {
		it('returns true if the player is found', () => {
			const result = playerRepository.doesPlayerExist(SOME_PLAYER.id);
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
				ALL_PLAYERS.filter(player => player.publishedName === null)
			);
		});
	});

	describe('getPlayersWithPublishedNames()', () => {
		it('returns an array of player objects with a published name', () => {
			const result = playerRepository.getPlayersWithPublishedNames();

			expect(result).toEqual(
				ALL_PLAYERS.filter(player => player.publishedName !== null)
			);
		});
	})

	describe('getInventory()', () => {
		it('returns the inventory of a player', () => {
			const result = playerRepository.getInventory(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER.inventory);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getInventory(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('setInventory()', () => {
		it('sets the inventory of a player', () => {
			playerRepository.setInventory(SOME_PLAYER.id, "new inventory");
			const result = playerRepository.getInventory(SOME_PLAYER.id);
			expect(result).toEqual("new inventory");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setInventory(INVALID_PLAYER_ID, "new inventory")).toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('returns the current name of a player', () => {
			const result = playerRepository.getCurrentName(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER.currentName);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getCurrentName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('changes the current name of a player', () => {
			playerRepository.changeCurrentName(SOME_PLAYER.id, "new name");
			const result = playerRepository.getCurrentName(SOME_PLAYER.id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.changeCurrentName(INVALID_PLAYER_ID, "new name")).toThrow();
		});

		it('throws an error if the new name is too long', () => {
			expect(() => playerRepository.changeCurrentName(SOME_OTHER_PLAYER.id, "a".repeat(33))).toThrow();
		});
	});

	describe('getPublishedName()', () => {
		it('returns the published name of a player', () => {
			const result = playerRepository.getPublishedName(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER.publishedName);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getPublishedName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('publishName()', () => {
		it('changes the published name of a player', () => {
			playerRepository.setPublishedName(SOME_PLAYER.id, "new name");
			const result = playerRepository.getPublishedName(SOME_PLAYER.id);
			expect(result).toEqual("new name");
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setPublishedName(INVALID_PLAYER_ID, "new name")).toThrow();
		});

		it('throws an error if the new name is too long', () => {
			expect(() => playerRepository.setPublishedName(SOME_OTHER_PLAYER.id, "a".repeat(33))).toThrow();
		});
	});

	describe('getTokens()', () => {
		it('returns the number of tokens a player has', () => {
			const result = playerRepository.getTokens(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER.tokens);
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
			playerRepository.setTokens(SOME_PLAYER.id, 500);
			const result = playerRepository.getTokens(SOME_PLAYER.id);
			expect(result).toEqual(500);
		});

		it('should not throw error if the number of tokens is negative', () => {
			expect(() => playerRepository.setTokens(SOME_PLAYER.id, -500)).not.toThrow();
		});

		it('throws an error if the player is not found', () => {
			makeSure(() => playerRepository.setTokens(INVALID_PLAYER_ID, 500)).throws(PlayerNotFoundError);
		});
	});

	describe('getLastClaimedRefillTime()', () => {
		it('returns the last claimed refill time of a player', () => {
			const result = playerRepository.getLastClaimedRefillTime(SOME_PLAYER.id);
			expect(result).toEqual(SOME_PLAYER.lastClaimedRefillTime);
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
			playerRepository.setLastClaimedRefillTime(SOME_PLAYER.id, DATE);
			const result = playerRepository.getLastClaimedRefillTime(SOME_PLAYER.id);
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
			const result = playerRepository.getRoleID(SOME_PLAYER.id);
			expect(result).toBeNull();
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.getRoleID(INVALID_PLAYER_ID)).toThrow(PlayerNotFoundError);
		});
	});

	describe('setRoleID()', () => {
		it('sets the role ID of a player', () => {
			playerRepository.setRoleID(SOME_PLAYER.id, 1);
			const result = playerRepository.getRoleID(SOME_PLAYER.id);
			expect(result).toEqual(1);
		});

		it('sets the role ID of a player to null', () => {
			playerRepository.setRoleID(SOME_PLAYER.id, null);
			const result = playerRepository.getRoleID(SOME_PLAYER.id);
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

			makeSure(result).hasProperties({
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
			expect(() => playerRepository.createPlayer(SOME_PLAYER.id)).toThrow();
		});
	});

	describe('reset()', () => {
		it('resets the player repository', () => {
			playerRepository.removePlayers();
			const result = playerRepository.getPlayers();
			expect(result).toEqual([]);
		});
	});

	describe('addCharacterToInventory', () => {
		it('adds a character to the player inventory', () => {
			playerRepository.addCharacterToInventory(SOME_PLAYER.id, "A");
			const result = playerRepository.getInventory(SOME_PLAYER.id);
			expect(result).toEqual(
				SOME_PLAYER.inventory + "A"
			);
		});

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.addCharacterToInventory(INVALID_PLAYER_ID, "A")).toThrow();
		});

		it('throws an error if the character is too long', () => {
			expect(() => playerRepository.addCharacterToInventory(SOME_OTHER_PLAYER.id, "aa")).toThrow();
		});
	});

	describe('removePlayer()', () => {
		it('removes a player from the database', () => {
			playerRepository.removePlayer(SOME_PLAYER.id);
			const maybePlayer = playerRepository.getPlayerByID(SOME_PLAYER.id);
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

			makeSure(player).hasProperties({
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
				role: SOME_ROLE,
				perks: [Perks.DISCOUNT.id, Perks.FASTER_REFILL.name],
			});

			makeSure(player).hasProperties({
				id: "new-player-id",
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z')
			});

			makeSure(player.role?.id).is(SOME_ROLE.id);
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
					id: SOME_PLAYER.id,
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
				id: SOME_PLAYER.id,
				currentName: "test",
			});

			makeSure(player).hasProperties({
				id: SOME_PLAYER.id,
				currentName: "test",
				publishedName: SOME_PLAYER.publishedName,
				tokens: SOME_PLAYER.tokens,
				inventory: SOME_PLAYER.inventory,
				lastClaimedRefillTime: SOME_PLAYER.lastClaimedRefillTime,
				role: SOME_PLAYER.role,
				perks: SOME_PLAYER.perks,
			});

			const resolvedPlayer = playerRepository.getPlayerOrThrow(SOME_PLAYER.id);
			makeSure(resolvedPlayer).is(player);
		});

		it('updates a player in the database with complex values for all fields', () => {
			const player = playerRepository.updatePlayer({
				id: SOME_PLAYER.id,
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z'),
				role: SOME_ROLE,
				perks: [Perks.DISCOUNT.id, Perks.FASTER_REFILL.name],
			});

			makeSure(player).hasProperties({
				id: SOME_PLAYER.id,
				currentName: "currentName",
				publishedName: "publishedName",
				tokens: 100,
				inventory: "currentNameAndInventory",
				lastClaimedRefillTime: new Date('2023-01-01T00:00:00.000Z')
			});

			makeSure(player.role?.id).is(SOME_ROLE.id);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.DISCOUNT.id
			);
			makeSure(player.perks).hasAnItemWhere(perk =>
				perk.id === Perks.FASTER_REFILL.id
			);

			const resolvedPlayer = playerRepository.getPlayerOrThrow(SOME_PLAYER.id);
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

	describe('getHasPickedPerk()', () => {
		it('returns true if the player has picked a perk', () => {
			const player = addMockPlayer(db, {
				hasPickedPerk: true
			});
			makeSure(playerRepository.getHasPickedPerk(player.id)).is(true);
		});

		it('returns false if the player has not picked a perk', () => {
			makeSure(playerRepository.getHasPickedPerk(SOME_PLAYER.id)).is(false);
		});
	});

	describe('setHasPickedPerk()', () => {
		it('sets hasPickedPerk to true', () => {
			playerRepository.setHasPickedPerk(SOME_PLAYER.id, true);
			makeSure(playerRepository.getHasPickedPerk(SOME_PLAYER.id)).is(true);
		});

		it('sets hasPickedPerk to false', () => {
			playerRepository.setHasPickedPerk(SOME_PLAYER.id, false);
			makeSure(playerRepository.getHasPickedPerk(SOME_PLAYER.id)).is(false);
		})

		it('throws an error if the player is not found', () => {
			expect(() => playerRepository.setHasPickedPerk(INVALID_PLAYER_ID, true)).toThrow();
		});
	});

	describe('resetAllHasPickedPerk()', () => {
		it('sets hasPickedPerk to false for all players', () => {
			playerRepository.resetAllHasPickedPerk();
			makeSure(playerRepository.getHasPickedPerk(SOME_PLAYER.id)).is(false);
			for (const player of ALL_PLAYERS) {
				makeSure(playerRepository.getHasPickedPerk(player.id)).is(false);
			}
		});
	});
});