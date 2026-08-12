import { Duration, getMillisecondsOfDuration, getSecondsInTime, toDurationText, toDurationTextFromSeconds, toDurationTextFromTime } from "../../../../../utilities/date-time-utils";
import { Quests } from "../../../constants/quest.constants";
import { ActivityLog, ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about claiming token refills.
 */
export const refillEligibilityChecks = {

	// Refill Jackpot
	[Quests.REFILL_JACKPOT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_TOKENS_NEEDED = 100;
		const claimRefillLogs = activityLogService.getClaimRefillLogsTodayByPlayer(player);

		if (claimRefillLogs.length <= 0)
			return toFailure(`You have not claimed a refill yet today. You must do so before you can complete the "${quest.name}" quest.`);

		let maxRefillYield = 0;
		for (const claimRefillLog of claimRefillLogs) {
			const numTokens = claimRefillLog.tokensDifference;
			if (numTokens >= MIN_NUM_TOKENS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numTokens > maxRefillYield)
				maxRefillYield = numTokens;
		}

		return toFailure(`You've only gotten ${maxRefillYield} tokens from a single refill at the most. You need to claim a refill that rewards you at least ${MIN_NUM_TOKENS_NEEDED} tokens to complete the "${quest.name}" quest.`);
	},

	// Refill Frenzy
	[Quests.REFILL_FRENZY.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_REFILLS_NEEDED = 5;
		const claimRefillLogs = activityLogService.getClaimRefillLogsTodayByPlayer(player);

		if (claimRefillLogs.length <= 0)
			return toFailure(`You have not claimed a refill yet today. You must claim one before you can complete the "${quest.name}" quest.`);

		const numTimesMined = claimRefillLogs.length;
		if (numTimesMined >= NUM_REFILLS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You've only claimed ${numTimesMined} refills today. You need to claim at least ${NUM_REFILLS_NEEDED} to complete the "${quest.name}" quest.`);
	},

	// Instant Refill
	[Quests.INSTANT_REFILL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MAX_SECONDS_AFTER_READY = 60;
		const claimRefillLogs = activityLogService.getClaimRefillLogsTodayByPlayer(player);

		if (claimRefillLogs.length <= 0)
			return toFailure(`You have not claimed a refill yet today. You must claim one before you can complete the "${quest.name}" quest.`);

		let minSecondsAfterReady = Infinity;
		for (const log of claimRefillLogs) {
			if (log.timeCooldownExpired === null)
				continue;

			const timeAfterReady = log.timeOccurred.getTime() - log.timeCooldownExpired.getTime();
			const secondsAfterReady = getSecondsInTime(timeAfterReady);
			if (secondsAfterReady <= MAX_SECONDS_AFTER_READY) {
				return PLAYER_MET_CRITERIA_RESULT;
			}

			if (secondsAfterReady < minSecondsAfterReady) {
				minSecondsAfterReady = secondsAfterReady;
			}
		}

		if (minSecondsAfterReady === Infinity)
			return toFailure(`You have have not claimed a refill after a cooldown yet. You must claim a refill instantly after another refill you claimed expired to complete the "${quest.name}" quest.`);

		return toFailure(`You claimed a refill ${toDurationTextFromSeconds(minSecondsAfterReady)} after the cooldown expired. You need to claim one ${MAX_SECONDS_AFTER_READY} seconds after the cooldown expired to complete the "${quest.name}" quest.`);
	},

	// Refill Together
	[Quests.REFILL_TOGETHER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, playerService}: NamesmithServices
	) => {
		const NUM_OTHER_PLAYERS_NEEDED = 2;
		const SECONDS_TIME_RANGE_NEEDED = 60;
		const claimRefillLogs = activityLogService.getClaimRefillLogsToday();

		let minTimeRangeSeconds = Infinity;
		let maxDifferentPlayers = 0;
		let didPlayerRefill = false;
		const playerID = playerService.resolveID(player);
		const consideredLogs: ActivityLog[] = [];
		for (const claimRefillLog of claimRefillLogs) {
			const doneByConsideredPlayer = consideredLogs.some(log =>
				log.player.id === claimRefillLog.player.id
			);
			if (doneByConsideredPlayer) continue;

			const playerInConsideredLogs = consideredLogs.some(log =>
				log.player.id === playerID
			);
			const playerDidCurrentLog = claimRefillLog.player.id === playerID;
			const isPlayerIncluded = playerInConsideredLogs || playerDidCurrentLog;
			if (isPlayerIncluded) didPlayerRefill = true;

			if (isPlayerIncluded) {
				if (consideredLogs.length >= NUM_OTHER_PLAYERS_NEEDED + 1)
					consideredLogs.shift();
			}
			else {
				// Leave space for player
				if (consideredLogs.length >= NUM_OTHER_PLAYERS_NEEDED)
					consideredLogs.shift();
			}
			consideredLogs.push(claimRefillLog);

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

		if (didPlayerRefill === false)
			return toFailure(`You have not claimed a refill today. You must do so before you can complete the "${quest.name}" quest.`);
		else if (maxDifferentPlayers < NUM_OTHER_PLAYERS_NEEDED + 1)
			return toFailure(`You've only claimed a refill with ${maxDifferentPlayers - 1} other players. You need to claim one with at least ${NUM_OTHER_PLAYERS_NEEDED} others to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You've claimed a refill with ${NUM_OTHER_PLAYERS_NEEDED} other player(s) in the span of ${toDurationTextFromSeconds(minTimeRangeSeconds)}. You need to mine with them in the span of ${SECONDS_TIME_RANGE_NEEDED} seconds at most to complete the "${quest.name}" quest.`);
	},

	[Quests.REFILL_RAID.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_NEEDED = 500;
		const didPlayerRefill = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CLAIM_REFILL);
		if (!didPlayerRefill)
			return toFailure(`You did not claim any refills this week. You must claim at least one refill to complete the "${quest.name}" quest.`);

		const maxTokensFromRefill = activityLogService.getMaxTokensEarnedFromLogThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CLAIM_REFILL,
		});
		if (maxTokensFromRefill < NUM_TOKENS_NEEDED)
			return toFailure(`You have only claimed ${maxTokensFromRefill} tokens at most this week from a single refill. You must claim at least ${NUM_TOKENS_NEEDED} tokens from one to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.MASS_REFILL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_OTHER_PLAYERS_NEEDED = 5;
		const TIME_SPAN: Duration = { minutes: 1 };
		const didPlayerRefill = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CLAIM_REFILL);
		if (!didPlayerRefill)
			return toFailure(`You did not claim any refills this week. You must claim at least one refill to complete the "${quest.name}" quest.`);

		const maxPlayersRefillInTimeSpan = activityLogService.getMaxPlayersDoingLogsThisWeek({
			ofType: ActivityTypes.CLAIM_REFILL,
			inTimeSpan: TIME_SPAN,
			withPlayer: player
		});
		if (maxPlayersRefillInTimeSpan.length < NUM_OTHER_PLAYERS_NEEDED + 1)
			return toFailure(`You only claimed a refill with ${maxPlayersRefillInTimeSpan.length - 1} other players at most within ${toDurationText(TIME_SPAN)} this week. You must claim a refill with ${NUM_OTHER_PLAYERS_NEEDED} other players to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.COLD_SERVER.id]: (
		{quest}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_HOURS_OF_SILENCE_NEEDED = 16;
		const maxTimeOfNoRefill = activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
			ofType: ActivityTypes.CLAIM_REFILL
		});
		if (maxTimeOfNoRefill < getMillisecondsOfDuration({hours: NUM_HOURS_OF_SILENCE_NEEDED}))
			return toFailure(`Everyone has only gone ${toDurationTextFromTime(maxTimeOfNoRefill)} without claiming a refill this week. You must ensure no player claims a refill for a continuous ${NUM_HOURS_OF_SILENCE_NEEDED}-hour period to complete the "${quest.name}" quest.`);
		
		return PLAYER_MET_CRITERIA_RESULT;
	},
} as const;
