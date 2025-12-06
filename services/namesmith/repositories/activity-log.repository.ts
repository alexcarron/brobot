import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { resolveOptional } from "../../../utilities/optional-utils";
import { WithAtLeastOneProperty } from '../../../utilities/types/generic-types';
import { isNotNullable } from "../../../utilities/types/type-guards";
import { DatabaseQuerier, toParameterANDWhereClause } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { ActivityLogID as ActivityLogID, ActivityLog, ActivityLogDefinition, MinimalActivityLog, asMinimalActivityLog, asMinimalActivityLogs, DBActivityLog } from "../types/activity-log.types";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { DBDate } from "../utilities/db.utility";
import { ActivityLogAlreadyExistsError, ActivityLogNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";
import { QuestRepository } from "./quest.repository";
import { RecipeRepository } from "./recipe.repository";

/**
 * Provides access to the activity log data.
 */
export class ActivityLogRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param playerRepository - The player repository instance used for retrieving player data.
	 * @param recipeRepository - The recipe repository instance used for retrieving recipe data.
	 * @param questRepository - The quest repository instance used for retrieving quest data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository,
		public recipeRepository: RecipeRepository,
		public questRepository: QuestRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ActivityLogRepository(
			db,
			PlayerRepository.fromDB(db),
			RecipeRepository.fromDB(db),
			QuestRepository.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return ActivityLogRepository.fromDB(db);
	}

	/**
	 * Converts a DBActivityLog object to an ActivityLog object.
	 * @param minimalActivityLog - The minimal ActivityLog object to convert.
	 * @returns The converted ActivityLog object.
	 */
	private toActivityLogFromMinimal(minimalActivityLog: MinimalActivityLog): ActivityLog {
		const player = this.playerRepository.getPlayerOrThrow(minimalActivityLog.playerID);

		const involvedPlayerID = minimalActivityLog.involvedPlayerID;
		let involvedPlayer: Player | null = null;
		if (involvedPlayerID !== null) {
			if (involvedPlayer === player.id) {
				involvedPlayer = player;
			}
			else {
				involvedPlayer = this.playerRepository.getPlayerOrThrow(involvedPlayerID);
			}
		}

		const involvedRecipeID = minimalActivityLog.involvedRecipeID;
		let involvedRecipe: Recipe | null = null;
		if (involvedRecipeID !== null) {
			involvedRecipe = this.recipeRepository.getRecipeOrThrow(involvedRecipeID);
		}

		const involvedQuestID = minimalActivityLog.involvedQuestID;
		let involvedQuest: Quest | null = null;
		if (involvedQuestID !== null) {
			involvedQuest = this.questRepository.getQuestOrThrow(involvedQuestID);
		}

		return {
			...minimalActivityLog,
			player,
			involvedPlayer,
			involvedRecipe,
			involvedQuest,
		};
	}

	getActivityLogs(): ActivityLog[] {
		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows("SELECT * FROM activityLog")
		)

		return minimalActivityLogs.map(log =>
			this.toActivityLogFromMinimal(log)
		);
	}

	private getActivityLogByID(id: ActivityLogID): ActivityLog | null {
		const row = this.db.getRow(
			"SELECT * FROM activityLog WHERE id = @id LIMIT 1",
			{ id }
		);

		if (row === undefined) {
			return null;
		}

		return this.toActivityLogFromMinimal(
			asMinimalActivityLog(row)
		);
	}

	/**
	 * Retrieves an activity log by its ID, or throws an error if it does not exist.
	 * @param id - The ID of the activity log to retrieve.
	 * @throws ActivityLogNotFoundError if the activity log with the given ID does not exist.
	 * @returns The activity log with the given ID.
	 */
	getActivityLogOrThrow(id: ActivityLogID): ActivityLog {
		return returnNonNullOrThrow(
			this.getActivityLogByID(id),
			new ActivityLogNotFoundError(id)
		)
	}

	/**
	 * Checks if an activity log with the given ID exists.
	 * @param id - The ID of the activity log to check.
	 * @returns True if the activity log exists, false otherwise.
	 */
	private doesActivityLogExist(id: ActivityLogID): boolean {
		return this.db.doesExistInTable('activityLog', { id });
	}

	toPartialDBActivityLog(
		{ id, timeOccured, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest }: Partial<ActivityLogDefinition>
	): Partial<DBActivityLog> {
		const playerID = resolveOptional(player,
			this.playerRepository.resolveID.bind(this.playerRepository)
		);
		const involvedPlayerID = resolveOptional(involvedPlayer,
			this.playerRepository.resolveID.bind(this.playerRepository)
		);
		const involvedRecipeID = resolveOptional(involvedRecipe,
			this.recipeRepository.resolveID.bind(this.recipeRepository)
		);
		const involvedQuestID = resolveOptional(involvedQuest,
			this.questRepository.resolveID.bind(this.questRepository)
		);

		return {
			id,
			timeOccured: DBDate.orUndefined.fromDomain(timeOccured),
			playerID,
			type,
			tokensDifference,
			involvedPlayerID,
			involvedRecipeID,
			involvedQuestID,
		};
	}

	/**
	 * Adds an activity log to the database.
	 * @param {ActivityLogDefinition} activityLogDefinition - The activity log definition to add.
	 * @returns The added activity log object.
	 * @throws {ActivityLogAlreadyExistsError} If an activity log with the given ID already exists.
	 */
	addActivityLog(
		{id, timeOccured, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest}:
			ActivityLogDefinition
	) {
		if (timeOccured === undefined) timeOccured = new Date();
		
		this.playerRepository.resolvePlayer(player);
		if (isNotNullable(involvedPlayer)) {
			this.playerRepository.resolvePlayer(involvedPlayer);
		}
		if (isNotNullable(involvedRecipe)) {
			this.recipeRepository.resolveRecipe(involvedRecipe);
		}
		if (isNotNullable(involvedQuest)) {
			this.questRepository.resolveQuest(involvedQuest);
		}
		if (id !== undefined) {
			if (this.doesActivityLogExist(id))
				throw new ActivityLogAlreadyExistsError(id);
		}

		const insertedFields = this.toPartialDBActivityLog({
			id,
			timeOccured,
			player,
			type,
			tokensDifference: tokensDifference ?? 0,
			involvedPlayer,
			involvedRecipe,
			involvedQuest,
		});

		id = this.db.insertIntoTable('activityLog', insertedFields);
		return this.getActivityLogOrThrow(id);
	}

	/**
	 * Finds all activity logs where all of the given properties is equal to the given value.
	 * @param queryParameters - An object with properties that are equal to the given value.
	 * @param queryParameters.id - The ID of the activity log.
	 * @param queryParameters.timeOccured - The time the activity log occurred.
	 * @param queryParameters.player - The player.
	 * @param queryParameters.type - The type of activity.
	 * @param queryParameters.tokensDifference - The difference in tokens.
	 * @param queryParameters.involvedPlayer - The involved player.
	 * @param queryParameters.involvedRecipe - The involved recipe.
	 * @param queryParameters.involvedQuest - The involved quest.
	 * @returns An array of activity logs that have all of the given properties equal to the given value.
	 */
	findActivityLogsWhere(
		{ id, timeOccured, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest }:
			WithAtLeastOneProperty<ActivityLogDefinition>
	): ActivityLog[] {
		if (isNotNullable(player)) {
			this.playerRepository.resolvePlayer(player);
		}
		if (isNotNullable(involvedPlayer)) {
			this.playerRepository.resolvePlayer(involvedPlayer);
		}
		if (isNotNullable(involvedRecipe)) {
			this.recipeRepository.resolveRecipe(involvedRecipe);
		}
		if (isNotNullable(involvedQuest)) {
			this.questRepository.resolveQuest(involvedQuest);
		}

		const queryParameters = this.toPartialDBActivityLog({
			id, timeOccured, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest,
		});

		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE
					${toParameterANDWhereClause(queryParameters)}
				`,
				queryParameters
			)
		);

		return minimalActivityLogs.map(dbActivityLog => this.toActivityLogFromMinimal(dbActivityLog));
	}
}