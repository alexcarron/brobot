import { WithAllOptional } from "../../../../utilities/types/generic-types"
import { DatabaseQuerier } from "../../database/database-querier"
import { WeekRepository } from "../../repositories/week.repository";
import { Week, WeekDefinition } from "../../types/week.types"

/**
 * Factory function to create mock weeks for testing.
 * @param db - The database querier instance to use for insertion.
 * @param weekDefinition - Optional properties to override defaults.
 * @returns A newly created week with the given or default properties.
 */
export function addMockWeek(
	db: DatabaseQuerier,
	weekDefinition: WithAllOptional<WeekDefinition> = {}
): Week {
	const {
		timeStarted = new Date(),
	} = weekDefinition;

	const weekRepository = WeekRepository.fromDB(db);
	return weekRepository.addWeek({
		timeStarted,
	});
}
