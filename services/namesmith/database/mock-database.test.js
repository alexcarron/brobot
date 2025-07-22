const { InvalidArgumentError } = require("../../../utilities/error-utils");
const DatabaseQuerier = require("./database-querier");
const { createMockDB, addMockPlayer, addMockVote } = require("./mock-database");

describe("mock-database", () => {
	/**
	 * @type {DatabaseQuerier}
	 */
  let db;

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
      };

      addMockPlayer(db, playerData);

      const players = db.prepare("SELECT * FROM player").all();
      expect(players).toHaveLength(1);
      expect(players[0]).toEqual(playerData);
    });

    it("throws an error if player data is invalid", () => {
      const playerData = {
        id: "player-1",
        currentName: "John Doe",
      };

      expect(() => addMockPlayer(db, playerData)).toThrow(InvalidArgumentError);
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

    it("throws an error if vote data is invalid", () => {
      const voteData = {
        voterID: "player-1",
      };

      expect(() => addMockVote(db, voteData)).toThrow(InvalidArgumentError);
    });
  });
});