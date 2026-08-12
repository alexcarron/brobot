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
    Promise.resolve([])
  ),
}));

jest.mock("../../../utilities/discord/message-component-utils", () => ({
  addButtonToMessageContents: jest.fn(),
}));

import { addDays, addDuration, addSeconds, OLDEST_DATE, subtractDuration } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { REFILL_COOLDOWN_DURATION } from "../constants/claim-refill.constants";
import { INVALID_PLAYER_ID } from "../constants/testing.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { PlayerRepository } from "../repositories/player.repository";
import { resetMemberToNewPlayer } from "../utilities/discord-action.utility";
import { PlayerService } from "./player.service";
import { NameTooLongError, PlayerNotFoundError } from "../utilities/error.utility";
import { addMockPlayer, createMockPlayerObject } from "../mocks/mock-data/mock-players";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { Player } from "../types/player.types";
import { InvalidArgumentError } from "../../../utilities/error-utils";

describe('PlayerService', () => {
	let playerService: PlayerService;
  let db: DatabaseQuerier;

  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let ALL_PLAYERS: Player[];

  beforeEach(() => {
    playerService = PlayerService.asMock();
    db = playerService.playerRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		SOME_OTHER_PLAYER = addMockPlayer(db);
		addMockPlayer(db, {
			currentName: "Some Name"
		});
		ALL_PLAYERS = playerService.playerRepository.getPlayers();
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

  describe('resolvePlayer()', () => {
    it('should resolve a player object to a player object', () => {
			const player = playerService.playerRepository.getPlayers()[0];

      const resolvedPlayer = playerService.resolvePlayer(player);
      expect(resolvedPlayer).toEqual(player);
    });

    it('should resolve a player ID to a player object', () => {
      const playerID = SOME_PLAYER.id;
      const resolvedPlayer = playerService.resolvePlayer(playerID);
      expect(resolvedPlayer).toEqual(SOME_PLAYER);
    });

    it('returns current player object when given an outdated player object', () => {
			const player = playerService.playerRepository.getPlayers()[0];
      const OUTDATED_PLAYER = {
        ...player,
        currentName: "OUTDATED",
        tokens: 12,
      }
      const resolvedPlayer = playerService.resolvePlayer(OUTDATED_PLAYER);
      expect(resolvedPlayer).toEqual(player);
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
      makeSure(playerService.isPlayer(SOME_PLAYER.id)).isTrue();
    });

    it('should return false if the player object\'s ID is not found', () => {
      const fakePlayer = createMockPlayerObject({ id: INVALID_PLAYER_ID });
      makeSure(playerService.isPlayer(fakePlayer)).isFalse();
    });

    it('should return true if the player object\'s ID is found', () => {
			const player = playerService.playerRepository.getPlayers()[0];
      makeSure(playerService.isPlayer(player)).isTrue();
    })
  });

  describe('areSamePlayers()', () => {
    it('should return false if the player IDs are not the same', () => {
      makeSure(playerService.areSamePlayers(SOME_PLAYER.id, SOME_OTHER_PLAYER.id)).isFalse();
    });

    it('should return true if the player IDs are the same', () => {
      makeSure(playerService.areSamePlayers(SOME_PLAYER.id, SOME_PLAYER.id)).isTrue();
    });

    it('should return false if the player objects are not the same', () => {
			const player1 = playerService.playerRepository.getPlayers()[0];
			const player2 = playerService.playerRepository.getPlayers()[1];
      makeSure(playerService.areSamePlayers(player1, player2)).isFalse();
    });

    it('should return true if the player objects are the same', () => {
			const player = playerService.playerRepository.getPlayers()[0];
      makeSure(playerService.areSamePlayers(player, player)).isTrue();
    });

    it('should work with mismatched player resolvables', () => {
			const player1 = playerService.playerRepository.getPlayers()[0];
			const player2 = playerService.playerRepository.getPlayers()[1];

      makeSure(playerService.areSamePlayers(
        player1.id, player1
      )).isTrue();

      makeSure(playerService.areSamePlayers(
        player1, player1.id
      )).isTrue();

      makeSure(playerService.areSamePlayers(
        player2, player1.id
      )).isFalse();

      makeSure(playerService.areSamePlayers(
        player1.id, player2
      )).isFalse();
    })
  })

  describe('getInventory()', () => {
    it('should return the inventory of a player', () => {
      const result = playerService.getInventory(SOME_PLAYER.id);
      expect(result).toEqual(SOME_PLAYER.inventory);
    });

    it('should throw an error if the player is not found', () => {
      expect(() => playerService.getInventory(INVALID_PLAYER_ID)).toThrow();
    });
  });

  describe('getCurrentName()', () => {
    it('should return the current name of a player', () => {
      const result = playerService.getCurrentName(SOME_PLAYER.id);
      expect(result).toEqual(SOME_PLAYER.currentName);
    });

    it('should throw an error if the player is not found', () => {
      expect(() => playerService.getCurrentName(INVALID_PLAYER_ID)).toThrow();
    });
  });

  describe('changeCurrentName()', () => {
    it('should change the current name of a player', () => {
      const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

      playerService.changeCurrentName(SOME_PLAYER.id, "new name");
      const result = playerService.getCurrentName(SOME_PLAYER.id);
      expect(result).toEqual("new name");

      expect(announceNameChangeEvent).toHaveBeenCalledWith({
        playerID: SOME_PLAYER.id,
        oldName: SOME_PLAYER.currentName,
        newName: "new name"
      })
    });

    it('should change the current name to an empty name', () => {
      const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

      playerService.changeCurrentName(SOME_PLAYER.id, "");
      const result = playerService.getCurrentName(SOME_PLAYER.id);
      expect(result).toEqual("");
      expect(announceNameChangeEvent).toHaveBeenCalledWith({
        playerID: SOME_PLAYER.id,
        oldName: SOME_PLAYER.currentName,
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
        playerService.changeCurrentName(SOME_OTHER_PLAYER.id, "a".repeat(33))
      ).toThrow(NameTooLongError);
    });
  });

  describe('giveCharacter()', () => {
    it('should add a character to the current name of a player', async () => {
      const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

      await playerService.giveCharacter(SOME_PLAYER.id, "a");
      const currentName = playerService.getCurrentName(SOME_PLAYER.id);
      const inventory = playerService.getInventory(SOME_PLAYER.id);
      expect(currentName).toEqual(SOME_PLAYER.currentName + "a");
      expect(inventory).toEqual(SOME_PLAYER.inventory + "a");
      expect(announceNameChangeEvent).toHaveBeenCalledWith({
        playerID: SOME_PLAYER.id,
        oldName: SOME_PLAYER.currentName,
        newName: SOME_PLAYER.currentName + "a"
      });
    });

    it('should throw an error if the player is not found', () => {
      expect(() =>playerService.giveCharacter(INVALID_PLAYER_ID, "a")).toThrow();
    });

    it('should throw an error if the character is too long', () => {
      expect(() => playerService.giveCharacter(SOME_OTHER_PLAYER.id, "aa")).toThrow();
    });
  });

  describe('giveCharacters()', () => {
    it('should add characters to the current name of a player', async () => {
      const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

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

    it('should throw an error if the player is not found', () => {
      expect(() => playerService.giveCharacters(INVALID_PLAYER_ID, "a")).toThrow();
    });
  })

  describe('hasCharacters()', () => {
    it('should return true if the player has all the characters in their inventory', () => {
      const result = playerService.hasCharacters(
        SOME_PLAYER.id, SOME_PLAYER.inventory
      );
      makeSure(result).isTrue();
    });

    it('should return false if the player does not have all the characters in their inventory', () => {
      const result = playerService.hasCharacters(
        SOME_PLAYER.id, SOME_PLAYER.inventory + "a"
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

    it('should throw an error if the player is not found', () => {
      makeSure(() => playerService.removeCharacters(INVALID_PLAYER_ID, "a")).throwsAnError();
    });

    it('should throw an error if the characters are not in their inventory', () => {
      const player = addMockPlayer(db, {
        inventory: "abcdefgh",
      });

      makeSure(() => playerService.removeCharacters(player.id, "z")).throwsAnError();
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

  describe('giveAndTakeCharacters()', () => {
    it('should remove specified characters and add specified characters', () => {
      const player = addMockPlayer(db, {
        inventory: "abcdefgh",
        currentName: "abcdefgh",
      });

      playerService.giveAndTakeCharacters(player.id, {
        charactersRemoving: "a",
        charactersGiving: "z",
      });

      const currentName = playerService.getCurrentName(player.id);
      const inventory = playerService.getInventory(player.id);

      makeSure(inventory).is('bcdefghz');
      makeSure(currentName).is('bcdefghz');
    });

    it('should handle multiple characters', () => {
      const player = addMockPlayer(db, {
        inventory: "abcdefgh",
        currentName: "abcdefgh",
      });

      playerService.giveAndTakeCharacters(player.id, {
        charactersRemoving: "adg",
        charactersGiving: "axy",
      });

      const currentName = playerService.getCurrentName(player.id);
      const inventory = playerService.getInventory(player.id);

      makeSure(inventory).is('bcefhaxy');
      makeSure(currentName).is('bcefhaxy');
    })

    it('should handle when currentName does not match inventory', () => {
      const player = addMockPlayer(db, {
        inventory: "abcdefghijkl",
        currentName: "a d f j",
      });

      playerService.giveAndTakeCharacters(player.id, {
        charactersRemoving: "abc",
        charactersGiving: "klm",
      });

      const currentName = playerService.getCurrentName(player.id);
      const inventory = playerService.getInventory(player.id);

      makeSure(inventory).is('defghijklklm');
      makeSure(currentName).is('dfjklm');
    });

    it('should call the name change event only once', () => {
      const announceNameChangeEvent = jest.spyOn(NamesmithEvents.ChangeName, "triggerEvent");

      const player = addMockPlayer(db, {
        inventory: "abcdefgh",
        currentName: "abcdefgh",
      });

      playerService.giveAndTakeCharacters(player.id, {
        charactersRemoving: "a",
        charactersGiving: "z",
      });

      expect(announceNameChangeEvent).toHaveBeenCalledTimes(1);
      expect(announceNameChangeEvent).toHaveBeenCalledWith({
        playerID: player.id,
        oldName: "abcdefgh",
        newName: "bcdefghz",
      })
    });
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

  describe('giveTokens()', () => {
    it('should give tokens to a player', () => {
      playerService.giveTokens(SOME_PLAYER.id, 10);

      const tokens = playerService.playerRepository.getTokens(SOME_PLAYER.id);

      expect(tokens).toBe(SOME_PLAYER.tokens + 10);
    });

    it('should throw an error if the player is not found', () => {
      expect(() => playerService.giveTokens(INVALID_PLAYER_ID, 10)).toThrow();
    });

    it('should throw an error if the amount is negative', () => {
      expect(() => playerService.giveTokens(SOME_PLAYER.id, -10)).toThrow();
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
      makeSure(() => playerService.takeTokens(SOME_PLAYER.id, -10)).throwsAnError();
    });

    it('should allow tokens to go negative', () => {
      const mockPlayer = addMockPlayer(db, { tokens: 10 });
			playerService.takeTokens(mockPlayer.id, 20);
			const tokens = playerService.playerRepository.getTokens(mockPlayer.id);
			expect(tokens).toBe(-10);
    });

    it('should throw an error if the player is not found', () => {
      makeSure(() => playerService.takeTokens(INVALID_PLAYER_ID, 10)).throwsAnError();
    });
  });

  describe('hasTokens()', () => {
    it('should return true if the player has enough tokens', () => {
      const result = playerService.hasTokens(SOME_PLAYER.id, SOME_PLAYER.tokens);
      makeSure(result).isTrue();
    });

    it('should return true if the player has more than enough tokens', () => {
      const mockPlayer = addMockPlayer(db, { tokens: 20 });
      const result = playerService.hasTokens(mockPlayer.id, 10);
      makeSure(result).isTrue();
    });

    it('should return false if the player does not have enough tokens', () => {
      const result = playerService.hasTokens(SOME_PLAYER.id, SOME_PLAYER.tokens + 10);
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
      const mockPlayer = addMockPlayer(db, {
        lastClaimedRefillTime : null
      });
      const result = playerService.getNextAvailableRefillTime(mockPlayer.id);
      makeSure(result).isCloseToDate(OLDEST_DATE);
    });

    it('should return the next available refill time if the player has been refilled', () => {
      const NOW = new Date();
      const YESTERDAY = addDays(NOW, -1);
      const mockPlayer = addMockPlayer(db, {
        lastClaimedRefillTime : YESTERDAY
      });
      const result = playerService.getNextAvailableRefillTime(mockPlayer.id);
      makeSure(result).isCloseToDate(addDuration(YESTERDAY, REFILL_COOLDOWN_DURATION));
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
        lastClaimedRefillTime : subtractDuration(NOW, REFILL_COOLDOWN_DURATION)
      });
      const result = playerService.canRefill(mockPlayer.id);
      makeSure(result).isTrue();
    })

    it('should throw an error if the player is not found', () => {
      expect(() => playerService.canRefill(INVALID_PLAYER_ID)).toThrow();
    })
  })

  describe('hasRefillReminderEnabled()', () => {
    it('should return false if the player has never toggled reminders', () => {
      makeSure(playerService.hasRefillReminderEnabled(SOME_PLAYER.id)).isFalse();
    });

    it('should return true after being enabled', () => {
      playerService.setRefillReminderEnabled(SOME_PLAYER.id, true);
      makeSure(playerService.hasRefillReminderEnabled(SOME_PLAYER.id)).isTrue();
    });
  });

  describe('setRefillReminderEnabled()', () => {
    it('should enable refill reminders for the player', () => {
      playerService.setRefillReminderEnabled(SOME_PLAYER.id, true);
      makeSure(playerService.hasRefillReminderEnabled(SOME_PLAYER.id)).isTrue();
    });

    it('should disable refill reminders for the player', () => {
      playerService.setRefillReminderEnabled(SOME_PLAYER.id, true);
      playerService.setRefillReminderEnabled(SOME_PLAYER.id, false);
      makeSure(playerService.hasRefillReminderEnabled(SOME_PLAYER.id)).isFalse();
    });
  });

  describe('getPlayerIDsWithRefillReminderEnabled()', () => {
    it('should return only the IDs of players who have enabled reminders', () => {
      playerService.setRefillReminderEnabled(SOME_PLAYER.id, true);
      makeSure(playerService.getPlayerIDsWithRefillReminderEnabled()).is([SOME_PLAYER.id]);
    });
  });

  describe('addNewPlayer()', () => {
    it('should add a new player', () => {
      playerService.addNewPlayer("987654321");
      const players = playerService.playerRepository.getPlayers();
      expect(players.length).toBe(ALL_PLAYERS.length + 1);
    });

    it('should throw an error if the player already exists', () => {
      expect(() => playerService.addNewPlayer(SOME_PLAYER.id)).toThrow();
      expect(resetMemberToNewPlayer).not.toHaveBeenCalled();
      const players = playerService.playerRepository.getPlayers();
      expect(players.length).toBe(ALL_PLAYERS.length);
    });
  });

  describe('reset()', () => {
    it('should reset the player repository', () => {
      playerService.reset();
      const players = playerService.playerRepository.getPlayers();
      expect(players.length).toBe(0);
      expect(() => playerService.getCurrentName(SOME_PLAYER.id)).toThrow();
    });
  });

	describe('getDisplayedInventory()', () => {
		it('should return the inventory of a player in a readable format', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "4b!!3 c6a#",
			});
			const result = playerService.getDisplayedInventory(mockPlayer.id);
			makeSure(result).is("abc346` `!!#");
		});

		it('should keep multi-codepoint characters intact when sorting', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "b👨‍👩‍👧‍👦a",
			});
			const result = playerService.getDisplayedInventory(mockPlayer.id);
			makeSure(result).is("ab👨‍👩‍👧‍👦");
		});
	});

	describe('getUnusedInventoryCharacters()', () => {
		it('should return the inventory characters not present in the given name, in display order', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "4b!!3 c6a#",
			});
			const result = playerService.getUnusedInventoryCharacters(mockPlayer.id, "ac");
			makeSure(result).is(["b", "3", "4", "6", " ", "!", "!", "#"]);
		});

		it('should return an empty array when every inventory character is used', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "abc",
			});
			const result = playerService.getUnusedInventoryCharacters(mockPlayer.id, "cba");
			makeSure(result).is([]);
		});

		it('should only count a repeated character as unused as many times as it is unused', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "aaa",
			});
			const result = playerService.getUnusedInventoryCharacters(mockPlayer.id, "a");
			makeSure(result).is(["a", "a"]);
		});

		it('should keep multi-codepoint characters intact when comparing against the name', () => {
			const mockPlayer = addMockPlayer(db, {
				inventory: "a👨‍👩‍👧‍👦",
			});
			const result = playerService.getUnusedInventoryCharacters(mockPlayer.id, "a");
			makeSure(result).is(["👨‍👩‍👧‍👦"]);
		});
	});

	describe('doesNameContain()', () => {
		it('returns true if currentName of player is the given substring', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abc" });
			makeSure(playerService.doesNameContain(mockPlayer.id, "abc")).isTrue();
		});

		it('returns true if the given substring is contains in the middle of the player\'s name', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "Joseph" });
			makeSure(playerService.doesNameContain(mockPlayer.id, "sep")).isTrue();
		});

		it('returns true if the given substring is not in the same case as the player\'s name', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abcdefghijkl" });
			makeSure(playerService.doesNameContain(mockPlayer.id, "DeFgHiJ")).isTrue();
		})

		it('returns false if given substring is not in currentName of player', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abc" });
			makeSure(playerService.doesNameContain(mockPlayer.id, "def")).isFalse();
		});

		it('returns false if the given substring is not in the exact same order as the characters in the player\'s name', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abcdef" });
			makeSure(playerService.doesNameContain(mockPlayer.id, "bced")).isFalse();
		});

		it('shoudl throw InvalidArgumentError if the given substring is empty', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abcdef" });
			makeSure(() => 
				playerService.doesNameContain(mockPlayer.id, "")
		).throws(InvalidArgumentError);
		});
	});

	describe('doesNameContainAny()', () => {
		it('should return true if currentName of player contains any of the given substrings', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abcdef" });
			const nameSubstrings = ["bce", "def", "ghi"];
			makeSure(playerService.doesNameContainAny(mockPlayer.id, nameSubstrings)).isTrue();
		});

		it('should return false if currentName of player does not contain any of the given substrings', () => {
			const mockPlayer = addMockPlayer(db, { currentName: "abcdef" });
			const nameSubstrings = ["xyz", "jkl"];
			makeSure(playerService.doesNameContainAny(mockPlayer.id, nameSubstrings)).isFalse();
		});
	});

});