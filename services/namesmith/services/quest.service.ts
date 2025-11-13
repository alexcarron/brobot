import { isObject } from "../../../utilities/types/type-guards";
import { QuestRepository } from "../repositories/quest.repository";
import { QuestResolvable } from "../types/quest.types";

/**
 * Provides methods for interacting with quests.
 */
export class QuestService {
	constructor(
		public questRepository: QuestRepository,
	) {}

	/**
	 * Checks if the given quest resolvable is a real quest.
	 * @param questResolvable - The quest resolvable to check.
	 * @returns True if the given quest resolvable is a real quest, false otherwise.
	 */
	isQuest(questResolvable: QuestResolvable): boolean {
		if (!isObject(questResolvable)) {
			return this.questRepository.doesQuestExist(questResolvable);
		}
		else {
			return this.questRepository.doesQuestExist(questResolvable.id);
		}
	}
}