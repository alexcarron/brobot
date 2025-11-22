import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_ACTIVITY_LOG_ID, INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_RECIPE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { ActivityLog, ActivityTypes } from "../types/activity-log.types";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { ActivityLogAlreadyExistsError, ActivityLogNotFoundError, PlayerNotFoundError, QuestNotFoundError, RecipeNotFoundError } from "../utilities/error.utility";
import { ActivityLogRepository } from "./activity-log.repository";

describe('ActivityLogRepository', () => {
	let activityLogRepository: ActivityLogRepository;
	let db: DatabaseQuerier;

	let SOME_ACTIVITY_LOG: ActivityLog;
	let SOME_PLAYER: Player;
	let INVOLVED_PLAYER: Player;
	let SOME_RECIPE: Recipe;
	let SOME_QUEST: Quest;

	beforeEach(() => {
		activityLogRepository = ActivityLogRepository.asMock();
		db = activityLogRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		INVOLVED_PLAYER = addMockPlayer(db);
		SOME_RECIPE = addMockRecipe(db);
		SOME_QUEST = addMockQuest(db);

		SOME_ACTIVITY_LOG = addMockActivityLog(db, {
			player: SOME_PLAYER.id,
			type: ActivityTypes.BUY_MYSTERY_BOX,
			tokensDifference: -50,
			involvedPlayer: INVOLVED_PLAYER.id,
			involvedRecipe: SOME_RECIPE.id,
			involvedQuest: SOME_QUEST.id,
		});
	});

	describe('getActivityLogs', () => {
		it('returns all activity logs as full objects', () => {
			const activityLogs = activityLogRepository.getActivityLogs();
			makeSure(activityLogs).isNotEmpty();
			makeSure(activityLogs).haveProperties(
				'id', 'player', 'type', 'tokensDifference', 'involvedPlayer', 'involvedRecipe'
			)
			makeSure(activityLogs).contains(SOME_ACTIVITY_LOG);
		});
	});

	describe('getActivityLogOrThrow()', () => {
		it('returns the activity log with the given ID', () => {
			const activityLog = activityLogRepository.getActivityLogOrThrow(SOME_ACTIVITY_LOG.id);
			makeSure(activityLog).is(SOME_ACTIVITY_LOG);
		});

		it('throws an ActivityLogNotFoundError if the activity log does not exist', () => {
			makeSure(() =>
				activityLogRepository.getActivityLogOrThrow(INVALID_ACTIVITY_LOG_ID)
			).throws(ActivityLogNotFoundError);
		});
	});

	describe('addActivityLog()', () => {
		it('adds an activity log to the database', () => {
			const activityLog = activityLogRepository.addActivityLog({
				id: 10000001,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -50,
				involvedPlayer: INVOLVED_PLAYER.id,
				involvedRecipe: SOME_RECIPE.id,
				involvedQuest: SOME_QUEST.id,
			});

			makeSure(activityLog).hasProperties({
				id: 10000001,
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -50,
				involvedPlayer: INVOLVED_PLAYER,
				involvedRecipe: SOME_RECIPE,
				involvedQuest: SOME_QUEST,
			});

			const retrievedActivityLog = activityLogRepository.getActivityLogOrThrow(10000001);

			makeSure(retrievedActivityLog).is(activityLog);
		});

		it('generates an id if one is not provided', () => {
			const activityLog = activityLogRepository.addActivityLog({
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
			});

			makeSure(activityLog.id).isANumber();

			const retrievedActivityLog = activityLogRepository.getActivityLogOrThrow(activityLog.id);

			makeSure(retrievedActivityLog).is(activityLog);
		});

		it('handles optional fields', () => {
			const activityLog = activityLogRepository.addActivityLog({
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: 0,
			});
			makeSure(activityLog.involvedPlayer).isNull();
			makeSure(activityLog.involvedRecipe).isNull();
			makeSure(activityLog.involvedQuest).isNull();

			const retrievedActivityLog = activityLogRepository.getActivityLogOrThrow(activityLog.id);

			makeSure(retrievedActivityLog).is(activityLog);
		});

		it('throws an ActivityLogAlreadyExistsError if the activity log already exists', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					id: SOME_ACTIVITY_LOG.id,
					player: SOME_PLAYER.id,
					type: ActivityTypes.BUY_MYSTERY_BOX,
					tokensDifference: -50,
					involvedPlayer: INVOLVED_PLAYER.id,
					involvedRecipe: SOME_RECIPE.id,
					involvedQuest: SOME_QUEST.id,
				})
			).throws(ActivityLogAlreadyExistsError);
		});

		it('throws a PlayerNotFoundError if the player does not exist', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					player: INVALID_PLAYER_ID,
					type: ActivityTypes.BUY_MYSTERY_BOX,
				})
			).throws(PlayerNotFoundError);
		});

		it('throws a PlayerNotFoundError if the involved player does not exist', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					player: SOME_PLAYER.id,
					type: ActivityTypes.BUY_MYSTERY_BOX,
					involvedPlayer: INVALID_PLAYER_ID,
				})
			).throws(PlayerNotFoundError);
		});

		it('throws a RecipeNotFoundError if the involved recipe does not exist', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					player: SOME_PLAYER.id,
					type: ActivityTypes.BUY_MYSTERY_BOX,
					involvedRecipe: INVALID_RECIPE_ID,
				})
			).throws(RecipeNotFoundError);
		});

		it('throws a QuestNotFoundError if the involved quest does not exist', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					player: SOME_PLAYER.id,
					type: ActivityTypes.BUY_MYSTERY_BOX,
					involvedQuest: INVALID_QUEST_ID,
				})
			).throws(QuestNotFoundError);
		});
	});

	describe('findActivityLogsWhere()', () => {
		it('finds activity log by id', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				id: SOME_ACTIVITY_LOG.id
			});
			makeSure(foundActivityLogs).hasLengthOf(1);
			makeSure(foundActivityLogs[0]).is(SOME_ACTIVITY_LOG);
		});

		it('finds activity logs by player (multiple results)', () => {
			// Create a second log with the same player
			const secondActivityLog = addMockActivityLog(db, {
				player: SOME_PLAYER.id,
				type: ActivityTypes.ACCEPT_TRADE,
			});

			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				player: SOME_PLAYER.id
			});
			makeSure(foundActivityLogs).isNotEmpty();

			// Should contain both logs for this player
			makeSure(foundActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundActivityLogs).contains(secondActivityLog);
		});

		it('finds activity logs by type', () => {
			// create a log of a different type to ensure filtering works
			const newActivityLog = addMockActivityLog(db, {
				player: INVOLVED_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
			});

			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				type: ActivityTypes.BUY_MYSTERY_BOX
			});
			makeSure(foundActivityLogs).isNotEmpty();

			// Should include the original SOME_ACTIVITY_LOG and the new buyBoxLog
			makeSure(foundActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundActivityLogs).contains(newActivityLog);
		});

		it('finds activity logs by tokensDifference', () => {
			// create logs with specific tokensDifference values
			const gainTokensActivityLog = addMockActivityLog(db, {
				player: SOME_PLAYER.id,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 25,
			});
			const loseTokensActivityLog = addMockActivityLog(db, {
				player: INVOLVED_PLAYER.id,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: -50,
			});

			const foundNegativeActivityLogs = activityLogRepository.findActivityLogsWhere({
				tokensDifference: -50
			});
			makeSure(foundNegativeActivityLogs).isNotEmpty();

			// SOME_ACTIVITY_LOG has tokensDifference -50 and tokensNeg also does
			makeSure(foundNegativeActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundNegativeActivityLogs).contains(loseTokensActivityLog);

			const foundPositiveActivityLogs = activityLogRepository.findActivityLogsWhere({ tokensDifference: 25 });
			makeSure(foundPositiveActivityLogs).hasLengthOf(1);
			makeSure(foundPositiveActivityLogs[0]).is(gainTokensActivityLog);
		});

		it('finds activity logs by involvedPlayer', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				involvedPlayer: INVOLVED_PLAYER.id
			});
			makeSure(foundActivityLogs).isNotEmpty();
			makeSure(foundActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundActivityLogs[0]).hasProperties('involvedPlayer');
		});

		it('finds activity logs by involvedRecipe', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				involvedRecipe: SOME_RECIPE.id
			});
			makeSure(foundActivityLogs).isNotEmpty();
			makeSure(foundActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundActivityLogs[0]).hasProperties('involvedRecipe');
		});

		it('finds activity logs by involvedQuest', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				involvedQuest: SOME_QUEST.id
			});

			makeSure(foundActivityLogs).isNotEmpty();
			makeSure(foundActivityLogs).contains(SOME_ACTIVITY_LOG);
			makeSure(foundActivityLogs[0]).hasProperties('involvedQuest');
		});

		it('finds activity logs matching multiple properties (AND semantics)', () => {
			const claimRefillLog = addMockActivityLog(db, {
				player: SOME_PLAYER.id,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 10,
			});

			const buyBoxLog = addMockActivityLog(db, {
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
			});

			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				player: SOME_PLAYER.id,
				type: ActivityTypes.CLAIM_REFILL,
			});

			makeSure(foundActivityLogs).contains(claimRefillLog);
			makeSure(foundActivityLogs).doesNotContain(buyBoxLog);
		});

		it('returns empty array when nothing matches', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({
				player: SOME_PLAYER.id,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 2931723129,
			});
			makeSure(foundActivityLogs).isEmpty();
		});

		it('returns full activity log objects (with resolved player/ids converted to objects)', () => {
			const foundActivityLogs = activityLogRepository.findActivityLogsWhere({ id: SOME_ACTIVITY_LOG.id });
			makeSure(foundActivityLogs).hasLengthOf(1);

			const activity = foundActivityLogs[0];
			makeSure(activity).hasProperties('id', 'player', 'type', 'tokensDifference', 'involvedPlayer', 'involvedRecipe', 'involvedQuest');

			makeSure(activity.player).hasProperties('id', 'currentName');

			if (activity.involvedPlayer)
				makeSure(activity.involvedPlayer).hasProperties('id', 'currentName');
		});

		it('throws appriopriate NotFound error for each invalid resolvable', () => {
			makeSure(() =>
				activityLogRepository.findActivityLogsWhere({
					player: INVALID_PLAYER_ID
				})
			).throws(PlayerNotFoundError);

			makeSure(() =>
				activityLogRepository.findActivityLogsWhere({
					involvedPlayer: INVALID_PLAYER_ID
				})
			).throws(PlayerNotFoundError);

			makeSure(() =>
				activityLogRepository.findActivityLogsWhere({
					involvedRecipe: INVALID_RECIPE_ID
				})
			).throws(RecipeNotFoundError);

			makeSure(() =>
				activityLogRepository.findActivityLogsWhere({
					involvedQuest: INVALID_QUEST_ID
				})
			).throws(QuestNotFoundError);
		});
	});

	describe('toPartialDBActivityLog()', () => {
		it('converts an activity log definition object to a DB activity log object', () => {
			const partialDBActivityLog = activityLogRepository.toPartialDBActivityLog({
				id: SOME_ACTIVITY_LOG.id,
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: 10,
				involvedPlayer: INVOLVED_PLAYER,
				involvedRecipe: SOME_RECIPE,
				involvedQuest: SOME_QUEST,
			});

			makeSure(partialDBActivityLog).hasProperties({
				id: SOME_ACTIVITY_LOG.id,
				playerID: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: 10,
				involvedPlayerID: INVOLVED_PLAYER.id,
				involvedRecipeID: SOME_RECIPE.id,
				involvedQuestID: SOME_QUEST.id,
			});
		});

		it('handles null/undefined involved fields correctly', () => {
			const partialDBActivityLog = activityLogRepository.toPartialDBActivityLog({
				id: SOME_ACTIVITY_LOG.id,
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: 10,
				involvedPlayer: null,
				involvedRecipe: undefined,
				involvedQuest: null,
			});

			makeSure(partialDBActivityLog).hasProperties({
				id: SOME_ACTIVITY_LOG.id,
				playerID: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: 10,
				involvedPlayerID: null,
				involvedRecipeID: undefined,
				involvedQuestID: null,
			});
		});

		it('handles missing optional fields correctly', () => {
			const partialDBActivityLog = activityLogRepository.toPartialDBActivityLog({
				id: SOME_ACTIVITY_LOG.id,
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
			});

			makeSure(partialDBActivityLog).hasProperties({
				id: SOME_ACTIVITY_LOG.id,
				playerID: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: undefined,
				involvedPlayerID: undefined,
				involvedRecipeID: undefined,
				involvedQuestID: undefined,
			});
		});

		it('handles no fields correctly', () => {
			const partialDBActivityLog = activityLogRepository.toPartialDBActivityLog({});

			makeSure(partialDBActivityLog).hasProperties({
				id: undefined,
				playerID: undefined,
				type: undefined,
				tokensDifference: undefined,
				involvedPlayerID: undefined,
				involvedRecipeID: undefined,
				involvedQuestID: undefined,
			});
		});
	});
});