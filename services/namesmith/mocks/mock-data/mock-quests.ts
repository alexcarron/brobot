import { getRandomName } from "../../../../utilities/random-utils";
import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { QuestRepository } from "../../repositories/quest.repository";
import { Quest, QuestDefinition } from '../../types/quest.types';

/**
 * Adds a mock quest to the given database.
 * @param db - The database to add the mock quest to.
 * @param questDefinition - An optional object containing the quest definition to add.
 * If not provided, a default mock quest definition is used.
 * @returns The added mock quest object.
 */
export function addMockQuest(
	db: DatabaseQuerier,
	questDefinition: WithAllOptional<QuestDefinition> = {}
): Quest {
	const questRepository = QuestRepository.fromDB(db);
	const {
		id = undefined,
		name = getRandomName(),
		description = 'This is a mock description',
		tokensReward = 0,
		charactersReward = '',
		wasShown = false,
		isShown = false,
	} = questDefinition;

	return questRepository.addQuest({
		id,
		name,
		description,
		tokensReward,
		charactersReward,
		wasShown,
		isShown,
	});
}