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

import { makeSure } from "../../../utilities/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../database/mock-database";
import { createMockPlayerObject, mockPlayers } from "../repositories/mock-repositories";
import { PlayerRepository } from "../repositories/player.repository";
import { changeDiscordNameOfPlayer, sendToPublishedNamesChannel, sendToNamesToVoteOnChannel, resetMemberToNewPlayer } from "../utilities/discord-action.utility";
import { fetchNamesmithGuildMembers } from "../utilities/discord-fetch.utility";
import { createMockPlayerService } from "./mock-services";
import { PlayerService } from "./player.service";


describe('PlayerService', () => {
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
			expect(playerService.getPlayer("invalid-id")).toBeNull();
		});
	})

	describe('resolvePlayer()', () => {
		it('should resolve a player object to a player object', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const resolvedPlayer = playerService.resolvePlayer(player);
			expect(resolvedPlayer).toEqual(player);
		});

		it('should resolve a vote ID to a vote object', () => {
			const player = playerService.playerRepository.getPlayers()[0];
			const playerID = player.id;
			const resolvedPlayer = playerService.resolvePlayer(playerID);
			expect(resolvedPlayer).toEqual(player);
		});

		it('should throw an error if the vote resolvable is invalid', () => {
			expect(() => playerService.resolvePlayer("invalid-id")).toThrow();
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
			makeSure(playerService.isPlayer("00000000000000000")).isFalse();
		});

		it('should return true if the player ID is found', () => {
			makeSure(playerService.isPlayer(mockPlayers[0].id)).isTrue();
		});

		it('should return false if the player object\'s ID is not found', () => {
			const fakePlayer = createMockPlayerObject({ id: "invalid-id" });
			makeSure(playerService.isPlayer(fakePlayer)).isFalse();
		});

		it('should return true if the player object\'s ID is found', () => {
			makeSure(playerService.isPlayer(mockPlayers[0])).isTrue();
		})
	});

	describe('getInventory()', () => {
		it('should return the inventory of a player', () => {
			const result = playerService.getInventory(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].inventory);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getInventory("invalid-id")).toThrow();
		});
	});

	describe('getCurrentName()', () => {
		it('should return the current name of a player', () => {
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].currentName);
		});

		it('should throw an error if the player is not found', () => {
			expect(() => playerService.getCurrentName("invalid-id")).toThrow();
		});
	});

	describe('changeCurrentName()', () => {
		it('should change the current name of a player', async () => {
			await playerService.changeCurrentName(mockPlayers[0].id, "new name");
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("new name");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				"new name"
			);
		});

		it('should change the current name to an empty name', async () => {
			await playerService.changeCurrentName(mockPlayers[0].id, "");
			const result = playerService.getCurrentName(mockPlayers[0].id);
			expect(result).toEqual("");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				""
			);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.changeCurrentName("invalid-id", "new name")).rejects.toThrow();
		});

		it('should throw an error if the new name is too long', async () => {
			await expect(playerService.changeCurrentName(mockPlayers[1].id, "a".repeat(33))).rejects.toThrow();
		});
	});

	describe('giveCharacter()', () => {
		it('should add a character to the current name of a player', async () => {
			await playerService.giveCharacter(mockPlayers[0].id, "a");
			const currentName = playerService.getCurrentName(mockPlayers[0].id);
			const inventory = playerService.getInventory(mockPlayers[0].id);
			expect(currentName).toEqual(mockPlayers[0].currentName + "a");
			expect(inventory).toEqual(mockPlayers[0].inventory + "a");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				mockPlayers[0].id,
				mockPlayers[0].currentName + "a"
			);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.giveCharacter("invalid-id", "a")).rejects.toThrow();
		});

		it('should throw an error if the character is too long', async () => {
			await expect(playerService.giveCharacter(mockPlayers[1].id, "aa")).rejects.toThrow();
		});
	});

	describe('giveCharacters()', () => {
		it('should add characters to the current name of a player', async () => {
			const player = addMockPlayer(db, {
				inventory: "abdegHJlmo",
				currentName: "Joe",
			});

			await playerService.giveCharacters(player.id, " Smith");

			const currentName = playerService.getCurrentName(player.id);
			const inventory = playerService.getInventory(player.id);

			expect(currentName).toEqual(player.currentName + " Smith");
			expect(inventory).toEqual(player.inventory + " Smith");
			expect(changeDiscordNameOfPlayer).toHaveBeenCalledWith(
				player.id,
				player.currentName + " Smith"
			);
		});

		it('should throw an error if the player is not found', async () => {
			await expect(playerService.giveCharacters("000000000000000", "a")).rejects.toThrow();
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
			expect(() => playerService.hasCharacters("0000000000", "a")).toThrow();
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
			await makeSure(playerService.removeCharacters("00000000", "a")).eventuallyThrowsAnError();
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

	describe(".getPublishedName()", () => {
		it("should return the published name of a player", () => {
			const result = playerService.getPublishedName(mockPlayers[0].id);
			expect(result).toEqual(mockPlayers[0].publishedName);
		});

		it("should throw an error if the player is not found", () => {
			expect(() => playerService.getPublishedName("invalid-id")).toThrow();
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
			await expect(playerService.publishName("invalid-id")).rejects.toThrow();
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
			expect(sendToNamesToVoteOnChannel).toHaveBeenCalled();
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
			await expect(playerService.finalizeName("invalid-id")).rejects.toThrow();
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