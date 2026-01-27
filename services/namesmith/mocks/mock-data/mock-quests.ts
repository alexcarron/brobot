import { getRandomNameUUID } from "../../../../utilities/random-utils";
import { WithAllOptional } from "../../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../../database/database-querier";
import { QuestRepository } from '../../repositories/quest.repository';
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerResolvable } from "../../types/player.types";
import { Quest, QuestDefinition, QuestResolvable } from '../../types/quest.types';
import { returnIfNotFailure } from "../../utilities/workflow.utility";
import { completeQuest } from "../../workflows/quests/complete-quest.workflow";

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
		name = getRandomNameUUID(),
		description = 'This is a mock description',
		tokensReward = 0,
		charactersReward = '',
		recurrence = 'daily',
		wasShown = false,
		isShown = false,
	} = questDefinition;

	return questRepository.addQuest({
		id,
		name,
		description,
		tokensReward,
		charactersReward,
		recurrence,
		wasShown,
		isShown,
	});
}

/**
 * Forces a player to complete an existing quest, setting them up so they can successfully complete it without failure.
 * This will ignore any criteria checks and complete the quest regardless of whether the player has met the criteria or not.
 * @param playerResolvable - The player resolving to complete the quest.
 * @param questResolvable - The quest that the player is resolving to complete.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function forcePlayerToCompleteQuest(
	playerResolvable: PlayerResolvable,
	questResolvable: QuestResolvable,
) {
	return returnIfNotFailure(
		completeQuest({
			playerResolvable: playerResolvable,
			questResolvable: questResolvable,
			checkIfMetCriteria: false,
		})
	)	
}


/**
 * Forces a player to complete a new quest, setting them up so they can successfully complete it without failure.
 * The quest is added to the database and the player is given the rewards.
 * @param playerResolvable - The player to force to complete the quest.
 * @param questResolvable - An optional object containing the quest definition to force the player to complete.
 * If not provided, a default mock quest definition is used.
 * @returns The result of the complete quest workflow, if the quest was completed successfully.
 */
export function forcePlayerToCompleteNewQuest(
	playerResolvable: PlayerResolvable,
	questResolvable: WithAllOptional<QuestDefinition> = {}
) {
	const { questService } = getNamesmithServices();
	const db = questService.questRepository.db;
	const quest = addMockQuest(db, questResolvable);
	return returnIfNotFailure(
		completeQuest({
			playerResolvable: playerResolvable,
			questResolvable: quest.id,
			checkIfMetCriteria: false,
		})
	);
}