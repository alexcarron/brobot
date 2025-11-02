import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { DBPlayer, Player } from "../types/player.types";
import { addMockPerk } from "./mock-data/mock-perks";
import { addMockPlayer, editMockPlayer } from "./mock-data/mock-players";
import { addMockRole } from "./mock-data/mock-roles";
import { addMockVote } from "./mock-data/mock-votes";
import { createMockDB } from "./mock-database";

describe("Mock Utilities", () => {
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
				"mysteryBox",
				"player",
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
			expect({
				...player,
				perks: [],
			}).toEqual({
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

	describe('addMockPerk()', () => {
		it('returns the added perk', () => {
			const perk = addMockPerk(db, {
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
			});

			makeSure(perk).is({
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false
			});
		});

		it('adds the perk to the database', () => {
			addMockPerk(db, {
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
			});

			const perks = db.getRows("SELECT * FROM perk");
			makeSure(perks).contains({
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: 0,
			});
		});

		it('throws if the perk already exists', () => {
			addMockPerk(db, {
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
			});

			expect(() => addMockPerk(db, {
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
			})).toThrow();
		});

		it('creates its own ID when none is provided', () => {
			const perk = addMockPerk(db, {
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
			});

			makeSure(perk).is({
				id: expect.any(Number),
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false
			});
		});

		it('works when only a name is provided', () => {
			const perk = addMockPerk(db, {
				name: "Test Perk",
			});

			makeSure(perk).is({
				id: expect.any(Number),
				name: "Test Perk",
				description: "",
				wasOffered: false
			});

			const perks = db.getRows("SELECT * FROM perk");
			makeSure(perks).contains({
				id: perk.id,
				name: "Test Perk",
				description: "",
				wasOffered: 0,
			});
		});
	});

	describe('addMockRole()', () => {
		it('returns the added role', () => {
			const role = addMockRole(db, {
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			});

			makeSure(role).is({
				id: 123,
				name: "Test Role",
				description: "This is a test role",
				perks: [],
			});
		});

		it('adds the role to the database', () => {
			addMockRole(db, {
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			});

			const roles = db.getRows("SELECT * FROM role");
			makeSure(roles).contains({
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			});
		});

		it('adds a role with given perks', () => {
			const perk1 = addMockPerk(db, {
				name: "Test Perk 1",
			});
			const perk2 = addMockPerk(db, {
				name: "Test Perk 2",
			});
			const perk3 = addMockPerk(db, {
				name: "Test Perk 3",
			});

			const role = addMockRole(db, {
				id: 123,
				name: "Test Role",
				description: "This is a test role",
				perks: [perk1, perk2.id, perk3.name],
			});

			makeSure(role.perks).hasAnItemWhere(
				(p) => p.id === perk1.id,
				(p) => p.id === perk2.id,
				(p) => p.id === perk3.id
			);

			const roles = db.getRows("SELECT * FROM role");
			makeSure(roles).contains({
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			});

			const rolePerks = db.getRows("SELECT * FROM rolePerk");
			makeSure(rolePerks).contains(
				{roleID: 123, perkID: perk1.id},
				{roleID: 123, perkID: perk2.id},
				{roleID: 123, perkID: perk3.id},
			)
		});

		it('throws if the role already exists', () => {
			addMockRole(db, {
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			});

			expect(() => addMockRole(db, {
				id: 123,
				name: "Test Role",
				description: "This is a test role",
			})).toThrow();
		});

		it('creates its own ID when none is provided', () => {
			const role = addMockRole(db, {
				name: "Test Role",
				description: "This is a test role",
			});

			makeSure(role).is({
				id: expect.any(Number),
				name: "Test Role",
				description: "This is a test role",
				perks: [],
			});
		});
	});
});