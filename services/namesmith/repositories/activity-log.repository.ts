import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { resolveOptional } from "../../../utilities/optional-utils";
import { WithAtLeastOneProperty } from '../../../utilities/types/generic-types';
import { isNotNullable } from "../../../utilities/types/type-guards";
import { DatabaseQuerier, toParameterAndWhereClause, toParameterNotAndWhereClause } from "../database/database-querier";
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
import { PerkRepository } from './perk.repository';
import { MysteryBoxRepository } from "./mystery-box.repository";
import { RoleRepository } from "./role.repository";
import { MysteryBox } from "../types/mystery-box.types";
import { Perk } from "../types/perk.types";
import { Role } from "../types/role.types";

/**
 * Provides access to the activity log data.
 */
export class ActivityLogRepository {
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository,
		public recipeRepository: RecipeRepository,
		public questRepository: QuestRepository,
		public tradeRepository: TradeRepository,
		public perkRepository: PerkRepository,
		public roleRepository: RoleRepository,
		public mysteryBoxRepository: MysteryBoxRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ActivityLogRepository(
			db,
			PlayerRepository.fromDB(db),
			RecipeRepository.fromDB(db),
			QuestRepository.fromDB(db),
			TradeRepository.fromDB(db),
			PerkRepository.fromDB(db),
			RoleRepository.fromDB(db),
			MysteryBoxRepository.fromDB(db),
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

		const involvedPerkID = minimalActivityLog.involvedPerkID;
		let involvedPerk: Perk | null = null;
		if (involvedPerkID !== null) {
			involvedPerk = this.perkRepository.getPerkOrThrow(involvedPerkID);
		}

		const involvedRoleID = minimalActivityLog.involvedRoleID;
		let involvedRole: Role | null = null;
		if (involvedRoleID !== null) {
			involvedRole = this.roleRepository.getRoleOrThrow(involvedRoleID);
		}

		const involvedMysteryBoxID = minimalActivityLog.involvedMysteryBoxID;
		let involvedMysteryBox: MysteryBox | null = null;
		if (involvedMysteryBoxID !== null) {
			involvedMysteryBox = this.mysteryBoxRepository.getMysteryBoxOrThrow(involvedMysteryBoxID);
		}

		return {
			...minimalActivityLog,
			player,
			involvedPlayer,
			involvedRecipe,
			involvedQuest,
			involvedTrade,
			involvedPerk,
			involvedRole,
			involvedMysteryBox,
		};
	}

