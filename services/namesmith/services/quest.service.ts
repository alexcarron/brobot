import { isObject } from "../../../utilities/types/type-guards";
import { HIDDEN_QUEST_TOKEN_MULTIPLIER } from "../constants/namesmith.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { QuestRepository } from "../repositories/quest.repository";
import { PlayerResolvable } from "../types/player.types";
import { Quest, QuestID, QuestResolvable, Reward, RewardTypes } from "../types/quest.types";
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
			if (this.isHiddenQuest(questResolvable)) {
				quest.tokensReward = Math.floor(quest.tokensReward * HIDDEN_QUEST_TOKEN_MULTIPLIER);
			}
			
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
	 * @returns An array of rewards given to the player.
	 */
	givePlayerRewards(playerResolvable: PlayerResolvable, questResolvable: QuestResolvable): Reward[] {
		const player = this.playerService.resolvePlayer(playerResolvable);
		const quest = this.resolveQuest(questResolvable);

		const rewards = this.getRewards(quest);
		
		for (const reward of rewards) {
			switch (reward.type) {
				case RewardTypes.TOKENS:
					this.playerService.giveTokens(player, reward.numTokens);
					break;

				case RewardTypes.CHARACTERS:
					this.playerService.giveCharacters(player, reward.characters);
					break;
			
				default:
					break;
			}
		}

		return rewards;
	}

	assignNewDailyQuests(timeShown: Date): Quest[] {
		// Determine total number of quests for today: 50% chance of 3 or 4
		const newDailyQuestIDs: number[] = [];
		const questIDsNotShown = this.questRepository.getNotShownQuestIDs();
		let availableQuestIDs = [...questIDsNotShown];

		// Clear current shown flags
		const currentDailyQuestIDs = this.questRepository.getCurrentlyShownQuestIDs();
		for (const questID of currentDailyQuestIDs) {
			this.questRepository.setIsShown(questID, false);
		}

		const totalQuests = Math.random() < 0.5 ? 3 : 4;
		let hiddenCount = 0;
		if (totalQuests === 3) {
			hiddenCount = 1; // 3 total -> 1 hidden, 2 shown
		}
		else {
			// 4 total -> 50% chance of 1 or 2 hidden
			hiddenCount = Math.random() < 0.5 ? 1 : 2;
		}

		const totalToPick = totalQuests;

		// Pick totalQuests distinct quests from available pool, resetting wasShown pool if needed
		for (let i = 0; i < totalToPick; i++) {
			if (availableQuestIDs.length === 0) {
				this.questRepository.resetWasShownForUnshownQuests();
				const questIDsNotShownAgain = this.questRepository.getNotShownQuestIDs();
				availableQuestIDs = [...questIDsNotShownAgain];
			}

			const randomIndex = Math.floor(Math.random() * availableQuestIDs.length);
			const questID = availableQuestIDs[randomIndex];

			newDailyQuestIDs.push(questID);
			this.questRepository.setWasShown(questID, true);
			// mark isShown later for shown (non-hidden) quests
			availableQuestIDs = availableQuestIDs.filter(id => id !== questID);
		}

		// From the picked quests, randomly choose hiddenCount to be hidden
		const shuffled = [...newDailyQuestIDs].sort(() => Math.random() - 0.5);
		const hiddenSet = new Set(shuffled.slice(0, hiddenCount));

		for (const questID of newDailyQuestIDs) {
			const isHidden = hiddenSet.has(questID);
			if (!isHidden) {
				this.questRepository.setIsShown(questID, true);
			}
			this.questRepository.addShownDailyQuest({
				timeShown: timeShown,
				quest: questID,
				isHidden,
			});
		}

		return newDailyQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the quests that are currently being shown to the players.
	 * @returns An array of all the quests that are currently being shown to the players.
	 */
	getCurrentDailyQuests(): Quest[] {
		return this.questRepository.getCurrentlyShownQuestIDs()
			.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the hidden quests for today.
	 * @returns An array of all the hidden quests for today.
	 */
	getHiddenDailyQuests(): Quest[] {
		const shownToday = this.questRepository.getShownDailyQuestDuring(new Date());
		const hiddenQuestIDs = shownToday.filter(s => s.isHidden).map(s => s.quest.id);
		return hiddenQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Checks if a quest is a hidden quest for today.
	 * @param questResolvable - A quest id, quest name, or a quest object.
	 * @returns True if the quest is a hidden quest for today, false otherwise.
	 * @throws {QuestNotFoundError} If no quest with the given ID or name exists.
	 */
	isHiddenQuest(questResolvable: QuestResolvable): boolean {
		const questID = this.resolveID(questResolvable);
		const shownToday = this.questRepository.getShownDailyQuestDuring(new Date());
		return shownToday.some(s => s.isHidden && s.quest.id === questID);
	}

	/**
	 * Checks if a hidden quest is unlocked for a player.
	 * A hidden quest is unlocked when a player has completed all visible quests for the day.
	 * @param playerResolvable - The player to check.
	 * @returns True if the hidden quest is unlocked, false otherwise.
	 */
	isHiddenQuestUnlockedForPlayer(playerResolvable: PlayerResolvable): boolean {
		const shownToday = this.questRepository.getShownDailyQuestDuring(new Date());
		const nonHidden = shownToday.filter((s) => !s.isHidden).map((s) => s.quest);

		// If there are no visible quests today, nothing to unlock
		if (nonHidden.length === 0) return false;

		for (const quest of nonHidden) {
			if (!this.activityLogService.hasPlayerAlreadyCompletedQuest(playerResolvable, quest.id)) 
				return false;
		}

		const hiddenQuests = shownToday.filter((s) => s.isHidden).map((s) => s.quest);
		if (hiddenQuests.length === 0) return false;

		return true;
	}

	reset(): void {
		this.questRepository.resetQuestShownFields();
		this.questRepository.resetShownDailyQuests();
	}
}