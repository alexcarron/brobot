import { getShuffledArray } from "../../../utilities/data-structure-utils";
import { chooseRandomly, chooseWithProbability, getRandomElement } from "../../../utilities/random-utils";
import { isObject } from "../../../utilities/types/type-guards";
import { HIDDEN_QUEST_TOKEN_MULTIPLIER } from "../constants/quests.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { QuestRepository } from "../repositories/quest.repository";
import { Day } from "../types/day.types";
import { PlayerResolvable } from "../types/player.types";
import { Quest, QuestID, QuestResolvable, Reward, RewardTypes } from "../types/quest.types";
import { Week } from "../types/week.types";
import { createReward } from "../utilities/quest.utility";
import { ActivityLogService } from "./activity-log.service";
import { DayService } from "./day.service";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with quests.
 */
export class QuestService {
	constructor(
		public questRepository: QuestRepository,
		public activityLogService: ActivityLogService,
		public playerService: PlayerService,
		public dayService: DayService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new QuestService(
			QuestRepository.fromDB(db),
			ActivityLogService.fromDB(db),
			PlayerService.fromDB(db),
			DayService.fromDB(db),
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
	 * @param today - The day these daily quests are assigned for.
	 * @returns The daily quests for today including the hidden quests.
	 */
	assignNewShownDailyQuests(today: Day): Quest[] {
		const todaysDailyQuestIDs: number[] = [];
		const questIDsNotShown = this.questRepository.getNotShownDailyQuestIDs();
		let availableQuestIDs = [...questIDsNotShown];

		// Remove previously shown daily quests
		this.questRepository.resetIsShownForDailyQuests();
		
		// There are 3-4 daily quests, 1 hidden if 3 total, 1-2 hidden if 4 total
		const numDailyQuests = chooseRandomly(3, 4);
		let numHiddenQuests = 0;
		if (numDailyQuests === 3) {
			numHiddenQuests = 1;
		}
		else {
			numHiddenQuests = chooseRandomly(1, 2);
		}

		for (let i = 0; i < numDailyQuests; i++) {
			// If all quests have been shown, reset all wasShown flags
			if (availableQuestIDs.length === 0) {
				this.questRepository.resetWasShownForNonShownDailyQuests();
				availableQuestIDs = [...this.questRepository.getNotShownDailyQuestIDs()];
			}

			const randomQuestID = getRandomElement(availableQuestIDs);

			todaysDailyQuestIDs.push(randomQuestID);
			this.questRepository.setWasShown(randomQuestID, true);
			this.questRepository.setIsShown(randomQuestID, true);
			availableQuestIDs = availableQuestIDs.filter(id => id !== randomQuestID);
		}

		// From the picked quests, randomly choose hiddenCount to be hidden
		const shuffledDailyQuestIDs = getShuffledArray(todaysDailyQuestIDs);
		const hiddenQuestIDs = new Set(shuffledDailyQuestIDs.slice(0, numHiddenQuests));

		for (const questID of todaysDailyQuestIDs) {
			const isHidden = hiddenQuestIDs.has(questID);
			this.questRepository.addShownDailyQuest({
				day: today,
				quest: questID,
				isHidden,
			});
		}

		return todaysDailyQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Decides the new weekly quests for the week and assigns them.
	 * There's a 2/3 chance of 3 weekly quests and a 1/3 chance of 4 weekly quests.
	 * @param thisWeek - The week for which to assign new weekly quests.
	 * @returns  The weekly quests for the week.
	 */
	assignNewShownWeeklyQuests(thisWeek: Week): Quest[] {
		const newShownWeeklyQuestIDs: number[] = [];
		const questIDsNotShown = this.questRepository.getNotShownWeeklyQuestIDs();
		let questIDsCanPickFrom = [...questIDsNotShown];

		// Remove previously shown weekly quests
		this.questRepository.resetIsShownForWeeklyQuests();

		const numShownWeeklyQuests = chooseWithProbability(2/3, 3, 4); // 2/3 chance of 3, 1/3 chance of 4

		// Pick numShownWeeklyQuests distinct quests from available pool, resetting wasShown pool if needed
		for (let i = 0; i < numShownWeeklyQuests; i++) {
			if (questIDsCanPickFrom.length === 0) {
				this.questRepository.resetWasShownForShownWeeklyQuests();
				const questIDsNotShown = this.questRepository.getNotShownWeeklyQuestIDs();
				questIDsCanPickFrom = [...questIDsNotShown];
			}

			const randomQuestID = getRandomElement(questIDsCanPickFrom);
			newShownWeeklyQuestIDs.push(randomQuestID);
			this.questRepository.setWasShown(randomQuestID, true);
			this.questRepository.setIsShown(randomQuestID, true);
			this.questRepository.addShownWeeklyQuest({
				week: thisWeek,
				quest: randomQuestID,
			});
			questIDsCanPickFrom = questIDsCanPickFrom.filter(id => id !== randomQuestID);
		}

		return getShuffledArray(newShownWeeklyQuestIDs).map(questID => 
			this.resolveQuest(questID)
		);
	}

	/**
	 * Returns an array of all the daily quests that are currently being shown to the players.
	 * @returns An array of all the daily quests that are currently being shown to the players.
	 */
	getCurrentShownDailyQuests(): Quest[] {
		return this.questRepository.getCurrentlyShownDailyQuestIDs()
			.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the non-hidden daily quests that are currently being shown to the players.
	 * @returns An array of all the non-hidden daily quests that are currently being shown to the players.
	 */
	getTodaysNonHiddenDailyQuests(): Quest[] {
		const currentDay = this.dayService.getCurrentDayOrThrow();
		const shownDailyQuestsToday = this.questRepository.getShownDailyQuestsDuringDay(currentDay.id);
		const hiddenQuestIDs = shownDailyQuestsToday.filter(s => !s.isHidden).map(s => s.quest.id);
		return hiddenQuestIDs.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the weekly quests being shown to the players for the week.
	 * @returns An array of all the weekly quests being shown to the players for the week.
	 */
	getCurrentShownWeeklyQuests(): Quest[] {
		return this.questRepository.getCurrentlyShownWeeklyQuestIDs()
			.map(questID => this.resolveQuest(questID));
	}

	/**
	 * Returns an array of all the hidden quests for today.
	 * @returns An array of all the hidden quests for today.
	 */
	getHiddenShownDailyQuestsToday(): Quest[] {
		const currentDay = this.dayService.getLastAddedDay();
		if (currentDay === null) return [];

		const shownToday = this.questRepository.getShownDailyQuestsDuringDay(currentDay.id);
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
		const currentDay = this.dayService.getLastAddedDay();
		if (currentDay === null) return false;

		const questID = this.resolveID(questResolvable);
		const shownToday = this.questRepository.getShownDailyQuestsDuringDay(currentDay.id);
		return shownToday.some(s => s.isHidden && s.quest.id === questID);
	}

	/**
	 * Checks if a hidden quest is unlocked for a player.
	 * A hidden quest is unlocked when a player has completed all visible quests for the day.
	 * @param playerResolvable - The player to check.
	 * @returns True if the hidden quest is unlocked, false otherwise.
	 */
	isHiddenQuestUnlockedForPlayer(playerResolvable: PlayerResolvable): boolean {
		const currentDay = this.dayService.getLastAddedDay();
		if (currentDay === null) return false;

		const shownToday = this.questRepository.getShownDailyQuestsDuringDay(currentDay.id);
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
		this.questRepository.resetShownFieldsForAllQuests();
		this.questRepository.resetShownDailyQuests();
	}
}