	getActivityLogs(): ActivityLog[] {
		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				ORDER BY timeOccured ASC`
			)
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
		activityLogDefinition: Partial<ActivityLogDefinition>
	): Partial<DBActivityLog> {
		const { id, timeOccured, player, type, nameChangedFrom, currentName, charactersGained, charactersLost, tokensDifference, timeCooldownExpired, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade, involvedPerk, involvedRole, involvedMysteryBox } = activityLogDefinition;

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
		const involvedPerkID = resolveOptional(involvedPerk,
			this.perkRepository.resolveID.bind(this.perkRepository)
		);
		const involvedRoleID = resolveOptional(involvedRole,
			this.roleRepository.resolveID.bind(this.roleRepository)
		);
		const involvedMysteryBoxID = resolveOptional(involvedMysteryBox,
			this.mysteryBoxRepository.resolveID.bind(this.mysteryBoxRepository)
		);

		return {
			id,
			timeOccured: DBDate.orUndefined.fromDomain(timeOccured),
			playerID,
			type,
			nameChangedFrom,
			currentName,
			charactersGained,
			charactersLost,
			tokensDifference,
			timeCooldownExpired: DBDate.orNull.orUndefined.fromDomain(timeCooldownExpired),
			involvedPlayerID,
			involvedRecipeID,
			involvedQuestID,
			involvedTradeID,
			involvedPerkID,
			involvedRoleID,
			involvedMysteryBoxID,
		};
	}

	/**
	 * Throws an error if any of the given entities do not exist.
	 * @param activityLogDefinition - The activity log definition to check.
	 * @throws {PlayerNotFoundError} if the player does not exist.
	 * @throws {RecipeNotFoundError} if the recipe does not exist.
	 * @throws {QuestNotFoundError} if the quest does not exist.
	 * @throws {TradeNotFoundError} if the trade does not exist.
	 * @throws {PerkNotFoundError} if the perk does not exist.
	 * @throws {RoleNotFoundError} if the role does not exist.
	 * @throws {MysteryBoxNotFoundError} if the mystery box does not exist.
	 */
	throwIfAnEntityDoesNotExist(activityLogDefinition: Partial<ActivityLogDefinition>) {
		const { player, involvedPlayer, involvedRecipe, involvedQuest, involvedTrade, involvedPerk, involvedRole, involvedMysteryBox } = activityLogDefinition;

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
		if (isNotNullable(involvedPerk)) {
			this.perkRepository.resolvePerk(involvedPerk);
		}
		if (isNotNullable(involvedRole)) {
			this.roleRepository.resolveRole(involvedRole);
		}
		if (isNotNullable(involvedMysteryBox)) {
			this.mysteryBoxRepository.resolveMysteryBox(involvedMysteryBox);
		}
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
		this.throwIfAnEntityDoesNotExist(activityLogDefinition);

		let {id, timeOccured, currentName} = activityLogDefinition;
		const {tokensDifference, nameChangedFrom, player, charactersGained, charactersLost, timeCooldownExpired} = activityLogDefinition;

		if (timeOccured === undefined)
			timeOccured = new Date();

		if (currentName === undefined)
			currentName = this.playerRepository.resolvePlayer(player).currentName;

		if (id !== undefined) {
			if (this.doesActivityLogExist(id))
				throw new ActivityLogAlreadyExistsError(id);
		}

		const insertedFields = this.toPartialDBActivityLog({
			...activityLogDefinition,
			timeOccured: timeOccured,
			nameChangedFrom: nameChangedFrom !== undefined
				? nameChangedFrom
				: null,
			currentName: currentName,
			charactersGained: charactersGained !== undefined
				? charactersGained
				: null,
			charactersLost: charactersLost !== undefined
				? charactersLost
				: null,
			tokensDifference: tokensDifference ?? 0,
			timeCooldownExpired: timeCooldownExpired !== undefined
				? timeCooldownExpired
				: null
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
		this.throwIfAnEntityDoesNotExist(activityLogDefinition);

		const queryParameters = this.toPartialDBActivityLog(activityLogDefinition);

		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE
					${toParameterAndWhereClause(queryParameters)}
				ORDER BY timeOccured ASC
				`,
				queryParameters
			)
		);

		return minimalActivityLogs.map(dbActivityLog => this.toActivityLogFromMinimal(dbActivityLog));
	}

	/**
	 * Finds all activity logs after a given time.
	 * @param minimumTimeOccured - The time after which the activity logs should be found.
	 * @returns An array of activity log objects.
	 */
	findActivityLogsAfterTime(minimumTimeOccured: Date): ActivityLog[] {
		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE timeOccured > @minimumTimeOccured
				ORDER BY timeOccured ASC`,
				{ minimumTimeOccured: DBDate.fromDomain(minimumTimeOccured) }
			)
		);

		return minimalActivityLogs.map(dbActivityLog => this.toActivityLogFromMinimal(dbActivityLog));
	}

	findActivityLogsAfterTimeWhere(minimumTimeOccured: Date,
		activityLogDefinition: WithAtLeastOneProperty<ActivityLogDefinition>): ActivityLog[]
	{
		this.throwIfAnEntityDoesNotExist(activityLogDefinition);

		const queryParameters = this.toPartialDBActivityLog(activityLogDefinition);

		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE
					timeOccured > @minimumTimeOccured AND
					${toParameterAndWhereClause(queryParameters)}
				ORDER BY timeOccured ASC
				`,
				{
					...queryParameters,
					minimumTimeOccured: DBDate.fromDomain(minimumTimeOccured),
				}
			)
		);

		return minimalActivityLogs.map(dbActivityLog => this.toActivityLogFromMinimal(dbActivityLog));
	}

	findActivityLogsAfterTimeWhereNot(
		minimumTimeOccured: Date,
		activityLogDefinition: WithAtLeastOneProperty<ActivityLogDefinition>
	): ActivityLog[] {
		this.throwIfAnEntityDoesNotExist(activityLogDefinition);

		const queryParameters = this.toPartialDBActivityLog(activityLogDefinition);

		const minimalActivityLogs = asMinimalActivityLogs(
			this.db.getRows(
				`SELECT * FROM activityLog
				WHERE
					timeOccured > @minimumTimeOccured AND
					${toParameterNotAndWhereClause(queryParameters)}
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