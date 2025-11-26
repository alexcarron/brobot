import { isObject } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { QuestRepository } from "../repositories/quest.repository";
import { PlayerResolvable } from "../types/player.types";
import { Quest, QuestID, QuestResolvable, Reward } from "../types/quest.types";
import { createReward } from "../utilities/quest.utility";
import { ActivityLogService } from "./activity-log.service";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with quests.
 */
export class QuestService {
	constructor(
		public questRepository: QuestRepository,
		public activityLogService: ActivityLogService,
		public playerService: PlayerService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new QuestService(
			QuestRepository.fromDB(db),
			ActivityLogService.fromDB(db),
			PlayerService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return QuestService.fromDB(db);
	}

	/**
	 * Resolves a quest object from a given quest ID, quest name, or a quest object.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns The resolved quest object.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	resolveQuest(questResolvable: QuestResolvable): Quest {
		return this.questRepository.resolveQuest(questResolvable);
	}

	/**
	 * Resolves a quest ID from a given quest ID, quest name, or a quest object.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns The resolved quest ID.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	resolveID(questResolvable: QuestResolvable): QuestID {
		return this.questRepository.resolveID(questResolvable);
	}

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

	/**
	 * Returns an array of typed rewards for the given quest.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns An array of typed rewards for the given quest.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	getRewards(questResolvable: QuestResolvable): Reward[] {
		const rewards: Reward[] = [];
		const quest = this.resolveQuest(questResolvable);

		if (quest.tokensReward > 0) {
			rewards.push(
				createReward.tokens(quest.tokensReward),
			);
		}

		if (quest.charactersReward.length > 0) {
			rewards.push(
				createReward.characters(quest.charactersReward),
			);
		}

		return rewards;
	}

	/**
	 * Gives the rewards associated with a quest to a player.
	 * @param playerResolvable - The player to give the rewards to.
	 * @param questResolvable - The quest whose rewards are to be given.
	 */
	givePlayerRewards(playerResolvable: PlayerResolvable, questResolvable: QuestResolvable): void {
		const player = this.playerService.resolvePlayer(playerResolvable);
		const quest = this.resolveQuest(questResolvable);

		this.playerService.giveTokens(player, quest.tokensReward);
		this.playerService.giveCharacters(player, quest.charactersReward);
	}
}