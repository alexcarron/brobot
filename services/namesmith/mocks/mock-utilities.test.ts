import { makeSure } from "../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { ActivityTypes, DBActivityLog } from "../types/activity-log.types";
import { asMinimalPlayer, asMinimalPlayers, Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { MinimalTrade, TradeStatuses } from "../types/trade.types";
import { asDBVotes, asMinimalVotes } from "../types/vote.types";
import { ActivityLogAlreadyExistsError, TradeAlreadyExistsError } from "../utilities/error.utility";
import { createAllMocks } from "./all-mocks";
import { addMockActivityLog } from "./mock-data/mock-activity-logs";
import { forcePlayerToBuyNewMysteryBox } from "./mock-data/mock-mystery-boxes";
import { addMockPerk } from "./mock-data/mock-perks";
import { addMockPlayer, editMockPlayer, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from "./mock-data/mock-players";
import { addMockQuest } from "./mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraft } from "./mock-data/mock-recipes";
import { addMockRole } from "./mock-data/mock-roles";
import { addMockTrade, forcePlayerToAcceptNewTrade, forcePlayerToInitiateTrade } from "./mock-data/mock-trades";
import { addMockVote } from "./mock-data/mock-votes";
import { setupMockNamesmith } from "./mock-setup";

describe("Mock Utilities", () => {
  let db: DatabaseQuerier;

	let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;

  beforeEach(() => {
		({ db } = setupMockNamesmith());

		SOME_PLAYER = addMockPlayer(db);
		SOME_OTHER_PLAYER = addMockPlayer(db);
  });

  afterEach(() => {
    db.close();
  });

	describe('createAllMocks()', () => {
		it('returns an object containing all the mock services and repositories.', () => {
			const allMocks = createAllMocks();
			makeSure(allMocks).hasProperties(
				'db',

				'playerRepository',
				'gameStateRepository',
				'mysteryBoxRepository',
				'voteRepository',
				'recipeRepository',
				'tradeRepository',
				'perkRepository',
				'roleRepository',
				'questRepository',
				'activityLogRepository',

				'playerService',
				'gameStateService',
				'mysteryBoxService',
				'voteService',
				'recipeService',
				'tradeService',
				'perkService',
				'roleService',
				'questService',
				'activityLogService',
			);
		});

		it('returns dependencies that all share the same db instance', () => {
			const allMocks = createAllMocks();
			const sharedDB = allMocks.db;
			makeSure(sharedDB).isSameInstanceAs(allMocks.playerRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.gameStateRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.mysteryBoxRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.voteRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.recipeRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.tradeRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.perkRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.roleRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.roleRepository.perkRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.questRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogRepository.playerRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogRepository.recipeRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogRepository.questRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.playerService.playerRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.gameStateService.gameStateRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.mysteryBoxService.mysteryBoxRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.voteService.voteRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.recipeService.recipeRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.tradeService.tradeRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.perkService.perkRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.roleService.roleRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.questService.questRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.questService.activityLogService.activityLogRepository.playerRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.questService.playerService.playerRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogService.activityLogRepository.db);
			makeSure(sharedDB).isSameInstanceAs(allMocks.activityLogService.activityLogRepository.playerRepository.db);
		})
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
			const numPlayers = db.getRows("SELECT * FROM player").length;

      addMockPlayer(db, {
        id: "player-1",
        currentName: "John Doe",
        publishedName: null,
        tokens: 100,
        role: null,
        inventory: "{}",
				lastClaimedRefillTime: null,
				hasPickedPerk: true,
      });

      const players = asMinimalPlayers(db.getRows("SELECT * FROM player"));
      expect(players).toHaveLength(numPlayers + 1);
      makeSure(players).hasAnItemWhere(player => player.id === "player-1");
    });
  });

  describe("addMockVote", () => {
    it("adds a vote to the database", () => {
			const numVotes = db.getRows("SELECT * FROM vote").length;
      const voteData = {
        voter: "10000001",
        playerVotedFor: "10000002",
      };

      const vote = addMockVote(db, voteData);
			makeSure(vote.voterID).is(voteData.voter);
			makeSure(vote.playerVotedFor.id).is(voteData.playerVotedFor);

      const votes = asMinimalVotes( db.getRows("SELECT * FROM vote") );
      makeSure(votes).hasLengthOf(numVotes + 1);
			makeSure(votes).hasAnItemWhere(vote =>
				vote.voterID === voteData.voter &&
				vote.playerVotedForID === voteData.playerVotedFor
			);
    });

		it('adds a mock vote even with no given data', () => {
			const numVotes = db.getRows("SELECT * FROM vote").length;
			const vote = addMockVote(db);

			const dbVotes = asDBVotes( db.getRows("SELECT * FROM vote") );
			makeSure(dbVotes).hasLengthOf(numVotes + 1);
			makeSure(dbVotes).hasAnItemWhere(dbVote =>
				dbVote.voterID === vote.voterID &&
				dbVote.playerVotedForID === vote.playerVotedFor.id
			)
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

			const row = db.getRow(
				"SELECT * FROM player WHERE id = @id",
				{ id: ORIGINAL_PLAYER.id }
			);

			expect(row).toBeDefined();
			const minimalPlayer = asMinimalPlayer(row);
			expect({
				...minimalPlayer,
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
				wasOffered: true,
				isBeingOffered: true,
			});

			makeSure(perk).is({
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: true,
				isBeingOffered: true
			});
		});

		it('adds the perk to the database', () => {
			addMockPerk(db, {
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
				isBeingOffered: false
			});

			const perks = db.getRows("SELECT * FROM perk");
			makeSure(perks).contains({
				id: 123,
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: 0,
				isBeingOffered: 0,
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
				isBeingOffered: false
			});

			makeSure(perk).is({
				id: expect.any(Number),
				name: "Test Perk",
				description: "This is a test perk",
				wasOffered: false,
				isBeingOffered: false
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
				wasOffered: false,
				isBeingOffered: false,
			});

			const perks = db.getRows("SELECT * FROM perk");
			makeSure(perks).contains({
				id: perk.id,
				name: "Test Perk",
				description: "",
				wasOffered: 0,
				isBeingOffered: 0,
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

	describe('addMockTrade()', () => {
		it('returns the added trade', () => {
			const trade = addMockTrade(db, {
				id: 123,
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: SOME_OTHER_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			makeSure(trade).hasProperties({
				id: 123,
				initiatingPlayer: SOME_PLAYER,
				recipientPlayer: SOME_OTHER_PLAYER,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			});
		});

		it('adds the trade to the database', () => {
			addMockTrade(db, {
				id: 123,
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: SOME_OTHER_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const trades = db.getRows("SELECT * FROM trade");
			makeSure(trades).contains({
				id: 123,
				initiatingPlayerID: SOME_PLAYER.id,
				recipientPlayerID: SOME_OTHER_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			});
		});

		it('creates a trade even when no fields are provided', () => {
			const mockTrade = addMockTrade(db);
			makeSure(mockTrade).hasProperties('id', 'initiatingPlayer', 'recipientPlayer', 'offeredCharacters', 'requestedCharacters', 'status');

			const trades = db.getRows("SELECT * FROM trade") as MinimalTrade[];
			makeSure(trades).hasAnItemWhere(trade =>
				trade.id === mockTrade.id
			);
		})

		it('throws if the trade already exists', () => {
			addMockTrade(db, {
				id: 123,
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: SOME_OTHER_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			makeSure(() => addMockTrade(db, {
				id: 123,
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: SOME_OTHER_PLAYER.id,
				offeredCharacters: "abc",
				requestedCharacters: "def",
				status: TradeStatuses.AWAITING_INITIATOR,
			})).throws(TradeAlreadyExistsError);
		})
	});

	describe('addMockActivityLog()', () => {
		let SOME_RECIPE: Recipe;
		let SOME_QUEST: Quest;

		beforeEach(() => {
			SOME_RECIPE = addMockRecipe(db);
			SOME_QUEST = addMockQuest(db);
		})

		it('returns the added activity log', () => {
			const activityLog = addMockActivityLog(db, {
				id: 1000000001,
				player: SOME_PLAYER.id,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayer: SOME_OTHER_PLAYER.id,
				involvedRecipe: SOME_RECIPE.id,
				involvedQuest: SOME_QUEST.id,
			});

			makeSure(activityLog).hasProperties({
				id: 1000000001,
				player: SOME_PLAYER,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayer: SOME_OTHER_PLAYER,
				involvedRecipe: SOME_RECIPE,
				involvedQuest: SOME_QUEST,
			});
		});

		it('adds the activity log to the database', () => {
			const TIME = new Date();
			addMockActivityLog(db, {
				id: 1000000001,
				timeOccured: TIME,
				player: SOME_PLAYER.id,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayer: SOME_OTHER_PLAYER.id,
				involvedRecipe: SOME_RECIPE.id,
				involvedQuest: SOME_QUEST.id,
			});

			const activityLogs = db.getRows("SELECT * FROM activityLog");
			makeSure(activityLogs).contains({
				id: 1000000001,
				timeOccured: TIME.getTime(),
				playerID: SOME_PLAYER.id,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayerID: SOME_OTHER_PLAYER.id,
				involvedRecipeID: SOME_RECIPE.id,
				involvedQuestID: SOME_QUEST.id,
			});
		});

		it('adds the activity log even when no fields are provided', () => {
			const mockActivityLog = addMockActivityLog(db);
			makeSure(mockActivityLog).hasProperties('id', 'player', 'type', 'tokensDifference', 'involvedPlayer', 'involvedRecipe', 'involvedQuest');

			const activityLogs = db.getRows("SELECT * FROM activityLog") as DBActivityLog[];
			makeSure(activityLogs).hasAnItemWhere(activityLog =>
				activityLog.id === mockActivityLog.id
			);
		});

		it('throws if the activity log already exists', () => {
			addMockActivityLog(db, {
				id: 1000000001,
				player: SOME_PLAYER.id,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayer: SOME_OTHER_PLAYER.id,
				involvedRecipe: SOME_RECIPE.id,
				involvedQuest: SOME_QUEST.id,
			});

			makeSure(() => addMockActivityLog(db, {
				id: 1000000001,
				player: SOME_PLAYER.id,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 10,
				involvedPlayer: SOME_OTHER_PLAYER.id,
				involvedRecipe: SOME_RECIPE.id,
				involvedQuest: SOME_QUEST.id,
			})).throws(ActivityLogAlreadyExistsError);
		});
	});

	describe('forcePlayerToCraft()', () => {
		let SOME_RECIPE: Recipe;

		beforeEach(() => {
			SOME_RECIPE = addMockRecipe(db, {
				inputCharacters: "abc",
				outputCharacters: "def",
			});
		})

		it('returns a success result with the correct values', () => {
			const result = forcePlayerToCraft(SOME_PLAYER, SOME_RECIPE);
			makeSure(result.isFailure()).isFalse();
			makeSure(result.craftedCharacters).is("def");
			makeSure(result.newInventory).is("def");
			makeSure(result.recipeUsed).is(SOME_RECIPE);
		});

		it('works with randomly generated recipes', () => {
			SOME_RECIPE = addMockRecipe(db);
			const result = forcePlayerToCraft(SOME_PLAYER, SOME_RECIPE);
			makeSure(result.isFailure()).isFalse();
		});

		it('works when repeated many times', () => {
			for (let i = 0; i < 25; i++) {
				SOME_RECIPE = addMockRecipe(db);
				const result = forcePlayerToCraft(SOME_PLAYER, SOME_RECIPE);
				makeSure(result.isFailure()).isFalse();
			}
		});
	});

	describe('forcePlayerToPublishName()', () => {
		it('returns the new player object with the correct values', () => {
			const player = forcePlayerToPublishName(SOME_PLAYER, 'abc');
			makeSure(player.currentName).is('abc');
			makeSure(player.inventory).is('abc');
			makeSure(player.publishedName).is('abc');
		});

		it('works when repeated many times', () => {
			for (let numLoops = 0; numLoops < 25; numLoops++) {
				const publishedName = 'abc' + numLoops + "$".repeat(numLoops);
				const player = forcePlayerToPublishName(SOME_PLAYER, publishedName);
				makeSure(player.currentName).is(publishedName);
				makeSure(player.publishedName).is(publishedName);
			}
		});
	});

	describe('forcePlayerToAcceptNewTrade()', () => {
		it('returns a success result with the correct values', () => {
			const result = forcePlayerToAcceptNewTrade(SOME_PLAYER);
			makeSure(result.isFailure()).isFalse();
			makeSure(result.recipientPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.trade.status).is(TradeStatuses.ACCEPTED);
		});

		it('should work with a partially defined new trade', () => {
			const result = forcePlayerToAcceptNewTrade(SOME_PLAYER, {
				offeredCharacters: 'abc',
				initiatingPlayer: SOME_OTHER_PLAYER,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.recipientPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.initiatingPlayer.id).is(SOME_OTHER_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('abc');
			makeSure(result.trade.status).is(TradeStatuses.ACCEPTED);
		});

		it('should work with a fully defined new trade', () => {
			const result = forcePlayerToAcceptNewTrade(SOME_PLAYER, {
				id: 912397,
				offeredCharacters: 'abc',
				requestedCharacters: 'def',
				initiatingPlayer: SOME_PLAYER,
				recipientPlayer: SOME_OTHER_PLAYER,
				status: TradeStatuses.AWAITING_INITIATOR,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.recipientPlayer.id).is(SOME_OTHER_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('abc');
			makeSure(result.trade.requestedCharacters).is('def');
			makeSure(result.trade.status).is(TradeStatuses.ACCEPTED);
		});

		it('should work with a nonsensical defintion of the new trade', () => {
			const result = forcePlayerToAcceptNewTrade(SOME_PLAYER, {
				id: 912343243243297,
				offeredCharacters: '',
				requestedCharacters: 'asdsadasdsa909disa009def',
				initiatingPlayer: SOME_PLAYER,
				recipientPlayer: SOME_PLAYER,
				status: TradeStatuses.IGNORED,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.recipientPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('');
			makeSure(result.trade.requestedCharacters).is('asdsadasdsa909disa009def');
			makeSure(result.trade.status).is(TradeStatuses.ACCEPTED);
		});
	});

	describe('forcePlayerToInitiateTrade()', () => {
		it('returns a success result with the correct values', () => {
			const result = forcePlayerToInitiateTrade(SOME_PLAYER, {});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('should work with a partially defined new trade', () => {
			const result = forcePlayerToInitiateTrade(SOME_PLAYER, {
				offeredCharacters: 'abc',
				recipientPlayer: SOME_OTHER_PLAYER,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.recipientPlayer.id).is(SOME_OTHER_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('abc');
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('should work with a fully defined new trade', () => {
			const result = forcePlayerToInitiateTrade(SOME_PLAYER, {
				id: 912397,
				offeredCharacters: 'abc',
				requestedCharacters: 'def',
				initiatingPlayer: SOME_PLAYER,
				recipientPlayer: SOME_OTHER_PLAYER,
				status: TradeStatuses.AWAITING_INITIATOR,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.recipientPlayer.id).is(SOME_OTHER_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('abc');
			makeSure(result.trade.requestedCharacters).is('def');
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});

		it('should work with a nonsensical defintion of the new trade', () => {
			const result = forcePlayerToInitiateTrade(SOME_PLAYER, {
				id: 912343243243297,
				offeredCharacters: '',
				requestedCharacters: 'asdsadasdsa909disa009def',
				initiatingPlayer: SOME_PLAYER,
				recipientPlayer: SOME_PLAYER,
				status: TradeStatuses.IGNORED,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.initiatingPlayer.id).is(SOME_PLAYER.id);
			makeSure(result.recipientPlayer.id).isNot(SOME_PLAYER.id);
			makeSure(result.trade.offeredCharacters).is('');
			makeSure(result.trade.requestedCharacters).is('asdsadasdsa909disa009def');
			makeSure(result.trade.status).is(TradeStatuses.AWAITING_RECIPIENT);
		});
	});

	describe('forcePlayerToMineTokens()', () => {
		it('returns a success result with the correct values', () => {
			const result = forcePlayerToMineTokens(SOME_PLAYER, 250);
			makeSure(result.isFailure()).isFalse();
			makeSure(result.tokensEarned).is(250);
			makeSure(result.newTokenCount).is(SOME_PLAYER.tokens + 250);
		});

		it('should work when called many times', () => {
			for (let i = 0; i < 25; i++) {
				const result = forcePlayerToMineTokens(SOME_PLAYER, 250);
				makeSure(result.isFailure()).isFalse();
			}
		});
	});

	describe('forcePlayerToClaimRefill()', () => {
		it('returns a success result with the correct values', () => {
			const result = forcePlayerToClaimRefill(SOME_PLAYER, 250);
			makeSure(result.isFailure()).isFalse();
			makeSure(result.baseTokensEarned).is(250);
			makeSure(result.tokensFromRefillBonus).is(0);
			makeSure(result.newTokenCount).is(SOME_PLAYER.tokens + 250);
		});

		it('should work when called many times', () => {
			for (let i = 0; i < 25; i++) {
				const result = forcePlayerToClaimRefill(SOME_PLAYER, 250);
				makeSure(result.isFailure()).isFalse();
			}
		});
	});

	describe('forcePlayerToBuyNewMysteryBox()', () => {
		it('returns a success result with the correct values', () => {
			const result = forcePlayerToBuyNewMysteryBox(SOME_PLAYER);
			makeSure(result.isFailure()).isFalse();
			makeSure(result.player.id).is(SOME_PLAYER.id);
		});

		it('should work with partially defined mystery box', () => {
			const result = forcePlayerToBuyNewMysteryBox(SOME_PLAYER, { tokenCost: 250 });
			makeSure(result.isFailure()).isFalse();
			makeSure(result.player.id).is(SOME_PLAYER.id);
			makeSure(result.tokenCost).is(250);
		});

		it('should work with fully defined mystery box', () => {
			const result = forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
				id: 387249834,
				name: 'test',
				tokenCost: 250,
			});
			makeSure(result.isFailure()).isFalse();
			makeSure(result.player.id).is(SOME_PLAYER.id);
			makeSure(result.tokenCost).is(250);
		});

		it('should work when called many times', () => {
			for (let i = 0; i < 25; i++) {
				const result = forcePlayerToBuyNewMysteryBox(SOME_PLAYER);
				makeSure(result.isFailure()).isFalse();
			}
		});
	});
});