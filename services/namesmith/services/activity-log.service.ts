import { addToArrayMap } from "../../../utilities/data-structure-utils";
import { addDays } from "../../../utilities/date-time-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { ActivityLogRepository } from "../repositories/activity-log.repository";
import { ActivityLog, ActivityTypes, NameInterval } from "../types/activity-log.types";
import { MysteryBoxResolvable } from "../types/mystery-box.types";
import { PerkResolvable } from "../types/perk.types";
import { PlayerResolvable } from "../types/player.types";
import { QuestResolvable } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { RoleResolvable } from "../types/role.types";
import { Trade, TradeResolvable } from "../types/trade.types";
import { GameStateService } from "./game-state.service";
import { PlayerService } from "./player.service";

/**
 * Provides methods for interacting with activity logs.
 */
export class ActivityLogService {
	constructor(
		public activityLogRepository: ActivityLogRepository,
		public gameStateService: GameStateService,
		public playerService: PlayerService,
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new ActivityLogService(
			ActivityLogRepository.fromDB(db),
			GameStateService.fromDB(db),
			PlayerService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return ActivityLogService.fromDB(db);
	}

	logChangeName({ playerChangingName, nameBefore }: {
		playerChangingName: PlayerResolvable;
		nameBefore: string;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CHANGE_NAME,
			player: playerChangingName,
			nameChangedFrom: nameBefore,
		});
	}

