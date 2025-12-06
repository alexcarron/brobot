import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { ActivityLogRepository } from "../../repositories/activity-log.repository";
import { ActivityLog, ActivityLogDefinition, ActivityTypes } from '../../types/activity-log.types';
import { addMockPlayer } from "./mock-players";

/**
 * Adds a mock activity log to the given database.
 * @param db - The database to add the mock activity log to.
 * @param activityLogDefinition - An optional object containing the activity log definition to add.
 * If not provided, a default mock activity log definition is used.
 * @returns The added mock activitylog object.
 */
export function addMockActivityLog(
	db: DatabaseQuerier,
	activityLogDefinition: WithAllOptional<ActivityLogDefinition> = {}
): ActivityLog {
	const activitylogRepository = ActivityLogRepository.fromDB(db);
	let { player = undefined } = activityLogDefinition;
	const {
		id = undefined,
		timeOccured = new Date(),
		type = ActivityTypes.MINE_TOKENS,
		tokensDifference = 0,
		involvedPlayer = null,
		involvedRecipe = null,
		involvedQuest = null,
	} = activityLogDefinition;

	if (player === undefined)
		player = addMockPlayer(db);

	return activitylogRepository.addActivityLog({
		id,
		timeOccured,
		player,
		type,
		tokensDifference,
		involvedPlayer,
		involvedRecipe,
		involvedQuest,
	});
}