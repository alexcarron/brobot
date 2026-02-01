import { getShuffledArray } from "../../../utilities/data-structure-utils";
import { chooseFirstWithProbability } from "../../../utilities/random-utils";
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

	/**
	 * Decides the new daily quests for today and assigns them.
	 * There is a 50% chance of having either 3 or 4 daily quests.
	 * If there are 3 daily quests, 1 will be hidden.
	 * If there are 4 daily quests, there is a 50% chance of having either 1 or 2 hidden quests.
	 * @param startOfDay - The start of the day for which to assign new daily quests.
	 * @returns The daily quests for today including the hidden quests.
	 */
	assignNewDailyQuests(startOfDay: Date): Quest[] {
		// Determine total number of quests for today: 50% chance of 3 or 4
		const newDailyQuestIDs: number[] = [];
		const questIDsNotShown = this.questRepository.getNotShownDailyQuestIDs();
		let availableQuestIDs = [...questIDsNotShown];

		// Clear current shown flags
		const currentDailyQuestIDs = this.questRepository.getCurrentlyShownDailyQuestIDs();
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
				this.questRepository.resetWasShownForUnshownDailyQuests();
				const questIDsNotShownAgain = this.questRepository.getNotShownDailyQuestIDs();
				availableQuestIDs = [...questIDsNotShownAgain];
			}

			const questID = availableQuestIDs[Math.floor(Math.random() * availableQuestIDs.length)];

			newDailyQuestIDs.push(questID);
			this.questRepository.setWasShown(questID, true);
			this.questRepository.setIsShown(questID, true);
			availableQuestIDs = availableQuestIDs.filter(id => id !== questID);
		}

		// From the picked quests, randomly choose hiddenCount to be hidden
		const shuffled = [...newDailyQuestIDs].sort(() => Math.random() - 0.5);
		const hiddenSet = new Set(shuffled.slice(0, hiddenCount));

		for (const questID of newDailyQuestIDs) {
			const isHidden = hiddenSet.has(questID);
			this.questRepository.addShownDailyQuest({
				timeShown: startOfDay,
				quest: questID,
				isHidden,
			});
		}

		return newDailyQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the daily quests that are currently being shown to the players.
	 * @returns An array of all the daily quests that are currently being shown to the players.
	 */
	getCurrentDailyQuests(): Quest[] {
		return this.questRepository.getCurrentlyShownDailyQuestIDs()
			.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the non-hidden daily quests that are currently being shown to the players.
	 * @returns An array of all the non-hidden daily quests that are currently being shown to the players.
	 */
	getShownDailyQuests(): Quest[] {
		const shownToday = this.questRepository.getShownDailyQuestDuring(new Date());
		const hiddenQuestIDs = shownToday.filter(s => !s.isHidden).map(s => s.quest.id);
		return hiddenQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the weekly quests being shown to the players for the week.
	 * @returns An array of all the weekly quests being shown to the players for the week.
	 */
	getShownWeeklyQuests(): Quest[] {
		return this.questRepository.getCurrentlyShownWeeklyQuestIDs()
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

	/**
	 * Decides the new weekly quests for the week and assigns them.
	 * There's a 2/3 chance of 3 weekly quests and a 1/3 chance of 4 weekly quests.
	 * @param startOfWeek - The start of the week for which to assign new weekly quests.
	 * @returns  The weekly quests for the week.
	 */
	assignNewWeeklyQuests(startOfWeek: Date): Quest[] {
		// Remove previously shown weekly quests
		const currentWeeklyQuestIDs = this.questRepository.getCurrentlyShownWeeklyQuestIDs();
		for (const questID of currentWeeklyQuestIDs) {
			this.questRepository.setIsShown(questID, false);
		}
		
		const newWeeklyQuestIDs: number[] = [];
		const questIDsNotShown = this.questRepository.getNotShownWeeklyQuestIDs();
		let questIDsCanPickFrom = [...questIDsNotShown];

		const numWeeklyQuests = chooseFirstWithProbability(2/3, 3, 4); // 2/3 chance of 3, 1/3 chance of 4

		// Pick numWeeklyQuests distinct quests from available pool, resetting wasShown pool if needed
		for (let i = 0; i < numWeeklyQuests; i++) {
			if (questIDsCanPickFrom.length === 0) {
				this.questRepository.resetWasShownForUnshownWeeklyQuests();
				const questIDsNotShown = this.questRepository.getNotShownWeeklyQuestIDs();
				questIDsCanPickFrom = [...questIDsNotShown];
			}

			const randomIndex = Math.floor(Math.random() * questIDsCanPickFrom.length);
			const questID = questIDsCanPickFrom[randomIndex];
			newWeeklyQuestIDs.push(questID);
			this.questRepository.setWasShown(questID, true);
			this.questRepository.setIsShown(questID, true);
			this.questRepository.addShownWeeklyQuest({
				timeShown: startOfWeek,
				quest: questID,
			});
			questIDsCanPickFrom = questIDsCanPickFrom.filter(id => id !== questID);
		}

		return getShuffledArray(newWeeklyQuestIDs).map(questID => 
			this.resolveQuest(questID)
		);
	}

	reset(): void {
		this.questRepository.resetQuestShownFields();
		this.questRepository.resetShownDailyQuests();
	}
}