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

import { addDays, addHours, addSeconds } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { REFILL_COOLDOWN_HOURS } from "../constants/namesmith.constants";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { PlayerRepository } from "../repositories/player.repository";
import { sendToPublishedNamesChannel, sendToNamesToVoteOnChannel, resetMemberToNewPlayer } from "../utilities/discord-action.utility";
import { fetchNamesmithGuildMembers } from "../utilities/discord-fetch.utility";
import { createMockPlayerService } from "../mocks/mock-services";
import { PlayerService } from "./player.service";
import { NameTooLongError, PlayerNotFoundError } from "../utilities/error.utility";
import { addMockPlayer, createMockPlayerObject, mockPlayers } from "../mocks/mock-data/mock-players";
import { NamesmithEvents } from "../event-listeners/namesmith-events";

describe('PlayerService', () => {
	const MOCK_PLAYER = mockPlayers[0];

	let playerService: PlayerService;
	let db: DatabaseQuerier;

	beforeEach(() => {
		playerService = createMockPlayerService();
		db = playerService.playerRepository.db;
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

	describe('getPlayer()', () => {
		it('should return a player object when given a player ID', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const resolvedPlayer = playerService.getPlayer(player.id);
			expect(resolvedPlayer).toEqual(player);
		});

		it('should return a player object when given a player object', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const resolvedPlayer = playerService.getPlayer(player);
			expect(resolvedPlayer).toEqual(player);
		});

		it('should return null if the player is not found', () => {
			expect(playerService.getPlayer(INVALID_PLAYER_ID)).toBeNull();
		});
	})

	describe('resolvePlayer()', () => {
		it('should resolve a player object to a player object', () => {
			const resolvedPlayer = playerService.resolvePlayer(MOCK_PLAYER);
			expect(resolvedPlayer).toEqual(MOCK_PLAYER);
		});

		it('should resolve a player ID to a player object', () => {
			const playerID = MOCK_PLAYER.id;
			const resolvedPlayer = playerService.resolvePlayer(playerID);
			expect(resolvedPlayer).toEqual(MOCK_PLAYER);
		});

		it('returns current player object when given an outdated player object', () => {
			const OUTDATED_PLAYER = {
				...MOCK_PLAYER,
				currentName: "OUTDATED",
				tokens: 12,
			}
			const resolvedPlayer = playerService.resolvePlayer(OUTDATED_PLAYER);
			expect(resolvedPlayer).toEqual(MOCK_PLAYER);
		});

		it('should throw a PlayerNotFoundError if the player resolvable is invalid', () => {
			expect(() => playerService.resolvePlayer(INVALID_PLAYER_ID))
			.toThrow(PlayerNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('should resolve a player object to a player ID', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const resolvedPlayerID = playerService.resolveID(player);
			expect(resolvedPlayerID).toEqual(player.id);
		});

		it('should resolve a player ID to a player ID', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const playerID = player.id;
			const resolvedPlayerID = playerService.resolveID(playerID);
			expect(resolvedPlayerID).toEqual(playerID);
		});
	});

	describe('isPlayer()', () => {
		it('should return false if the player ID is not found', () => {
			makeSure(playerService.isPlayer(INVALID_PLAYER_ID)).isFalse();
		});

		it('should return true if the player ID is found', () => {
			makeSure(playerService.isPlayer(mockPlayers[0].id)).isTrue();
		});

		it('should return false if the player object\'s ID is not found', () => {
			const fakePlayer = createMockPlayerObject({ id: INVALID_PLAYER_ID });
			makeSure(playerService.isPlayer(fakePlayer)).isFalse();
		});

		it('should return true if the player object\'s ID is found', () => {
			makeSure(playerService.isPlayer(mockPlayers[0])).isTrue();
		})
	});

	describe('areSamePlayers()', () => {
		it('should return false if the player IDs are not the same', () => {
			makeSure(playerService.areSamePlayers(mockPlayers[0].id, mockPlayers[1].id)).isFalse();
		});

		it('should return true if the player IDs are the same', () => {
			makeSure(playerService.areSamePlayers(mockPlayers[0].id, mockPlayers[0].id)).isTrue();
		});

		it('should return false if the player objects are not the same', () => {
			makeSure(playerService.areSamePlayers(mockPlayers[0], mockPlayers[1])).isFalse();
		});

		it('should return true if the player objects are the same', () => {
			makeSure(playerService.areSamePlayers(mockPlayers[0], mockPlayers[0])).isTrue();
		});

		it('should work with mismatched player resolvables', () => {
			makeSure(playerService.areSamePlayers(
				mockPlayers[0].id, mockPlayers[0]
			)).isTrue();

			makeSure(playerService.areSamePlayers(
				mockPlayers[0], mockPlayers[0].id
			)).isTrue();

			makeSure(playerService.areSamePlayers(
				mockPlayers[1], mockPlayers[0].id
			)).isFalse();

			makeSure(playerService.areSamePlayers(
				mockPlayers[0].id, mockPlayers[1]
			)).isFalse();
		})
	})

	describe('getInventory()', () => {
		it('should return the inventory of a player', () => {
			const result = playerService.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getInventory(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('should return the current name of a player', () => {
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getCurrentName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('should change the current name of a player', () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.NameChange, "announce");

			playerService.changeCurrentName(mockPlayers[0].id, "new name");
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");

			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: mockPlayers[0].id,
				oldName: mockPlayers[0].currentName,
				newName: "new name"
			})
		});

		it('should change the current name to an empty name', () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.NameChange, "announce");

			playerService.changeCurrentName(mockPlayers[0].id, "");
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("");
			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: mockPlayers[0].id,
				oldName: mockPlayers[0].currentName,
				newName: ""
			});
		});

		it('should throw an error if the player is not found', () => {
			expect(() =>
				playerService.changeCurrentName(INVALID_PLAYER_ID, "new name")
			).toThrow();
		});

		it('should throw an error if the new name is too long', () => {
			expect(() =>
				playerService.changeCurrentName(mockPlayers[1].id, "a".repeat(33))
			).toThrow(NameTooLongError);
		});
	});

	describe('giveCharacter()', () => {
		it('should add a character to the current name of a player', async () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.NameChange, "announce");

			await playerService.giveCharacter(mockPlayers[0].id, "a");
			const currentName = playerService.getCurrentName(mockPlayers[0].id);
			const inventory = playerService.getInventory(mockPlayers[0].id);
			expect(currentName).toEqual(mockPlayers[0].currentName + "a");
			expect(inventory).toEqual(mockPlayers[0].inventory + "a");
			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: mockPlayers[0].id,
				oldName: mockPlayers[0].currentName,
				newName: mockPlayers[0].currentName + "a"
			});
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.giveCharacter(INVALID_PLAYER_ID, "a")).rejects.toThrow();
		});

		it('should throw an error if the character is too long', async () => {
			await expect(playerService.giveCharacter(mockPlayers[1].id, "aa")).rejects.toThrow();
		});
	});

	describe('giveCharacters()', () => {
		it('should add characters to the current name of a player', async () => {
			const announceNameChangeEvent = jest.spyOn(NamesmithEvents.NameChange, "announce");

			const player = addMockPlayer(db, {
				inventory: "abdegHJlmo",
				currentName: "Joe",
			});

			await playerService.giveCharacters(player.id, " Smith");

			const currentName = playerService.getCurrentName(player.id);
			const inventory = playerService.getInventory(player.id);

			expect(currentName).toEqual(player.currentName + " Smith");
			expect(inventory).toEqual(player.inventory + " Smith");
			expect(announceNameChangeEvent).toHaveBeenCalledWith({
				playerID: player.id,
				oldName: player.currentName,
				newName: player.currentName + " Smith"
			});
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.giveCharacters(INVALID_PLAYER_ID, "a")).rejects.toThrow();
		});
	})

	describe('hasCharacters()', () => {
		it('should return true if the player has all the characters in their inventory', () => {
			const result = playerService.hasCharacters(
				mockPlayers[0].id, mockPlayers[0].inventory
			);
			makeSure(result).isTrue();
		});

		it('should return false if the player does not have all the characters in their inventory', () => {
			const result = playerService.hasCharacters(
				mockPlayers[0].id, mockPlayers[0].inventory + "a"
			);
			makeSure(result).isFalse();
		});

		it('should return true if their inventory has some characters but not all', () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
			})
			const result = playerService.hasCharacters(
				player.id, "afh"
			);
			makeSure(result).isTrue();
		});

		it('should return false if at least one character is missing', () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
			})
			const result = playerService.hasCharacters(
				player.id, "efghi"
			);
			makeSure(result).isFalse();
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.hasCharacters(INVALID_PLAYER_ID, "a")).toThrow();
		})
	});

	describe('removeCharacters()', () => {
		it('should remove characters from the inventory and current name of a player', async () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
				currentName: "abcdefgh",
			})
			await playerService.removeCharacters(player.id, "a");
			const currentName = playerService.getCurrentName(player.id);
			const inventory = playerService.getInventory(player.id);

			makeSure(currentName).is('bcdefgh');
			makeSure(inventory).is('bcdefgh');
		});

		it('should remove characters from the inventory but not current name of a player if the character is not in the current name', async () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
				currentName: "bcdefg",
			})
			await playerService.removeCharacters(player.id, "a");
			const currentName = playerService.getCurrentName(player.id);
			const inventory = playerService.getInventory(player.id);

			makeSure(inventory).is('bcdefgh');
			makeSure(currentName).is('bcdefg');
		});

		it('should throw an error if the player is not found', async () => {
			await makeSure(playerService.removeCharacters(INVALID_PLAYER_ID, "a")).eventuallyThrowsAnError();
		});

		it('should throw an error if the characters are not in their inventory', async () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
			});

			await makeSure(playerService.removeCharacters(player.id, "z")).eventuallyThrowsAnError();
		});

		it('should remove multiple characters', async () => {
			const player = addMockPlayer(db, {
				inventory: "abcdefgh",
				currentName: "abcgh",
			});

			await playerService.removeCharacters(player.id, "adg");

			const currentName = playerService.getCurrentName(player.id);
			const inventory = playerService.getInventory(player.id);

			makeSure(inventory).is('bcefh');
			makeSure(currentName).is('bch');
		})
	})

	describe('transferCharacters()', () => {
		it('should transfer characters from one player to another', async () => {
			const player = addMockPlayer(db, {
				inventory: "abcd",
				currentName: "ab",
			});
			const player2 = addMockPlayer(db, {
				inventory: "efgh",
				currentName: "ef",
			});

			await playerService.transferCharacters(player.id, player2.id, "ad");
			const player1CurrentName = playerService.getCurrentName(player.id);
			const player1Inventory = playerService.getInventory(player.id);
			const player2CurrentName = playerService.getCurrentName(player2.id);
			const player2Inventory = playerService.getInventory(player2.id);

			makeSure(player1Inventory).is('bc');
			makeSure(player1CurrentName).is('b');
			makeSure(player2Inventory).is('efghad');
			makeSure(player2CurrentName).is('efad');
		});
	});

	describe(".getPublishedName()", () => {
		it("should return the published name of a player", () => {
			const result = playerService.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].publishedName);
		});

		it("should throw an error if the player is not found", () => {
			expect(() => playerService.getPublishedName(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe(".publishName()", () => {
		it("should publish the player's current name", async () => {
			await playerService.publishName(mockPlayers[2].id);

			const publishedName = playerService.getPublishedName(mockPlayers[2].id);
			expect(publishedName).toEqual(mockPlayers[2].currentName);
			expect(sendToPublishedNamesChannel).toHaveBeenCalled();
		});

		it("should throw an error if the player is not found", async () => {
			await expect(playerService.publishName(INVALID_PLAYER_ID)).rejects.toThrow();
		});

		it("should not publish name if it is an empty string", async () => {
			await playerService.changeCurrentName(mockPlayers[1].id, "");
			await playerService.publishName(mockPlayers[1].id);

			const publishedName = playerService.getPublishedName(mockPlayers[1].id);
			expect(publishedName).toEqual(mockPlayers[1].publishedName);
			expect(sendToPublishedNamesChannel).not.toHaveBeenCalled();
		});
	});

	describe('publishUnpublishedNames()', () => {
		it('should publish all unpublished names', async () => {
			await playerService.publishUnpublishedNames();

			const playersToCheck = mockPlayers.filter(player => !player.publishedName);

			for (const player of playersToCheck) {
				const publishedName = playerService.getPublishedName(player.id);
				expect(publishedName).toEqual(player.currentName);
			}
		});
	});

	describe('finalizeName()', () => {
		it('should change current name of player to their published name when they have one', async () => {
			await playerService.finalizeName(mockPlayers[1].id);
			const currentName = playerService.getCurrentName(mockPlayers[1].id);
			expect(currentName).toEqual(mockPlayers[1].publishedName);
		});

		it('should not change current name of player to their published name when they don\'t have one', async () => {
			await playerService.finalizeName(mockPlayers[2].id);
			const currentName = playerService.getCurrentName(mockPlayers[2].id);
			const publishedName = playerService.getPublishedName(mockPlayers[2].id);
			expect(currentName).toEqual(mockPlayers[2].currentName);
			expect(publishedName).toEqual(mockPlayers[2].publishedName);
			expect(sendToNamesToVoteOnChannel).not.toHaveBeenCalled();
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.finalizeName(INVALID_PLAYER_ID)).rejects.toThrow();
		});
	});

	describe('finalizeAllNames()', () => {
		it('should finalize all names', async () => {
			await playerService.finalizeAllNames();
			for (const player of mockPlayers) {
				if (player.publishedName === null) continue;
				const currentName = playerService.getCurrentName(player.id);
				const publishedName = playerService.getPublishedName(player.id);
				expect(currentName).toEqual(publishedName);
			}
		});
	});

	describe('giveTokens()', () => {
		it('should give tokens to a player', () => {
			playerService.giveTokens(mockPlayers[0].id, 10);

			const tokens = playerService.playerRepository.getTokens(mockPlayers[0].id);

			expect(tokens).toBe(mockPlayers[0].tokens + 10);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.giveTokens(INVALID_PLAYER_ID, 10)).toThrow();
		});

		it('should throw an error if the amount is negative', () => {
			expect(() => playerService.giveTokens(mockPlayers[0].id, -10)).toThrow();
		});
	});

	describe('takeTokens()', () => {
		it('should take tokens from a player', () => {
			const mockPlayer = addMockPlayer(db, { tokens: 20 });
			playerService.takeTokens(mockPlayer.id, 10);
			const tokens = playerService.playerRepository.getTokens(mockPlayer.id);
			expect(tokens).toBe(10);
		});

		it('should throw an error if the amount is negative', () => {
			makeSure(() => playerService.takeTokens(mockPlayers[0].id, -10)).throwsAnError();
		});

		it('should throw an error if the player does not have enough tokens', () => {
			const mockPlayer = addMockPlayer(db, { tokens: 10 });
			makeSure(() => playerService.takeTokens(mockPlayer.id, 20)).throwsAnError();
		});

		it('should throw an error if the player is not found', () => {
			makeSure(() => playerService.takeTokens(INVALID_PLAYER_ID, 10)).throwsAnError();
		});
	});

	describe('hasTokens()', () => {
		it('should return true if the player has enough tokens', () => {
			const result = playerService.hasTokens(mockPlayers[0].id, mockPlayers[0].tokens);
			makeSure(result).isTrue();
		});

		it('should return true if the player has more than enough tokens', () => {
			const mockPlayer = addMockPlayer(db, { tokens: 20 });
			const result = playerService.hasTokens(mockPlayer.id, 10);
			makeSure(result).isTrue();
		});

		it('should return false if the player does not have enough tokens', () => {
			const result = playerService.hasTokens(mockPlayers[0].id, mockPlayers[0].tokens + 10);
			makeSure(result).isFalse();
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.hasTokens(INVALID_PLAYER_ID, 10)).toThrow();
		});
	});

	describe('getTokens()', () => {
		it('should return the number of tokens a player has', () => {
			const mockPlayer = addMockPlayer(db, { tokens: 5000 });
			const result = playerService.getTokens(mockPlayer.id);
			expect(result).toBe(5000);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getTokens(INVALID_PLAYER_ID)).toThrow();
		});
	});

	describe('getNextAvailableRefillTime()', () => {

		it('should return now if the player has never been refilled', () => {
			const NOW = new Date();
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : null
			});
			const result = playerService.getNextAvailableRefillTime(mockPlayer.id);
			makeSure(result).isCloseToDate(NOW);
		});

		it('should return the next available refill time if the player has been refilled', () => {
			const NOW = new Date();
			const YESTERDAY = addDays(NOW, -1);
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : YESTERDAY
			});
			const result = playerService.getNextAvailableRefillTime(mockPlayer.id);
			makeSure(result).isCloseToDate(addHours(YESTERDAY, REFILL_COOLDOWN_HOURS));
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getNextAvailableRefillTime(INVALID_PLAYER_ID)).toThrow();
		})
	});

	describe('canRefill()', () => {
		const NOW = new Date();
		const YESTERDAY = addDays(NOW, -1);

		it('should return true if the player has never refilled', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : null
			});
			const result = playerService.canRefill(mockPlayer.id);
			makeSure(result).isTrue();
		});

		it('should return true if the player refilled longer ago than the cooldown', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : YESTERDAY
			});
			const result = playerService.canRefill(mockPlayer.id);
			makeSure(result).isTrue();
		});

		it('should return false if the player refilled less than the cooldown ago', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : addSeconds(NOW, -1)
			});
			const result = playerService.canRefill(mockPlayer.id);
			makeSure(result).isFalse();
		});

		it('should return true if the player refilled exactly the cooldown ago', () => {
			const mockPlayer = addMockPlayer(db, {
				lastClaimedRefillTime : addHours(NOW, -REFILL_COOLDOWN_HOURS)
			});
			const result = playerService.canRefill(mockPlayer.id);
			makeSure(result).isTrue();
		})

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.canRefill(INVALID_PLAYER_ID)).toThrow();
		})
	})

	describe('addNewPlayer()', () => {
		it('should add a new player', async () => {
			await playerService.addNewPlayer("987654321");
			const players = playerService.playerRepository.getPlayers();
			expect(players.length).toBe(mockPlayers.length + 1);

			const mockMember = {
				id: "987654321",
			}
			expect(resetMemberToNewPlayer).toHaveBeenCalledWith(mockMember);
		});

		it('should throw an error if the player already exists', async () => {
			await expect(playerService.addNewPlayer(mockPlayers[0].id)).rejects.toThrow();
			expect(resetMemberToNewPlayer).not.toHaveBeenCalled();
			const players = playerService.playerRepository.getPlayers();
			expect(players.length).toBe(mockPlayers.length);
		});
	});

	describe('addEveryoneInServer()', () => {
		it('should add all players in the server', async () => {
			jest.spyOn(playerService, 'addNewPlayer');
			(fetchNamesmithGuildMembers as jest.Mock).mockResolvedValue([
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

			(fetchNamesmithGuildMembers as jest.Mock).mockResolvedValue([
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

	describe('reset()', () => {
		it('should reset the player repository', () => {
			playerService.reset();
			const players = playerService.playerRepository.getPlayers();
			expect(players.length).toBe(0);
			expect(() => playerService.getCurrentName(mockPlayers[0].id)).toThrow();
		});
	});
});