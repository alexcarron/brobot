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
import { Trade } from "../types/trade.types";
import { DBDate } from "../utilities/db.utility";
import { ActivityLogAlreadyExistsError, ActivityLogNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";
import { QuestRepository } from "./quest.repository";
import { RecipeRepository } from "./recipe.repository";
import { TradeRepository } from './trade.repository';

/**
 * Provides access to the activity log data.
 */
export class ActivityLogRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param playerRepository - The player repository instance used for retrieving player data.
	 * @param recipeRepository - The recipe repository instance used for retrieving recipe data.
	 * @param questRepository - The quest repository instance used for retrieving quest data.
	 * @param tradeRepository - The trade repository instance used for retrieving trade data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository,
		public recipeRepository: RecipeRepository,
		public questRepository: QuestRepository,
		public tradeRepository: TradeRepository
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ActivityLogRepository(
			db,
			PlayerRepository.fromDB(db),
			RecipeRepository.fromDB(db),
			QuestRepository.fromDB(db),
			TradeRepository.fromDB(db),
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

		const involvedTradeID = minimalActivityLog.involvedTradeID;
		let involvedTrade: Trade | null = null;
		if (involvedTradeID !== null) {
			involvedTrade = this.tradeRepository.getTradeOrThrow(involvedTradeID);
		}

		return {
			...minimalActivityLog,
			player,
			involvedPlayer,
			involvedRecipe,
			involvedQuest,
			involvedTrade,
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
		{ id, timeOccured, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade }: Partial<ActivityLogDefinition>
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
		const involvedTradeID = resolveOptional(involvedTrade,
			this.tradeRepository.resolveID.bind(this.tradeRepository)
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
			involvedTradeID,
		};
	}

	/**
	 * Adds an activity log to the database.
	 * @param {ActivityLogDefinition} activityLogDefinition - The activity log definition to add.
	 * @returns The added activity log object.
	 * @throws {ActivityLogAlreadyExistsError} If an activity log with the given ID already exists.
	 */
	addActivityLog(
		activityLogDefinition: ActivityLogDefinition
	) {
		let {id, timeOccured} = activityLogDefinition;
		const {player, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade} = activityLogDefinition;

		if (timeOccured === undefined)
			timeOccured = new Date();

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
		if (isNotNullable(involvedTrade)) {
			this.tradeRepository.resolveTrade(involvedTrade);
		}
		if (id !== undefined) {
			if (this.doesActivityLogExist(id))
				throw new ActivityLogAlreadyExistsError(id);
		}

		const insertedFields = this.toPartialDBActivityLog({
			...activityLogDefinition,
			tokensDifference: tokensDifference ?? 0,
			timeOccured: timeOccured,
		});

		id = this.db.insertIntoTable('activityLog', insertedFields);
		return this.getActivityLogOrThrow(id);
	}

	/**
	 * Finds all activity logs where all of the given properties is equal to the given value.
	 * @param activityLogDefinition - The activity log definition to find.
	 * @returns An array of activity log objects.
	 */
	findActivityLogsWhere(
		activityLogDefinition:
			WithAtLeastOneProperty<ActivityLogDefinition>
	): ActivityLog[] {
		const { player, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade } = activityLogDefinition;

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
		if (isNotNullable(involvedTrade)) {
			this.tradeRepository.resolveTrade(involvedTrade);
		}

		const queryParameters = this.toPartialDBActivityLog(activityLogDefinition);

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

	findActivityLogsAfterTimeWhere(minimumTimeOccured: Date,
		activityLogDefinition: WithAtLeastOneProperty<ActivityLogDefinition>): ActivityLog[]
	{
		const { player, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade } = activityLogDefinition;

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
		if (isNotNullable(involvedTrade)) {
			this.tradeRepository.resolveTrade(involvedTrade);
		}

		const queryParameters = this.toPartialDBActivityLog(activityLogDefinition);

		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE
					timeOccured > @minimumTimeOccured AND
					${toParameterANDWhereClause(queryParameters)}
				`,
				{
					...queryParameters,
					minimumTimeOccured: DBDate.fromDomain(minimumTimeOccured),
				}
			)
		);

		return minimalActivityLogs.map(dbActivityLog => this.toActivityLogFromMinimal(dbActivityLog));
	}

	/**
	 * Returns the latest activity log object from the database.
	 * @returns The latest activity log object.
	 */
	getLatestActivityLog(): ActivityLog {
		const minimalActivityLogs = asMinimalActivityLog(
			this.db.getRow(`
				SELECT * FROM activityLog
				ORDER BY timeOccured DESC
				LIMIT 1
			`)
		);

		return this.toActivityLogFromMinimal(minimalActivityLogs);
	}
}