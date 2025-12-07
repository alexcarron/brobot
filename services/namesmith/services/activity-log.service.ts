import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { ActivityLogRepository } from "../repositories/activity-log.repository";
import { ActivityLog, ActivityTypes } from "../types/activity-log.types";
import { PlayerResolvable } from "../types/player.types";
import { QuestResolvable } from "../types/quest.types";
import { RecipeResolvable } from "../types/recipe.types";

/**
 * Provides methods for interacting with activity logs.
 */
export class ActivityLogService {
	constructor(
		public activityLogRepository: ActivityLogRepository,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ActivityLogService(
			ActivityLogRepository.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return ActivityLogService.fromDB(db);
	}

	/**
	 * Logs a character crafting activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerCrafting - The player who is crafting.
	 * @param parameters.recipeUsed - The recipe being used for crafting.
	 * @returns The created activity log object.
	 */
	logCraftCharacters({ playerCrafting, recipeUsed }: {
		playerCrafting: PlayerResolvable;
		recipeUsed: RecipeResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CRAFT_CHARACTERS,
			player: playerCrafting,
			involvedRecipe: recipeUsed,
		});
	}

	/**
	 * Logs an activity log when a player accepts a trade.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerAcceptingTrade - The player who is accepting the trade.
	 * @param parameters.playerAwaitingAcceptance - The player who is awaiting a response for the trade.
	 * @returns The created activity log object.
	 */
	logAcceptTrade({ playerAcceptingTrade, playerAwaitingAcceptance }: {
		playerAcceptingTrade: PlayerResolvable;
		playerAwaitingAcceptance: PlayerResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.ACCEPT_TRADE,
			player: playerAcceptingTrade,
			involvedPlayer: playerAwaitingAcceptance,
		});
	}

	/**
	 * Logs a mystery box purchase activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerBuyingBox - The player who is buying the mystery box.
	 * @param parameters.tokensSpent - The number of tokens spent on the mystery box.
	 * @returns The created activity log object.
	 */
	logBuyMysteryBox({ playerBuyingBox, tokensSpent }: {
		playerBuyingBox: PlayerResolvable;
		tokensSpent: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.BUY_MYSTERY_BOX,
			player: playerBuyingBox,
			tokensDifference: -tokensSpent,
		});
	}

	/**
	 * Logs a mining activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerMining - The player who is mining.
	 * @param parameters.tokensEarned - The number of tokens earned by mining.
	 * @returns The created activity log object.
	 */
	logMineTokens({ playerMining, tokensEarned }: {
		playerMining: PlayerResolvable;
		tokensEarned: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.MINE_TOKENS,
			player: playerMining,
			tokensDifference: tokensEarned,
		});
	}

	/**
	 * Logs a refill activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerRefilling - The player who is claiming the refill.
	 * @param parameters.tokensEarned - The number of tokens earned by claiming the refill.
	 * @returns The created activity log object.
	 */
	logClaimRefill({ playerRefilling, tokensEarned }: {
		playerRefilling: PlayerResolvable;
		tokensEarned: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CLAIM_REFILL,
			player: playerRefilling,
			tokensDifference: tokensEarned,
		});
	}

	/**
	 * Logs a quest completion activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerCompletingQuest - The player who is completing the quest.
	 * @param parameters.questCompleted - The quest being completed.
	 * @returns The created activity log object.
	 */
	logCompleteQuest({ playerCompletingQuest, questCompleted }: {
		playerCompletingQuest: PlayerResolvable;
		questCompleted: QuestResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.COMPLETE_QUEST,
			player: playerCompletingQuest,
			involvedQuest: questCompleted,
		});
	}

	/**
	 * Logs a perk picking activity.
	 * @param parameters - An object containing the parameters.
	 * @param parameters.playerPickingPerk - The player who is picking the perk.
	 * @param parameters.tokensEarned - The number of tokens earned by picking the perk.
	 * @returns The created activity log object.
	 */
	logPickPerk({ playerPickingPerk, tokensEarned }: {
		playerPickingPerk: PlayerResolvable;
		tokensEarned?: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.PICK_PERK,
			player: playerPickingPerk,
			tokensDifference: tokensEarned ?? 0,
		});
	}

	/**
	 * Retrieves all activity logs for a given player.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getLogsForPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			player: player,
		});
	}

	/**
	 * Checks if a player has completed a quest.
	 * @param player - The player to check.
	 * @param quest - The quest to check.
	 * @returns True if the player has completed the quest, false otherwise.
	 */
	hasPlayerAlreadyCompletedQuest(
		player: PlayerResolvable,
		quest: QuestResolvable
	): boolean {
		const activityLogs = this.activityLogRepository.findActivityLogsWhere({
			player: player,
			type: ActivityTypes.COMPLETE_QUEST,
			involvedQuest: quest,
		});
		return activityLogs.length > 0;
	}

	/**
	 * Retrieves all activity logs for a given player where the type is crafting characters.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getCraftLogsForPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			player: player,
			type: ActivityTypes.CRAFT_CHARACTERS,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where the type is accepting a trade.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getAcceptTradeLogsForPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			player: player,
			type: ActivityTypes.ACCEPT_TRADE,
		});
	}

	/**
	 * Retrieves all activity logs where the type is accepting a trade and the involved player is the given player.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getAcceptTradeLogsInvolvingPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			involvedPlayer: player,
			type: ActivityTypes.ACCEPT_TRADE,
		});
	}

	/**
	 * Retrieves the number of mines a player has made since a given time.
	 * @param player - The player to retrieve the number of mines for.
	 * @param minimumTime - The time to retrieve the number of mines since.
	 * @returns The number of mines the player has made since the given time.
	 */
	getTimesPlayerMinedSince(
		player: PlayerResolvable,
		minimumTime: Date,
	): number {
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(minimumTime, {
			player: player,
			type: ActivityTypes.MINE_TOKENS,
		}).length;
	}

	/**
	 * Retrieves the total amount of tokens a player has spent since a given time.
	 * @param player - The player to retrieve the total amount of tokens spent for.
	 * @param minimumTime - The time to retrieve the total amount of tokens spent since.
	 * @returns The total amount of tokens the player has spent since the given time.
	 */
	getTokensPlayerSpentSince(
		player: PlayerResolvable,
		minimumTime: Date,
	): number {
		const logs = this.activityLogRepository.findActivityLogsAfterTimeWhere(
			minimumTime, {player}
		);

		let totalTokensSpent = 0;
		for (const log of logs) {
			if (log.tokensDifference < 0)
				totalTokensSpent += -log.tokensDifference;
		}

		return totalTokensSpent;
	}
}