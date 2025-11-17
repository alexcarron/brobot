import { hasEmoji, hasLetter, hasSymbol } from "../../../utilities/string-checks-utils";
import { isObject } from "../../../utilities/types/type-guards";
import { Quests } from "../constants/quests.constants";
import { FREEBIE_QUEST_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { QuestRepository } from "../repositories/quest.repository";
import { PlayerResolvable } from "../types/player.types";
import { Quest, QuestID, QuestResolvable } from "../types/quest.types";
import { QuestEligbilityNotImplementedError } from "../utilities/error.utility";
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

	isPlayerEligibleToComplete(
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
	): boolean {
		this.playerService.resolvePlayer(playerResolvable);
		const questID = this.resolveID(questResolvable);

		switch (questID) {
			case Quests.EXPERIENCED_CRAFTSMAN.id:
				return this.meetsExperienceCraftsmanCriteria(playerResolvable);

			case Quests.DIVERSE_NAME.id:
				return this.meetsDiverseNameCriteria(playerResolvable);

			case Quests.TRADE_DIPLOMAT.id:
				return this.meetsTradeDiplomatCriteria(playerResolvable);

			case Quests.TWINSIES.id:
				return this.meetsTwinsiesCriteria(playerResolvable);

			case Quests.GET_RICH_QUICK.id:
				return this.meetsGetRichQuickCriteria(playerResolvable);

			default: {
				const quest = this.resolveQuest(questResolvable);
				if (quest.name.includes(FREEBIE_QUEST_NAME))
					return true;

				throw new QuestEligbilityNotImplementedError(questID);
			}
		}
	}

	private meetsExperienceCraftsmanCriteria(playerResolvable: PlayerResolvable): boolean {
		const player = this.playerService.resolvePlayer(playerResolvable);
		const craftLogs = this.activityLogService.getCraftLogsForPlayer(player);
		const uniqueRecipesCrafted = new Set<number>();

		for (const log of craftLogs) {
			if (!log.involvedRecipe) continue;
			uniqueRecipesCrafted.add(log.involvedRecipe.id);
		}

		return (
			craftLogs.length >= 5 &&
			uniqueRecipesCrafted.size >= 3
		);
	}

	private meetsDiverseNameCriteria(playerResolvable: PlayerResolvable): boolean {
		const player = this.playerService.resolvePlayer(playerResolvable);
		const publishedName = player.publishedName;

		return (
			publishedName !== null &&
			hasEmoji(publishedName) &&
			hasSymbol(publishedName) &&
			hasLetter(publishedName)
		);
	}

	private meetsTradeDiplomatCriteria(playerResolvable: PlayerResolvable): boolean {
		const player = this.playerService.resolvePlayer(playerResolvable);
		const tradeAcceptedLogs = this.activityLogService.getAcceptTradeLogsInvolvingPlayer(player);

		const uniqueInvolvedPlayers = new Set<string>();
		for (const log of tradeAcceptedLogs) {
			if (!log.player) continue;
			uniqueInvolvedPlayers.add(log.player.id);
		}

		return (
			tradeAcceptedLogs.length >= 3 &&
			uniqueInvolvedPlayers.size >= 3
		);
	}

	private meetsTwinsiesCriteria(playerResolvable: PlayerResolvable): boolean {
		const player = this.playerService.resolvePlayer(playerResolvable);
		if (player.publishedName === null) return false;

		const allPublishedNames = this.playerService.getAllPublishedNames();

		const numSamePublishedNames =
			allPublishedNames.filter(publishedName =>
				publishedName !== null &&
				publishedName === player.publishedName
			).length;

		return (
			numSamePublishedNames >= 2 &&
			player.publishedName.length > 6
		);
	}

	private meetsGetRichQuickCriteria(playerResolvable: PlayerResolvable): boolean {
		const logs = this.activityLogService.getLogsForPlayer(playerResolvable);

		let totalTokenGain = 0;
		for (const log of logs) {
			if (log.tokensDifference > 0)
				totalTokenGain += log.tokensDifference;
		}

		return totalTokenGain >= 1000;
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