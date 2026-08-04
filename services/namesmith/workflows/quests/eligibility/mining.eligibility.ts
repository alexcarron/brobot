import { Duration, getMillisecondsOfDuration, getSecondsInTime, toDurationText, toDurationTextFromSeconds, toDurationTextFromTime } from "../../../../../utilities/date-time-utils";
import { Quests } from "../../../constants/quests.constants";
import { ActivityLog, ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about mining tokens.
 */
export const miningEligibilityChecks = {

	// High Yield
	[Quests.HIGH_YIELD.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_TOKENS_NEEDED = 5;
		const mineLogs = activityLogService.getMineTokensLogsTodayByPlayer(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined any tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		let maxMineYield = 0;
		for (const mineLog of mineLogs) {
			const numTokens = mineLog.tokensDifference;
			if (numTokens >= MIN_NUM_TOKENS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numTokens > maxMineYield)
				maxMineYield = numTokens;
		}

		return toFailure(`You've only gotten ${maxMineYield} tokens from a single mine at the most. You need to mine at least ${MIN_NUM_TOKENS_NEEDED} tokens at once to complete the "${quest.name}" quest.`);
	},

	// One Hundred Swings
	[Quests.ONE_HUNDRED_SWINGS.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 100;
		const mineLogs = activityLogService.getMineTokensLogsTodayByPlayer(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		const numTimesMined = mineLogs.length;
		if (numTimesMined >= NUM_MINES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You've only mined ${numTimesMined} times today. You need to mine at least ${NUM_MINES_NEEDED} times to complete the "${quest.name}" quest.`);
	},

	// Rapid Extraction
	[Quests.RAPID_EXTRACTION.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 20;
		const SECONDS_TIME_RANGE_NEEDED = 60;
		const mineLogs = activityLogService.getMineTokensLogsTodayByPlayer(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		if (mineLogs.length < NUM_MINES_NEEDED)
			return toFailure(`You have not mined ${NUM_MINES_NEEDED} times yet today. You must mine at least ${NUM_MINES_NEEDED} times before you can complete the "${quest.name}" quest.`);

		let minTimeRangeSeconds = Infinity;
		let firstMineTime = null;
		let numMines = 1;
		for (const mineLog of mineLogs) {
			if (firstMineTime === null)
				firstMineTime = mineLog.timeOccurred;

			if (numMines >= 20) {
				const timeRangeSeconds = getSecondsInTime(
					mineLog.timeOccurred.getTime() - firstMineTime.getTime()
				);

				if (timeRangeSeconds <= SECONDS_TIME_RANGE_NEEDED)
					return PLAYER_MET_CRITERIA_RESULT;

				if (timeRangeSeconds < minTimeRangeSeconds)
					minTimeRangeSeconds = timeRangeSeconds;

				firstMineTime = mineLogs[numMines - 19].timeOccurred;
			}

			numMines++;
		}

		return toFailure(`You've only mined 20 times in ${toDurationTextFromSeconds(minTimeRangeSeconds)} at most. You need to mine at least 20 times in ${SECONDS_TIME_RANGE_NEEDED} seconds to complete the "${quest.name}" quest.`);
	},

	// Lucky Mining Streak
	[Quests.LUCKY_MINING_STREAK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 5;
		const NUM_TOKEN_YIELD_NEEDED = 3;
		const mineLogs = activityLogService.getMineTokensLogsTodayByPlayer(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		if (mineLogs.length < NUM_MINES_NEEDED)
			return toFailure(`You have not mined ${NUM_MINES_NEEDED} times yet today. You must mine at least ${NUM_MINES_NEEDED} times before you can complete the "${quest.name}" quest.`);

		let numGoodEnoughMines = 0;
		for (const mineLog of mineLogs) {
			if (mineLog.tokensDifference >= NUM_TOKEN_YIELD_NEEDED)
				numGoodEnoughMines++;
		}

		if (numGoodEnoughMines >= NUM_MINES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;
		else if (numGoodEnoughMines > 0)
			return toFailure(`You've mined ${NUM_TOKEN_YIELD_NEEDED}+ tokens at once only ${numGoodEnoughMines} times today. You need to do that at least ${NUM_MINES_NEEDED} times to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You never mined ${NUM_TOKEN_YIELD_NEEDED}+ tokens at once today. You need to do that at least once before you can complete the "${quest.name}" quest.`);
	},

	// Mine Together
	[Quests.MINE_TOGETHER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, playerService}: NamesmithServices
	) => {
		const NUM_OTHER_PLAYERS_NEEDED = 1;
		const SECONDS_TIME_RANGE_NEEDED = 60;
		const mineLogs = activityLogService.getMineTokensLogsToday();

		let minTimeRangeSeconds = Infinity;
		let maxDifferentPlayers = 0;
		let didPlayerMine = false;
		const playerID = playerService.resolveID(player);
		const consideredLogs: ActivityLog[] = [];
		for (const mineLog of mineLogs) {
			const doneByConsideredPlayer = consideredLogs.some(log => log.player.id === mineLog.player.id);
			if (doneByConsideredPlayer) continue;

			const playerInConsideredLogs = consideredLogs.some(log =>
				log.player.id === playerID
			);
			const playerDidCurrentLog = mineLog.player.id === playerID;
			const isPlayerIncluded = playerInConsideredLogs || playerDidCurrentLog;
			if (isPlayerIncluded) didPlayerMine = true;

			if (isPlayerIncluded) {
				if (consideredLogs.length >= NUM_OTHER_PLAYERS_NEEDED + 1)
					consideredLogs.shift();
			}
			else {
				// Leave space for player
				if (consideredLogs.length >= NUM_OTHER_PLAYERS_NEEDED)
					consideredLogs.shift();
			}
			consideredLogs.push(mineLog);

			if (consideredLogs.length >= NUM_OTHER_PLAYERS_NEEDED + 1) {
				const lastLog = consideredLogs[consideredLogs.length - 1]!;
				const firstLog = consideredLogs[0]!;
				const timeRange = lastLog.timeOccurred.getTime() - firstLog.timeOccurred.getTime();

				const secondsAchieved = getSecondsInTime(timeRange);
				if (secondsAchieved <= SECONDS_TIME_RANGE_NEEDED) {
					return PLAYER_MET_CRITERIA_RESULT;
				}
				else if (secondsAchieved < minTimeRangeSeconds) {
					minTimeRangeSeconds = secondsAchieved;
				}
			}
			else if (consideredLogs.length > maxDifferentPlayers) {
				maxDifferentPlayers = consideredLogs.length;
			}
		}

		if (didPlayerMine === false)
			return toFailure(`You have not mined today. You must do so before you can complete the "${quest.name}" quest.`);
		else if (maxDifferentPlayers < NUM_OTHER_PLAYERS_NEEDED + 1)
			return toFailure(`You've only mined with ${maxDifferentPlayers - 1} other players. You need to mine with at least ${NUM_OTHER_PLAYERS_NEEDED} others to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You've mined with ${NUM_OTHER_PLAYERS_NEEDED} other player(s) in the span of ${toDurationTextFromSeconds(minTimeRangeSeconds)}. You need to mine with them in the span of ${SECONDS_TIME_RANGE_NEEDED} seconds at most to complete the "${quest.name}" quest.`);
	},

	// Mining Speedrun
	[Quests.MINING_SPEEDRUN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const TOKENS_NEEDED = 35;
		const SECONDS_TIME_RANGE = 60;
		const mineLogs = activityLogService.getMineTokensLogsTodayByPlayer(player);

		if (mineLogs.length === 0) {
			return toFailure(`You have not mined any tokens today. You must mine tokens to complete the "${quest.name}" quest.`);
		}

		let maxTokensEarned = 0;
		for (let numFirstMine = 0; numFirstMine < mineLogs.length; numFirstMine++) {
			let totalEarnedTokens = 0;
			const firstMineLog = mineLogs[numFirstMine];
			const startTime = firstMineLog.timeOccurred;

			for (let numMine = numFirstMine; numMine < mineLogs.length; numMine++) {
				const mineLog = mineLogs[numMine];
				const elapsedSeconds = getSecondsInTime(
					mineLog.timeOccurred.getTime() - startTime.getTime()
				);

				if (elapsedSeconds > SECONDS_TIME_RANGE) break;

				totalEarnedTokens += mineLog.tokensDifference;
				if (totalEarnedTokens >= TOKENS_NEEDED) {
					return PLAYER_MET_CRITERIA_RESULT;
				}
				else if (totalEarnedTokens > maxTokensEarned) {
					maxTokensEarned = totalEarnedTokens;
				}
			}
		}

		return toFailure(`You have only been mined ${maxTokensEarned} tokens at most in the span of ${SECONDS_TIME_RANGE} seconds. You need to mine ${TOKENS_NEEDED} tokens in that time to complete the "${quest.name}" quest.`);
	},

	// Collective Mining
	[Quests.COLLECTIVE_MINING.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, playerService}: NamesmithServices
	) => {
		const TOTAL_TOKENS_NEEDED = 1000;
		const mineLogs = activityLogService.getMineTokensLogsToday();
		const playerID = playerService.resolveID(player);

		let totalTokensEarned = 0;
		let didPlayerMine = false;
		for (const log of mineLogs) {
			if (log.player.id === playerID) {
				didPlayerMine = true;
			}

			totalTokensEarned += log.tokensDifference;
		}

		if (!didPlayerMine) {
			return toFailure(`You have not mined any tokens today. You must contribute to the collective mining to complete the "${quest.name}" quest.`);
		}

		if (totalTokensEarned < TOTAL_TOKENS_NEEDED) {
			return toFailure(`You and other players have collectively mined ${totalTokensEarned} tokens today. You need a total of ${TOTAL_TOKENS_NEEDED} tokens to complete the "${quest.name}" quest.`);
		}

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.GOLD_SPIKE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_MINED_NEDEED = 10;
		const maxTokensFromMine = activityLogService.getMaxTokensEarnedFromLogThisWeek({
			byPlayer: player, 
			ofType: ActivityTypes.MINE_TOKENS
		});

		if (maxTokensFromMine === null)
			return toFailure(`You did not mine any tokens this week. You must mine at least once to complete the "${quest.name}" quest.`);

		if (maxTokensFromMine < NUM_TOKENS_MINED_NEDEED)
			return toFailure(`You only mined ${maxTokensFromMine} tokens at most from a single mine this week. You must earn at least ${NUM_TOKENS_MINED_NEDEED} from one to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.SPEED_MINE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 250
		const TIME_SPAN: Duration = { minutes: 10 };

		const didPlayerMineTokens = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.MINE_TOKENS);
		if (!didPlayerMineTokens)
			return toFailure(`You did not mine any tokens this week. You must mine at least once to complete the "${quest.name}" quest.`);

		const numMinesDone = activityLogService.getNumLogsDoneThisWeek({
			byPlayer: player, 
			ofType: ActivityTypes.MINE_TOKENS
		});
		if (numMinesDone < NUM_MINES_NEEDED)
			return toFailure(`You only mined ${numMinesDone} times this week. You must mine at least ${NUM_MINES_NEEDED} times to complete the "${quest.name}" quest.`);

		const maxMinesDoneInTimeSpan = activityLogService.getMaxLogsDoneThisWeek({
			byPlayer: player, 
			ofType: ActivityTypes.MINE_TOKENS,
			inTimeSpan: TIME_SPAN
		});
		const minTimeTakenToDoMines = activityLogService.getMinTimeOfNumLogsDoneThisWeek(NUM_MINES_NEEDED, {
			byPlayer: player, 
			ofType: ActivityTypes.MINE_TOKENS
		})!;

		if (
			maxMinesDoneInTimeSpan < NUM_MINES_NEEDED && 
			minTimeTakenToDoMines > getMillisecondsOfDuration(TIME_SPAN)
		)
			return toFailure(`You have only mined ${maxMinesDoneInTimeSpan} times at most within ${toDurationText(TIME_SPAN)}. The shortest time it's taken you to mine ${NUM_MINES_NEEDED} times is ${toDurationTextFromTime(minTimeTakenToDoMines)}. You must mine at least ${NUM_MINES_NEEDED} times within ${toDurationText(TIME_SPAN)} time span to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;

	},

	[Quests.MINE_HAUL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_MINED_NEEDED = 1500;
		const didPlayerMine = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.MINE_TOKENS);
		if (!didPlayerMine)
			return toFailure(`You did not mine any tokens this week. You must mine at least once to complete the "${quest.name}" quest.`);

		const tokensEarnedFromMining = activityLogService.getTokensEarnedFromLogsThisWeek({
			byPlayer: player, 
			ofType: ActivityTypes.MINE_TOKENS
		});
		if (tokensEarnedFromMining < NUM_TOKENS_MINED_NEEDED)
			return toFailure(`You only mined ${tokensEarnedFromMining} tokens this week. You must mine at least ${NUM_TOKENS_MINED_NEEDED} tokens to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.INSTANT_SQUAD.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_PLAYERS_NEEDED = 6;
		const TIME_SPAN: Duration = { seconds: 5 };
		const didPlayerMine = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.MINE_TOKENS);
		if (!didPlayerMine)
			return toFailure(`You did not mine any tokens this week. You must mine at least once to complete the "${quest.name}" quest.`);

		const maxPlayersMinedInTimeSpan = activityLogService.getMaxPlayersDoingLogsThisWeek({
			ofType: ActivityTypes.MINE_TOKENS,
			inTimeSpan: TIME_SPAN,
			withPlayer: player
		});
		if (maxPlayersMinedInTimeSpan.length < NUM_PLAYERS_NEEDED)
			return toFailure(`You only mined with ${maxPlayersMinedInTimeSpan.length - 1} other players at most within ${toDurationText(TIME_SPAN)} this week. You must mine with ${NUM_PLAYERS_NEEDED - 1} other players to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.TEN_MINUTE_RUSH.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_MINED_NEEDED = 400;
		const TIME_SPAN = { minutes: 10 };
		const didPlayerMine = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.MINE_TOKENS);
		if (!didPlayerMine)
			return toFailure(`You did not mine any tokens this week. You must mine at least once to complete the "${quest.name}" quest.`);

		const maxTokensMinedInTimeSpan = activityLogService.getMaxTotalTokensEarnedFromLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.MINE_TOKENS,
			inTimeSpan: TIME_SPAN,
		});
		if (maxTokensMinedInTimeSpan < NUM_TOKENS_MINED_NEEDED)
			return toFailure(`You only mined ${maxTokensMinedInTimeSpan} tokens at most within ${toDurationText(TIME_SPAN)} this week. You must mine at least ${NUM_TOKENS_MINED_NEEDED} tokens within ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.COALITION.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOTAL_TOKENS_MINED_NEEDED = 3500;
		const didPlayerMine = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.MINE_TOKENS);
		if (!didPlayerMine)
			return toFailure(`You did not mine any tokens this week. You must contribute at least one mine to complete the "${quest.name}" quest.`);

		const totalTokensMined = activityLogService.getTokensEarnedFromLogsThisWeek({
			ofType: ActivityTypes.MINE_TOKENS,
		})
		if (totalTokensMined < NUM_TOTAL_TOKENS_MINED_NEEDED)
			return toFailure(`Everyone has only collectively mined ${totalTokensMined} tokens this week. Everyone must collectively mine at least ${NUM_TOTAL_TOKENS_MINED_NEEDED} tokens to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},
} as const;
