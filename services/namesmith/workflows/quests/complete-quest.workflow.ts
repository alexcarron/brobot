import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../../types/player.types";
import { Quest, QuestResolvable } from "../../types/quest.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";
import { Quests } from '../../constants/quests.constants';
import { FREEBIE_QUEST_NAME } from '../../constants/test.constants';
import { hasSymbol, hasLetter, hasNumber, getNumDistinctCharacters } from '../../../../utilities/string-checks-utils';
import { NamesmithServices } from "../../types/namesmith.types";
import { addDays, getHoursInTime, getMinutesInTime, getSecondsInTime } from "../../../../utilities/date-time-utils";
import { ActivityLog } from "../../types/activity-log.types";

const PLAYER_MET_CRITERIA = 'questSuccess' as const;
const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		quest: Quest,
	}>(),
	notAPlayer: null,
	questDoesNotExist: null,
	alreadyCompletedQuest: null,
	questCriteriaNotDefined: provides<{questName: string}>(),
	questCriteriaNotMet: provides<{userFeedback: string}>(),
});

type MeetsCriteriaParameters = {
	quest: Quest,
	player: Player,
}

const toFailure = (userFeedbackMessage: string) =>
	result.failure.questCriteriaNotMet({ userFeedback: userFeedbackMessage });

