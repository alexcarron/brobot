import { WithAllOptional } from "../../../../utilities/types/generic-types"
import { DatabaseQuerier } from "../../database/database-querier"
import { DayRepository } from "../../repositories/day.repository";
import { Day, DayDefinition } from "../../types/day.types"

export function addMockDay(
	db: DatabaseQuerier,
	dayDefinition: WithAllOptional<DayDefinition> = {}
): Day {
	const {
		timeStarted = new Date(),
	} = dayDefinition;

	const dayRepository = DayRepository.fromDB(db);
	return dayRepository.addDay({timeStarted});
}