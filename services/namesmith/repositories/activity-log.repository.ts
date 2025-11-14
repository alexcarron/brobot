import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { WithAtLeastOneProperty } from "../../../utilities/types/generic-types";
import { DatabaseQuerier, toEqualityConditionsPlaceholder } from "../database/database-querier";
import { ActivityLogID as ActivityLogID, ActivityLog, DBActivityLog, ActivityLogDefinition, ActivityTypes } from "../types/activity-log.types";
import { Player, PlayerID } from "../types/player.types";
import { Quest, QuestID } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
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

	/**
	 * Converts a DBActivityLog object to an ActivityLog object.
	 * @param dbActivityLog - The DBActivityLog object to convert.
	 * @returns The converted ActivityLog object.
	 */
	private toActivityLogFromDB(dbActivityLog: DBActivityLog): ActivityLog {
		const player = this.playerRepository.getPlayerOrThrow(dbActivityLog.playerID);

		const involvedPlayerID = dbActivityLog.involvedPlayerID;
		let involvedPlayer: Player | null = null;
		if (involvedPlayerID !== null) {
			if (involvedPlayer === player.id) {
				involvedPlayer = player;
			}
			else {
				involvedPlayer = this.playerRepository.getPlayerOrThrow(involvedPlayerID);
			}
		}

		const involvedRecipeID = dbActivityLog.involvedRecipeID;
		let involvedRecipe: Recipe | null = null;
		if (involvedRecipeID !== null) {
			involvedRecipe = this.recipeRepository.getRecipeOrThrow(involvedRecipeID);
		}

		const involvedQuestID = dbActivityLog.involvedQuestID;
		let involvedQuest: Quest | null = null;
		if (involvedQuestID !== null) {
			involvedQuest = this.questRepository.getQuestOrThrow(involvedQuestID);
		}

		return {
			...dbActivityLog,
			player,
			involvedPlayer,
			involvedRecipe,
			involvedQuest,
		};
	}

	getActivityLogs(): ActivityLog[] {
		const dbActivityLogs = this.db.getRows(
			"SELECT * FROM activityLog"
		) as DBActivityLog[];

		return dbActivityLogs.map(dbActivityLog => this.toActivityLogFromDB(dbActivityLog));
	}

	private getActivityLogByID(id: ActivityLogID): ActivityLog | null {
		const dbActivityLog = this.db.getRow(
			"SELECT * FROM activityLog WHERE id = @id LIMIT 1",
			{ id }
		) as DBActivityLog | undefined;

		if (dbActivityLog === undefined) {
			return null;
		}

		return this.toActivityLogFromDB(dbActivityLog);
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
		return this.db.getValue(
			"SELECT 1 FROM activityLog WHERE id = @id LIMIT 1",
			{ id }
		) === 1;
	}


	/**
	 * Adds an activity log to the database.
	 * @param {ActivityLogDefinition} activityLogDefinition - The activity log definition to add.
	 * @returns The added activity log object.
	 * @throws {ActivityLogAlreadyExistsError} If an activity log with the given ID already exists.
	 */
	addActivityLog(
		{id, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest}:
			ActivityLogDefinition
	) {
		const playerID = this.playerRepository.resolvePlayer(player).id;
		const involvedPlayerID =
			involvedPlayer
				? this.playerRepository.resolvePlayer(involvedPlayer).id
				: null;

		const involvedRecipeID =
			involvedRecipe
				? this.recipeRepository.resolveRecipe(involvedRecipe).id
				: null;

		const involvedQuestID =
			involvedQuest
				? this.questRepository.resolveQuest(involvedQuest).id
				: null;

		tokensDifference = tokensDifference ?? 0;

		const queryParameters = { playerID, type, tokensDifference, involvedPlayerID, involvedRecipeID, involvedQuestID };

		if (id === undefined) {
			const result = this.db.run(
				`INSERT INTO activityLog (playerID, type, tokensDifference, involvedPlayerID, involvedRecipeID, involvedQuestID)
				VALUES (@playerID, @type, @tokensDifference, @involvedPlayerID, @involvedRecipeID, @involvedQuestID)`,
				queryParameters
			);

			id = Number(result.lastInsertRowid);
		}
		else {
			if (this.doesActivityLogExist(id)) {
				throw new ActivityLogAlreadyExistsError(id);
			}

			this.db.run(
				`INSERT INTO activityLog (id, playerID, type, tokensDifference, involvedPlayerID, involvedRecipeID, involvedQuestID)
				VALUES (@id, @playerID, @type, @tokensDifference, @involvedPlayerID, @involvedRecipeID, @involvedQuestID)`,
				{ ...queryParameters, id }
			);
		}

		return this.getActivityLogOrThrow(id);
	}

	/**
	 * Finds all activity logs where all of the given properties is equal to the given value.
	 * @param queryParameters - An object with properties that are equal to the given value.
	 * @param queryParameters.id - The ID of the activity log.
	 * @param queryParameters.player - The player.
	 * @param queryParameters.type - The type of activity.
	 * @param queryParameters.tokensDifference - The difference in tokens.
	 * @param queryParameters.involvedPlayer - The involved player.
	 * @param queryParameters.involvedRecipe - The involved recipe.
	 * @param queryParameters.involvedQuest - The involved quest.
	 * @returns An array of activity logs that have all of the given properties equal to the given value.
	 */
	findActivityLogsWhere(
		{ id, player, type, tokensDifference, involvedPlayer, involvedRecipe, involvedQuest }:
			WithAtLeastOneProperty<ActivityLogDefinition>
	): ActivityLog[] {
		const playerID = player === undefined
			? undefined
			: this.playerRepository.resolvePlayer(player).id;

		let involvedPlayerID = involvedPlayer;
		if (involvedPlayer !== null && involvedPlayer !== undefined) {
			involvedPlayerID = this.playerRepository.resolvePlayer(involvedPlayer).id;
		}

		let involvedRecipeID = involvedRecipe;
		if (involvedRecipe !== null && involvedRecipe !== undefined) {
			involvedRecipeID = this.recipeRepository.resolveRecipe(involvedRecipe).id;
		}

		let involvedQuestID = involvedQuest;
		if (involvedQuest !== null && involvedQuest !== undefined) {
			involvedQuestID = this.questRepository.resolveQuest(involvedQuest).id;
		}

		const dbActivityLogs = this.db.getRows(
			`SELECT * FROM activityLog
			WHERE
				${toEqualityConditionsPlaceholder({ id, playerID, type, tokensDifference, involvedPlayerID, involvedRecipeID, involvedQuestID })}
			`,
			{ id, playerID, type, tokensDifference, involvedPlayerID, involvedRecipeID, involvedQuestID }
		) as DBActivityLog[];

		return dbActivityLogs.map(dbActivityLog => this.toActivityLogFromDB(dbActivityLog));
	}
}