import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_ACTIVITY_LOG_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { createMockActivityLogRepo } from "../mocks/mock-repositories";
import { ActivityLog, ActivityTypes } from "../types/activity-log.types";
import { Player } from "../types/player.types";
import { Recipe } from "../types/recipe.types";
import { ActivityLogAlreadyExistsError, ActivityLogNotFoundError } from "../utilities/error.utility";
import { ActivityLogRepository } from "./activity-log.repository";

describe('ActivityLogRepository', () => {
	let activityLogRepository: ActivityLogRepository;
	let db: DatabaseQuerier;

	let SOME_ACTIVITY_LOG: ActivityLog;
	let SOME_PLAYER: Player;
	let INVOLVED_PLAYER: Player;
	let SOME_RECIPE: Recipe;

	beforeEach(() => {
		activityLogRepository = createMockActivityLogRepo();
		db = activityLogRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		INVOLVED_PLAYER = addMockPlayer(db);

		SOME_RECIPE = addMockRecipe(db);

		SOME_ACTIVITY_LOG = addMockActivityLog(db, {
			player: SOME_PLAYER.id,
			type: ActivityTypes.BUY_MYSTERY_BOX,
			tokensDifference: -50,
			involvedPlayer: INVOLVED_PLAYER.id,
			involvedRecipe: SOME_RECIPE.id,
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
				involvedRecipe: SOME_RECIPE.id
			});

			makeSure(activityLog).includesObject({
				id: 10000001,
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -50,
				involvedPlayer: INVOLVED_PLAYER,
				involvedRecipe: SOME_RECIPE
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

		it('throws an ActivityLogAlreadyExistsError if the activity log already exists', () => {
			makeSure(() =>
				activityLogRepository.addActivityLog({
					id: SOME_ACTIVITY_LOG.id,
					player: SOME_PLAYER.id,
					type: ActivityTypes.BUY_MYSTERY_BOX,
					tokensDifference: -50,
					involvedPlayer: INVOLVED_PLAYER.id,
					involvedRecipe: SOME_RECIPE.id
				})
			).throws(ActivityLogAlreadyExistsError);
		});
	});
});