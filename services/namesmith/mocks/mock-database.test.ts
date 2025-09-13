import { DatabaseQuerier } from "../database/database-querier";
import { DBPlayer, Player } from "../types/player.types";
import { createMockDB, addMockPlayer, addMockVote, editMockPlayer } from "./mock-database";

describe("mock-database", () => {
  let db: DatabaseQuerier;

  beforeEach(() => {
    db = createMockDB();
  });

  afterEach(() => {
    db.close();
  });

  describe("createMockDB", () => {
    it("creates an in-memory SQLite database", () => {
      expect(db).toBeInstanceOf(DatabaseQuerier);
    });

    it("applies the schema to the database", () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

			const expectedTables = [
				"gameState",
				"character",
				"characterTag",
				"mysteryBox",
				"mysteryBoxCharacterOdds",
				"player",
				"playerPerk",
				"vote"
			];

			for (const table of expectedTables) {
				expect(tables).toContainEqual({ name: table });
			}
    });

    it("adds initial data to the database", () => {
      const players = db.getRows("SELECT * FROM character");
      expect(players).not.toHaveLength(0);

      const votes = db.getRows("SELECT * FROM mysteryBox");
      expect(votes).not.toHaveLength(0);
    });
  });

  describe("addMockPlayer", () => {
    it("adds a player to the database", () => {
      const playerData = {
        id: "player-1",
        currentName: "John Doe",
        publishedName: null,
        tokens: 100,
        role: null,
        inventory: "{}",
				lastClaimedRefillTime: null,
      };

      addMockPlayer(db, playerData);

      const players = db.prepare("SELECT * FROM player").all();
      expect(players).toHaveLength(1);
      expect(players[0]).toEqual(playerData);
    });
  });

  describe("addMockVote", () => {
		beforeEach(() => {
			addMockPlayer(db, {
				id: "player-1",
				currentName: "John Doe",
				publishedName: null,
				tokens: 100,
				role: null,
				inventory: "{}",
			});
			addMockPlayer(db, {
				id: "player-2",
				currentName: "Jane Doe",
				publishedName: null,
				tokens: 100,
				role: null,
				inventory: "{}",
			});
		})

    it("adds a vote to the database", () => {
      const voteData = {
        voterID: "player-1",
        playerVotedForID: "player-2",
      };

      const result = addMockVote(db, voteData);
      expect(result).toHaveProperty("changes", expect.any(Number));
			expect(result).toHaveProperty("lastInsertRowid", expect.any(Number));

      const votes = db.prepare("SELECT * FROM vote").all();
      expect(votes).toHaveLength(1);
      expect(votes[0]).toEqual(voteData);
    });
  });

	describe('editMockPlayer', () => {
		let ORIGINAL_PLAYER: Player;

		beforeEach(() => {
			ORIGINAL_PLAYER = addMockPlayer(db, {
				id: "123",
				currentName: "John Doe",
				publishedName: null,
				tokens: 100,
				role: null,
				inventory: "{}",
				lastClaimedRefillTime: null,
			});
		})

		it("updates only defined fields", () => {
			editMockPlayer(db, {
				id: ORIGINAL_PLAYER.id,
				currentName: "Jane Doe",
				tokens: 200,
			});

			const player = db.getRow(
				"SELECT * FROM player WHERE id = @id",
				{ id: ORIGINAL_PLAYER.id }
			) as DBPlayer | undefined;

			expect(player).toBeDefined();
			expect(player).toEqual({
				...ORIGINAL_PLAYER,
				currentName: "Jane Doe",
				tokens: 200,
			});
		});

		it("throws if no properties to update", () => {
			expect(() => editMockPlayer(db, { id: ORIGINAL_PLAYER.id })).toThrow();
		});

		it("throws if no player is found on update", () => {
			expect(() => editMockPlayer(db, { id: "456" })).toThrow();
		});
	});
});