const questIDToMeetsCriteriaCheck = {

	// Experienced Craftsman
	[Quests.EXPERIENCED_CRAFTSMAN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_CRAFTS_NEEDED = 5;
		const NUM_UNIQUE_RECIPES_NEEDED = 3;

		const craftLogs = activityLogService.getCraftLogsForPlayerToday(player);
		const uniqueRecipesCrafted = new Set<number>();

		for (const log of craftLogs) {
			if (!log.involvedRecipe) continue;
			uniqueRecipesCrafted.add(log.involvedRecipe.id);
		}

		if (craftLogs.length < NUM_CRAFTS_NEEDED) {
			return toFailure(
				`You have need to craft at least ${NUM_CRAFTS_NEEDED} times to complete the ${quest.name} quest, but you have only crafted ${craftLogs.length} times. You need to craft ${NUM_CRAFTS_NEEDED - craftLogs.length} more times.`
			);
		}

		if (uniqueRecipesCrafted.size < NUM_UNIQUE_RECIPES_NEEDED) {
			const numHas = uniqueRecipesCrafted.size;
			const numNeeded = NUM_UNIQUE_RECIPES_NEEDED;
			return toFailure(
				`You have to craft at least ${numNeeded} different recipes to complete the ${quest.name} quest, but you have only crafted ${numHas}. You need to craft ${numNeeded - numHas} more recipes you have not used before.`
			)
		}

		return PLAYER_MET_CRITERIA;
	},

	// Diverse Name
	[Quests.DIVERSE_NAME.id]: ({quest, player}: MeetsCriteriaParameters) => {
		const publishedName = player.publishedName;
		let type = null;

		if (publishedName === null) {
			return toFailure(`You have not published your name yet. Your name must be published before you can complete the ${quest.name} quest.`)
		}
		else if (!hasLetter(publishedName))
			type = 'letter';
		else if (!hasSymbol(publishedName))
			type = 'symbol';
		else if (!hasNumber(publishedName))
			type = 'number';
		else
			return PLAYER_MET_CRITERIA;

		return toFailure(`Your name must have at least one ${type} before you can complete the ${quest.name} quest.`)
	},

	// Trade Diplomat
	[Quests.TRADE_DIPLOMAT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_ACCEPTED_TRADES_NEEDED = 1;
		const tradeAcceptedLogs = activityLogService.getAcceptTradeLogsInvolvingPlayerToday(player);

		const uniqueInvolvedPlayers = new Set<string>();
		for (const log of tradeAcceptedLogs) {
			if (!log.player) continue;
			uniqueInvolvedPlayers.add(log.player.id);
		}

		if (tradeAcceptedLogs.length < NUM_ACCEPTED_TRADES_NEEDED) {
			const numHas = tradeAcceptedLogs.length;
			const numNeeded = NUM_ACCEPTED_TRADES_NEEDED;
			return toFailure(
				`You need to make at least ${numNeeded} trades to complete the ${quest.name} quest, but you have only made ${numHas}. You need to trade with ${numNeeded - numHas} more players.`
			)
		}

		if (uniqueInvolvedPlayers.size < NUM_ACCEPTED_TRADES_NEEDED) {
			const numHas = uniqueInvolvedPlayers.size;
			const numNeeded = NUM_ACCEPTED_TRADES_NEEDED;
			return toFailure(
				`You need to have at least ${numNeeded} different player accept your trades to complete the ${quest.name} quest, but only ${numHas} have. You need ${numNeeded - numHas} more unique players to accept your trades.`
			);
		}

		return PLAYER_MET_CRITERIA;
	},

	// Twinsies
	[Quests.TWINSIES.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ playerService }: NamesmithServices
	) => {
		if (player.publishedName === null)
			return toFailure(`You have not published your name yet. Your name must be published before you can complete the ${quest.name} quest.`)

		const allPublishedNames = playerService.getAllPublishedNames();

		const numSamePublishedNames =
			allPublishedNames.filter(publishedName =>
				publishedName !== null &&
				publishedName === player.publishedName
			).length;

		if (numSamePublishedNames < 2)
			return toFailure(`Nobody has the same name as you. You must have at least one player that shares the same published name as you to complete the ${quest.name} quest.`);

		return PLAYER_MET_CRITERIA;
	},

	// Get Rich Quick
	[Quests.GET_RICH_QUICK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_TOKENS_NEEDED = 200;
		const logs = activityLogService.getLogsForPlayerToday(player);

		let totalTokenGain = 0;
		for (const log of logs) {
			if (log.tokensDifference > 0)
				totalTokenGain += log.tokensDifference;
		}

		if (totalTokenGain < NUM_TOKENS_NEEDED) {
			return toFailure(
				`You need to earn at least ${NUM_TOKENS_NEEDED} tokens to complete the ${quest.name} quest, but you only have ${totalTokenGain}. You need to earn ${NUM_TOKENS_NEEDED - totalTokenGain} more.`
			);
		}

		return PLAYER_MET_CRITERIA;
	},

	// Echoed Name
	[Quests.ECHOED_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const changeNameLogs = activityLogService.getChangeNameLogsForPlayerToday(player);

		if (changeNameLogs.length <= 0)
			return toFailure(`You have not changed your name yet. Your name must be changed before you can complete the ${quest.name} quest.`);

		for (const changeNameLog of changeNameLogs) {
			const previousName = changeNameLog.nameChangedFrom;
			const newName = changeNameLog.currentName;

			if (previousName === null || newName === null)
				continue;

			if (previousName.repeat(2) === newName)
				return PLAYER_MET_CRITERIA;
		}

		return toFailure(`You have not changed your name into a repeated version of itself. You must do that before you can complete the ${quest.name} quest.`);
	},

	// Identity Theft
	[Quests.IDENTITY_THEFT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_HOURS_NEEDED = 2;

		const nameToNameIntervals = activityLogService.getNameToNameIntervalsToday();
		const playerNames = activityLogService.getNamesOfPlayerToday(player);
		let sharedNameWithOthers = false;
		let overlapedWithOthers = false;
		let overlapedLongEnough = false;
		for (const playerName of playerNames) {
			const nameIntervals = nameToNameIntervals.get(playerName);
			if (nameIntervals === undefined)
				continue;

			const playerIntervals = [];
			const otherIntervals = [];
			for (const nameInterval of nameIntervals) {
				if (nameInterval.playerID === player.id)
					playerIntervals.push(nameInterval);
				else
					otherIntervals.push(nameInterval);
			}

			if (otherIntervals.length <= 0)
				continue;

			sharedNameWithOthers = true;

			// Check if any player name intervals intersect with any other player name intervals for 2 hours
			for (const playerInterval of playerIntervals) {
				for (const otherInterval of otherIntervals) {
					const overlapStart =
						playerInterval.startTime > otherInterval.startTime
							? playerInterval.startTime
							: otherInterval.startTime;

					const overlapEnd =
						playerInterval.endTime < otherInterval.endTime
							? playerInterval.endTime
							: otherInterval.endTime;

					const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();

					if (overlapDuration <= 0)
						continue;

					overlapedWithOthers = true;

					if (getHoursInTime(overlapDuration) >= NUM_HOURS_NEEDED) {
						overlapedLongEnough = true;
						return PLAYER_MET_CRITERIA;
					}
				}
			}
		}

		if (!sharedNameWithOthers) {
			return toFailure(
				`You haven't matched another player's name today. To complete the "${quest.name}" quest, first change your name to exactly match another player's current name.`
			);
		}
		else if (!overlapedWithOthers) {
			return toFailure(
				`You and another player have never had the same name at the same time. For the "${quest.name}" quest, you must hold the same name as another player simultaneously.`
			);
		}
		else if (!overlapedLongEnough) {
			return toFailure(
				`You haven't kept the same name as another player long enough. Maintain the matching name for at least ${NUM_HOURS_NEEDED} hours to complete the "${quest.name}" quest.`
			);
		}
		else {
			return toFailure(
				`To complete the "${quest.name}" quest, you must keep the same name as another player for at least ${NUM_HOURS_NEEDED} hours.`
			);
		}
	},

	// Fragile Name
	[Quests.FRAGILE_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_HOURS_NEEDED = 8;

		const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(player);

		for (const nameInterval of nameIntervals) {
			const durationTime = nameInterval.endTime.getTime() - nameInterval.startTime.getTime();

			if (getHoursInTime(durationTime) >= NUM_HOURS_NEEDED) {
				return PLAYER_MET_CRITERIA;
			}
		}

		return toFailure(
			`Your current name has not been completely unchanged for at least ${NUM_HOURS_NEEDED} hours. You must ensure no characters are added or removed from your name for ${NUM_HOURS_NEEDED} hours to complete the "${quest.name}" quest.`
		);
	},

	// Hour of Silence
	[Quests.HOUR_OF_SILENCE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService, gameStateService }: NamesmithServices
	) => {
		const NUM_HOURS_OF_SILENCE_NEEDED = 1;

		// Automatically ordered by startTime
		const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(player);
		console.log(nameIntervals);

		if (nameIntervals.length <= 1) {
			return PLAYER_MET_CRITERIA;
		}

		let previousTime: Date | null = null;
		let maxDuration = 0;
		let maxNameInterval = null;
		for (const nameInterval of nameIntervals) {
			if (previousTime === null) {
				previousTime = nameInterval.startTime;
				continue;
			}

			const durationTime = nameInterval.startTime.getTime() - previousTime.getTime();
			if (getHoursInTime(durationTime) >= NUM_HOURS_OF_SILENCE_NEEDED) {
				return PLAYER_MET_CRITERIA;
			}

			if (durationTime > maxDuration) {
				maxDuration = durationTime;
				maxNameInterval = nameInterval;
			}

			previousTime = nameInterval.startTime;
		}

		const startOfToday = gameStateService.getStartOfTodayOrThrow(new Date());
		const endOfToday = addDays(startOfToday, 1);
		const durationTime = endOfToday.getTime() - previousTime!.getTime();
		if (getHoursInTime(durationTime) >= NUM_HOURS_OF_SILENCE_NEEDED) {
			return PLAYER_MET_CRITERIA;
		}

		const maxDurationMinutes = getMinutesInTime(maxDuration);
		const durationDisplay = maxDurationMinutes > 60
			? `${Math.floor(maxDurationMinutes / 60)} hours and ${maxDurationMinutes % 60} minutes`
			: `${maxDurationMinutes} minutes`;

		return toFailure(
			`Everyone has kept their current name unchanged for only ${durationDisplay}. When <@${maxNameInterval!.playerID}> had their name changed to "${maxNameInterval!.name}", they broke the streak. Make sure nobody's current name is changed for at least ${NUM_HOURS_OF_SILENCE_NEEDED} hour(s) to complete the "${quest.name}" quest.`
		);
	},

	// Even Number Name
	[Quests.EVEN_NUMBER_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const publishNameLogs = activityLogService.getPublishNameLogsForPlayerToday(player);

		if (publishNameLogs.length <= 0)
			return toFailure(`You have not published a name yet today. You must publish a name before you can complete the "${quest.name}" quest.`);

		for (const publishNameLog of publishNameLogs) {
			if (/[02468]/.test(publishNameLog.currentName))
				return PLAYER_MET_CRITERIA;
		}

		return toFailure(`You need to publish a name with an even number to complete the "${quest.name}" quest.`);
	},

	// Distinct Dozen
	[Quests.DISTINCT_DOZEN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_REQUIRED_UNQIUE_CHARACTERS = 12;
		const publishNameLogs = activityLogService.getPublishNameLogsForPlayerToday(player);

		if (publishNameLogs.length <= 0)
			return toFailure(`You have not published a name yet today. You must publish a name before you can complete the "${quest.name}" quest.`);

		let maxCharacters = 0;
		for (const publishNameLog of publishNameLogs) {
			const numCharacters = getNumDistinctCharacters(publishNameLog.currentName);

			if (numCharacters >= NUM_REQUIRED_UNQIUE_CHARACTERS)
				return PLAYER_MET_CRITERIA;

			if (numCharacters > maxCharacters)
				maxCharacters = numCharacters;
		}

		return toFailure(`You've only published a name with ${maxCharacters} unique characters at the most. You need to publish a name with at least ${NUM_REQUIRED_UNQIUE_CHARACTERS} unique characters to complete the "${quest.name}" quest.`);
	},

	// High Yield
	[Quests.HIGH_YIELD.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_TOKENS_NEEDED = 5;
		const mineLogs = activityLogService.getMineTokensLogsForPlayerToday(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined any tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		let maxMineYield = 0;
		for (const mineLog of mineLogs) {
			const numTokens = mineLog.tokensDifference;
			if (numTokens >= MIN_NUM_TOKENS_NEEDED)
				return PLAYER_MET_CRITERIA;

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
		const mineLogs = activityLogService.getMineTokensLogsForPlayerToday(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		const numTimesMined = mineLogs.length;
		if (numTimesMined >= NUM_MINES_NEEDED)
			return PLAYER_MET_CRITERIA;

		return toFailure(`You've only mined ${numTimesMined} times today. You need to mine at least ${NUM_MINES_NEEDED} times to complete the "${quest.name}" quest.`);
	},

	// Rapid Extraction
	[Quests.RAPID_EXTRACTION.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 20;
		const SECONDS_TIME_RANGE_NEEDED = 60;
		const mineLogs = activityLogService.getMineTokensLogsForPlayerToday(player);

		if (mineLogs.length <= 0)
			return toFailure(`You have not mined tokens yet today. You must mine tokens before you can complete the "${quest.name}" quest.`);

		if (mineLogs.length < NUM_MINES_NEEDED)
			return toFailure(`You have not mined ${NUM_MINES_NEEDED} times yet today. You must mine at least ${NUM_MINES_NEEDED} times before you can complete the "${quest.name}" quest.`);

		let minTimeRangeSeconds = Infinity;
		let firstMineTime = null;
		let numMines = 1;
		for (const mineLog of mineLogs) {
			if (firstMineTime === null)
				firstMineTime = mineLog.timeOccured;

			if (numMines >= 20) {
				const timeRangeSeconds = mineLog.timeOccured.getTime() - firstMineTime.getTime();

				if (getSecondsInTime(timeRangeSeconds) <= SECONDS_TIME_RANGE_NEEDED)
					return PLAYER_MET_CRITERIA;

				if (timeRangeSeconds < minTimeRangeSeconds)
					minTimeRangeSeconds = timeRangeSeconds;

				firstMineTime = mineLogs[numMines - 19].timeOccured;
			}

			numMines++;
		}

		return toFailure(`You've only mined 20 times in ${getSecondsInTime(minTimeRangeSeconds)} seconds at most. You need to mine at least 20 times in ${SECONDS_TIME_RANGE_NEEDED} seconds to complete the "${quest.name}" quest.`);
	},

	// Lucky Mining Streak
	[Quests.LUCKY_MINING_STREAK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MINES_NEEDED = 5;
		const NUM_TOKEN_YIELD_NEEDED = 3;
		const mineLogs = activityLogService.getMineTokensLogsForPlayerToday(player);

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
			return PLAYER_MET_CRITERIA;
		else if (numGoodEnoughMines > 0)
			return toFailure(`You've mined ${NUM_TOKEN_YIELD_NEEDED}+ tokens at once only ${numGoodEnoughMines} times today. You need to do that at least ${NUM_MINES_NEEDED} times to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You never mined ${NUM_TOKEN_YIELD_NEEDED}+ tokens at once today. You need to do that at least once before you can complete the "${quest.name}" quest.`);
	},

	// Refill Jackpot
	[Quests.REFILL_JACKPOT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_TOKENS_NEEDED = 100;
		const claimRefillLogs = activityLogService.getClaimRefillLogsForPlayerToday(player);

		if (claimRefillLogs.length <= 0)
			return toFailure(`You have not claimed a refill yet today. You must do so before you can complete the "${quest.name}" quest.`);

		let maxRefillYield = 0;
		for (const claimRefillLog of claimRefillLogs) {
			const numTokens = claimRefillLog.tokensDifference;
			if (numTokens >= MIN_NUM_TOKENS_NEEDED)
				return PLAYER_MET_CRITERIA;

			if (numTokens > maxRefillYield)
				maxRefillYield = numTokens;
		}

		return toFailure(`You've only gotten ${maxRefillYield} tokens from a single refill at the most. You need to claim a refill that rewards you at least ${MIN_NUM_TOKENS_NEEDED} tokens to complete the "${quest.name}" quest.`);
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
				const timeRange = lastLog.timeOccured.getTime() - firstLog.timeOccured.getTime();

				const secondsAchieved = getSecondsInTime(timeRange);
				if (secondsAchieved <= SECONDS_TIME_RANGE_NEEDED) {
					return PLAYER_MET_CRITERIA;
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
			return toFailure(`You've mined with ${NUM_OTHER_PLAYERS_NEEDED} other player(s) in the span of ${minTimeRangeSeconds} seconds. You need to mine with them in the span of ${SECONDS_TIME_RANGE_NEEDED} seconds at most to complete the "${quest.name}" quest.`);
	},

	// Mining Speedrun
	[Quests.MINING_SPEEDRUN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const TOKENS_NEEDED = 35;
		const SECONDS_TIME_RANGE = 60;
		const mineLogs = activityLogService.getMineTokensLogsForPlayerToday(player);

		if (mineLogs.length === 0) {
			return toFailure(`You have not mined any tokens today. You must mine tokens to complete the "${quest.name}" quest.`);
		}

		let maxTokensEarned = 0;
		for (let numFirstMine = 0; numFirstMine < mineLogs.length; numFirstMine++) {
			let totalEarnedTokens = 0;
			const firstMineLog = mineLogs[numFirstMine];
			const startTime = firstMineLog.timeOccured;

			for (let numMine = numFirstMine; numMine < mineLogs.length; numMine++) {
				const mineLog = mineLogs[numMine];
				const elapsedSeconds = getSecondsInTime(
					mineLog.timeOccured.getTime() - startTime.getTime()
				);

				if (elapsedSeconds > SECONDS_TIME_RANGE) break;

				totalEarnedTokens += mineLog.tokensDifference;
				if (totalEarnedTokens >= TOKENS_NEEDED) {
					return PLAYER_MET_CRITERIA;
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

		return PLAYER_MET_CRITERIA;
	},
} as const;


/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerResolvable - The player completing the quest.
 * @param parameters.questResolvable - The quest being completed.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{playerResolvable, questResolvable}: {
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
	}
) {
	const services = getNamesmithServices();
	const {playerService, questService, activityLogService} = services;

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer();
	}

	if (!questService.isQuest(questResolvable)) {
		return result.failure.questDoesNotExist();
	}

	if (activityLogService.hasPlayerAlreadyCompletedQuest(playerResolvable, questResolvable)) {
		return result.failure.alreadyCompletedQuest();
	}

	const quest = questService.resolveQuest(questResolvable);
	const player = playerService.resolvePlayer(playerResolvable);
	if (quest.id in questIDToMeetsCriteriaCheck) {
		const questID = quest.id as keyof typeof questIDToMeetsCriteriaCheck;
		const getMeetsCriteriaResult = questIDToMeetsCriteriaCheck[questID];
		const meetsCriteriaResult = getMeetsCriteriaResult(
			{quest, player}, services
		);
		if (meetsCriteriaResult !== PLAYER_MET_CRITERIA)
			return meetsCriteriaResult;
	}
	else {
		if (!quest.name.includes(FREEBIE_QUEST_NAME))
			return result.failure.questCriteriaNotDefined({questName: quest.name});
	}

	const nameBefore = player.currentName;
	questService.givePlayerRewards(playerResolvable, questResolvable);

	activityLogService.logCompleteQuest({
		playerCompletingQuest: playerResolvable,
		questCompleted: questResolvable,
		tokensRewarded: quest.tokensReward,
		charactersRewarded: quest.charactersReward,
		nameBefore,
	});

	return result.success({
		player: playerService.resolvePlayer(playerResolvable),
		quest: questService.resolveQuest(questResolvable),
	});
}