	logPublishName({ playerPublishingName }: {
		playerPublishingName: PlayerResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.PUBLISH_NAME,
			player: playerPublishingName,
		});
	}

	/**
	 * Logs a character crafting activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerCrafting - The player who is crafting.
	 * @param parameters.recipeUsed - The recipe being used for crafting.
	 * @param parameters.nameBefore - The name of the character before crafting.
	 * @returns The created activity log object.
	 */
	logCraftCharacters({ playerCrafting, recipeUsed, nameBefore }: {
		playerCrafting: PlayerResolvable;
		recipeUsed: Recipe;
		nameBefore: string;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CRAFT_CHARACTERS,
			player: playerCrafting,
			nameChangedFrom: nameBefore,
			charactersGained: recipeUsed.outputCharacters,
			charactersLost: recipeUsed.inputCharacters,
			involvedRecipe: recipeUsed,
		});
	}

	/**
	 * Logs an activity log when a player initiates a trade.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerInitiatingTrade - The player who is initiating the trade.
	 * @param parameters.recipientPlayer - The player who is receiving the trade.
	 * @param parameters.trade - The trade being initiated.
	 * @returns The created activity log object.
	 */
	logInitiateTrade({playerInitiatingTrade, recipientPlayer, trade}: {
		playerInitiatingTrade: PlayerResolvable;
		recipientPlayer: PlayerResolvable;
		trade: TradeResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.INITIATE_TRADE,
			player: playerInitiatingTrade,
			involvedPlayer: recipientPlayer,
			involvedTrade: trade,
		});
	}

	/**
	 * Logs an activity log when a player accepts a trade.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerAccepting - The player who is accepting the trade.
	 * @param parameters.playerAwaitingResponse - The player who was awaiting a response for the trade.
	 * @param parameters.trade - The trade being accepted.
	 * @param parameters.nameBefore - The name of the player before the trade was accepted.
	 * @param parameters.charactersGained - The characters gained from the trade.
	 * @param parameters.charactersLost - The characters lost in the trade.
	 * @returns The created activity log object.
	 */
	logAcceptTrade({ playerAccepting, playerAwaitingResponse, trade, nameBefore }: {
		playerAccepting: PlayerResolvable;
		playerAwaitingResponse: PlayerResolvable;
		trade: Trade;
		nameBefore: string;
	}): ActivityLog {
		const playerAcceptingID = this.playerService.resolveID(playerAccepting);
		const charactersAcceptorGained =
			playerAcceptingID === trade.initiatingPlayer.id
				? trade.requestedCharacters
				: trade.offeredCharacters;

		const charactersAcceptorLost =
			playerAcceptingID === trade.initiatingPlayer.id
				? trade.offeredCharacters
				: trade.requestedCharacters;

		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.ACCEPT_TRADE,
			player: playerAccepting,
			involvedPlayer: playerAwaitingResponse,
			involvedTrade: trade,
			nameChangedFrom: nameBefore,
			charactersGained: charactersAcceptorGained,
			charactersLost: charactersAcceptorLost,
		});
	}

	/**
	 * Logs an activity log when a player declines a trade.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerDecliningTrade - The player who is declining the trade.
	 * @param parameters.playerAwaitingResponse - The player who was awaiting a response for the trade.
	 * @param parameters.trade - The trade being declined.
	 * @returns The created activity log object.
	 */
	logDeclineTrade({ playerDecliningTrade, playerAwaitingResponse, trade }: {
		playerDecliningTrade: PlayerResolvable;
		playerAwaitingResponse: PlayerResolvable;
		trade: TradeResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.DECLINE_TRADE,
			player: playerDecliningTrade,
			involvedPlayer: playerAwaitingResponse,
			involvedTrade: trade,
		});
	}

	/**
	 * Logs an activity log when a player modifies a trade.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerModifyingTrade - The player who is modifying the trade.
	 * @param parameters.playerAwaitingResponse - The player who was awaiting a response for the trade.
	 * @param parameters.trade - The trade being modified.
	 * @returns The created activity log object.
	 */
	logModifyTrade({ playerModifyingTrade, playerAwaitingResponse, trade }: {
		playerModifyingTrade: PlayerResolvable;
		playerAwaitingResponse: PlayerResolvable;
		trade: TradeResolvable;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.MODIFY_TRADE,
			player: playerModifyingTrade,
			involvedPlayer: playerAwaitingResponse,
			involvedTrade: trade,
		});
	}

	/**
	 * Logs a mystery box purchase activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerBuyingBox - The player who is buying the mystery box.
	 * @param parameters.mysteryBox - The mystery box being bought.
	 * @param parameters.tokensSpent - The number of tokens spent on the mystery box.
	 * @param parameters.nameBefore - The name of the player before the mystery box was bought.
	 * @param parameters.receivedCharacters - The characters received from the mystery box.
	 * @returns The created activity log object.
	 */
	logBuyMysteryBox({ playerBuyingBox, tokensSpent, mysteryBox, nameBefore, receivedCharacters }: {
		playerBuyingBox: PlayerResolvable;
		mysteryBox: MysteryBoxResolvable;
		tokensSpent: number;
		nameBefore: string;
		receivedCharacters: string;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.BUY_MYSTERY_BOX,
			player: playerBuyingBox,
			involvedMysteryBox: mysteryBox,
			tokensDifference: -tokensSpent,
			nameChangedFrom: nameBefore,
			charactersGained: receivedCharacters,
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
	 * @param parameters.timeCooldownExpired - The time the refill cooldown expired.
	 * @returns The created activity log object.
	 */
	logClaimRefill({ playerRefilling, tokensEarned, timeCooldownExpired }: {
		playerRefilling: PlayerResolvable;
		tokensEarned: number;
		timeCooldownExpired: Date;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CLAIM_REFILL,
			player: playerRefilling,
			tokensDifference: tokensEarned,
			timeCooldownExpired: timeCooldownExpired,
		});
	}

	/**
	 * Logs a quest completion activity.
	 * @param parameters - The parameters which include:
	 * @param parameters.playerCompletingQuest - The player who is completing the quest.
	 * @param parameters.questCompleted - The quest being completed.
	 * @param parameters.tokensRewarded - The number of tokens rewarded for completing the quest.
	 * @param parameters.charactersRewarded - The characters rewarded for completing the quest.
	 * @param parameters.nameBefore - The name of the player before the quest was completed.
	 * @returns The created activity log object.
	 */
	logCompleteQuest({ playerCompletingQuest, questCompleted, tokensRewarded, charactersRewarded, nameBefore }: {
		playerCompletingQuest: PlayerResolvable;
		questCompleted: QuestResolvable;
		tokensRewarded?: number;
		charactersRewarded?: string;
		nameBefore: string;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.COMPLETE_QUEST,
			player: playerCompletingQuest,
			involvedQuest: questCompleted,
			tokensDifference: tokensRewarded ?? 0,
			nameChangedFrom: nameBefore,
			charactersGained: charactersRewarded ?? null,
		});
	}

	/**
	 * Logs a perk picking activity.
	 * @param parameters - An object containing the parameters.
	 * @param parameters.player - The player who is picking the perk.
	 * @param parameters.tokensEarned - The number of tokens earned by picking the perk.
	 * @param parameters.perk - The perk being picked.
	 * @returns The created activity log object.
	 */
	logPickPerk({ player, perk, tokensEarned, }: {
		player: PlayerResolvable;
		perk: PerkResolvable;
		tokensEarned?: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.PICK_PERK,
			player: player,
			involvedPerk: perk,
			tokensDifference: tokensEarned ?? 0,
		});
	}

	logChooseRole({ player, role, tokensEarned, }: {
		player: PlayerResolvable;
		role: RoleResolvable;
		tokensEarned?: number;
	}): ActivityLog {
		return this.activityLogRepository.addActivityLog({
			type: ActivityTypes.CHOOSE_ROLE,
			player: player,
			involvedRole: role,
			tokensDifference: tokensEarned ?? 0,
		});
	}

	/**
	 * Retrieves all activity logs for a given player.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getLogsByPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			player: player,
		});
	}

	/**
	 * Retrieves all activity logs for a given player for the current day.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
		});
	}

	/**
	 * Retrieves all activity logs for other players than the given player for the current day.
	 * @param player - The player to exclude from the results.
	 * @returns An array of activity logs for other players than the given player.
	 */
	getLogsTodayByPlayersOtherThan(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhereNot(startOfToday, {
			player: player,
		});
	}

	getNameIntervalsOfPlayerToday(player: PlayerResolvable): NameInterval[] {
		const playerID = this.playerService.resolveID(player);
		const nameIntervals: NameInterval[] = [];
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		const activityLogs = this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {player});

		let previousTime = startOfToday;
		let previousName = null;
		let lastLog;
		for (const log of activityLogs) {
			if (log.nameChangedFrom === null)
				continue;

			if (log.currentName === previousName)
				continue;

			nameIntervals.push({
				startTime: previousTime,
				endTime: log.timeOccurred,
				name: log.nameChangedFrom,
				playerID: playerID,
			});
			previousTime = log.timeOccurred;
			previousName = log.currentName;
			lastLog = log;
		}

		if (lastLog !== undefined) {
			nameIntervals.push({
				startTime: lastLog.timeOccurred,
				endTime: addDays(startOfToday, 1),
				name: lastLog.currentName,
				playerID: playerID,
			});
		}
		else {
			const resolvedPlayer = this.playerService.resolvePlayer(player);
			nameIntervals.push({
				startTime: startOfToday,
				endTime: addDays(startOfToday, 1),
				name: resolvedPlayer.currentName,
				playerID: playerID,
			});
		}

		return nameIntervals;
	}

	/**
	 * Retrieves all name intervals for all players for the current day.
	 * The returned array is sorted by the start time of the name intervals.
	 * @returns An array of name intervals for all players for the current day.
	 */
	getNameIntervalsToday(): NameInterval[] {
		const players = this.playerService.getPlayers();
		const nameIntervals: NameInterval[] = [];
		for (const player of players) {
			const nameIntervalsOfPlayer = this.getNameIntervalsOfPlayerToday(player);
			nameIntervals.push(...nameIntervalsOfPlayer);
		}
		return nameIntervals
			.sort((interval1, interval2) =>
				interval1.startTime.getTime() - interval2.startTime.getTime()
			);
	}

	/**
	 * Returns a map where the keys are player names and the values are arrays of name intervals for the current day.
	 * This is useful for quickly looking up the name intervals for all players for a given day.
	 * @returns A map from player names to arrays of name intervals for the current day.
	 */
	getNameToNameIntervalsToday(): Map<string, NameInterval[]> {
		const players = this.playerService.getPlayers();
		const nameToNameIntervals: Map<string, NameInterval[]> = new Map<string, NameInterval[]>();

		for (const player of players) {
			const nameIntervals = this.getNameIntervalsOfPlayerToday(player);
			for (const nameInterval of nameIntervals) {
				addToArrayMap(nameToNameIntervals, nameInterval.name, nameInterval);
			}
		}

		return nameToNameIntervals;
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
	 * Returns an array of names that the given player had today.
	 * The returned array will contain the names of the player from the start of the day until the current time.
	 * This is useful for quickly looking up the names that a player had for a given day.
	 * @param player - The player to get the names for.
	 * @returns An array of names that the given player had today.
	 */
	getNamesOfPlayerToday(player: PlayerResolvable): string[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		const activityLogs = this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {player});

		const namesSet: Set<string> = new Set<string>();
		for (const log of activityLogs) {
			if (log.nameChangedFrom !== null)
				namesSet.add(log.nameChangedFrom);

			namesSet.add(log.currentName);
		}

		if (namesSet.size === 0) {
			const resolvedPlayer = this.playerService.resolvePlayer(player);
			namesSet.add(resolvedPlayer.currentName);
		}

		return Array.from(namesSet);
	}

	/**
	 * Retrieves all activity logs for a given player where the type is crafting characters.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getCraftLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.CRAFT_CHARACTERS,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where the type is accepting a trade.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getAcceptTradeLogsByPlayer(player: PlayerResolvable): ActivityLog[] {
		return this.activityLogRepository.findActivityLogsWhere({
			player: player,
			type: ActivityTypes.ACCEPT_TRADE,
		});
	}

	getAcceptTradeLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.ACCEPT_TRADE,
		});
	}

	/**
	 * Retrieves all activity logs where the type is accepting a trade and the involved player is the given player.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getAcceptTradeLogsTodayWithRecpient(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			involvedPlayer: player,
			type: ActivityTypes.ACCEPT_TRADE,
		});
	}

	/**
	 * Retrieves activity logs where the given player either accepts a trade or has their trade accepted
	 * @param player - The player involved in the trades
	 * @returns The activity logs
	 */
	getAcceptTradeLogsTodayInvolvingPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsOfTypeAfterTimeWhereOr(
			ActivityTypes.ACCEPT_TRADE,
			startOfToday, {
				player: player,
				involvedPlayer: player
			}
		)
	}

	/**
	 * Retrieves all activity logs for a given player where the type is initiating a trade.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getInitiateTradeLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.INITIATE_TRADE,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they decline a trade.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getDeclineTradeLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.DECLINE_TRADE,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they modify a trade.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getModifyTradeLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.MODIFY_TRADE,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where the type is changing name.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getChangeNameLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.CHANGE_NAME,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where the type is publishing a name.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player.
	 */
	getPublishNameLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.PUBLISH_NAME,
		});
	}

	/**
	 * Retrieves all activity logs for all players where they mine tokens.
	 * Only retrieves activity logs that occurred today or later.
	 * @returns An array of activity logs for all players where they mine tokens.
	 */
	getMineTokensLogsToday(): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			type: ActivityTypes.MINE_TOKENS,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they mine tokens.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player where they mine tokens.
	 */
	getMineTokensLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.MINE_TOKENS,
		});
	}

	/**
	 * Retrieves all activity logs for all players where they claim a refill.
	 * Only retrieves activity logs that occurred today or later.
	 * @returns An array of activity logs for all players where they claim a refill.
	 */
	getClaimRefillLogsToday(): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			type: ActivityTypes.CLAIM_REFILL,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they claim a refill.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player where they claim a refill.
	 */
	getClaimRefillLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.CLAIM_REFILL,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they buy a mystery box.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player where they buy a mystery box.
	 */
	getBuyMysteryBoxLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.BUY_MYSTERY_BOX,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they complete a quest.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player where they complete a quest.
	 */
	getCompleteQuestLogsTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			player: player,
			type: ActivityTypes.COMPLETE_QUEST,
		});
	}

	/**
	 * Retrieves all activity logs for completing the given quest.
	 * Only retrieves activity logs that occurred today or later.
	 * @param quest - The quest to retrieve the activity logs for.
	 * @returns An array of activity logs for completing the given quest.
	 */
	getCompleteQuestLogsTodayForQuest(
		quest: QuestResolvable
	): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeWhere(startOfToday, {
			type: ActivityTypes.COMPLETE_QUEST,
			involvedQuest: quest,
		});
	}

	/**
	 * Retrieves all activity logs for a given player where they have a token difference.
	 * Only retrieves activity logs that occurred today or later.
	 * @param player - The player to retrieve the activity logs for.
	 * @returns An array of activity logs for the given player where they have a token difference.
	 */
	getLogsWithTokenDifferenceTodayByPlayer(player: PlayerResolvable): ActivityLog[] {
		const now = new Date();
		const startOfToday = this.gameStateService.getStartOfTodayOrThrow(now);
		return this.activityLogRepository.findActivityLogsAfterTimeByPlayerWhereNot(
			startOfToday,
			player,
			{tokensDifference: 0},
		)
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