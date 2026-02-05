import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Player, PlayerID, PlayerResolvable } from "../../types/player.types";
import { Quest, QuestResolvable, RewardTypes } from "../../types/quest.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";
import { Quests } from '../../constants/quests.constants';
import { FREEBIE_QUEST_NAME } from '../../constants/test.constants';
import { hasSymbol, hasLetter, hasNumber, getNumDistinctCharacters, getCharacters, getNumCharacters, hasEmoji } from '../../../../utilities/string-checks-utils';
import { NamesmithServices } from "../../types/namesmith.types";
import { addDays, Duration, getHoursInTime, getMillisecondsOfDuration, getMinutesDurationFromTime, getMinutesInTime, toDurationTextFromSeconds, getSecondsInTime, toDurationText, toDurationTextFromTime } from "../../../../utilities/date-time-utils";
import { ActivityLog, ActivityTypes } from "../../types/activity-log.types";
import { MysteryBoxID, MysteryBoxName } from "../../types/mystery-box.types";
import { hasUtilityCharacter } from "../../utilities/character.utility";
import { RecipeID } from "../../types/recipe.types";
import { sortByDescendingProperty } from "../../../../utilities/data-structure-utils";
import { toListOfWords } from "../../../../utilities/string-manipulation-utils";
import { UTILITY_CHARACTERS } from "../../constants/characters.constants";
import { TradeID } from "../../types/trade.types";

const PLAYER_MET_CRITERIA_RESULT = 'questSuccess' as const;
const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		quest: Quest,
	}>(),
	notAPlayer: null,
	questDoesNotExist: null,
	hiddenQuestNotUnlocked: null,
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

		const craftLogs = activityLogService.getCraftLogsTodayByPlayer(player);
		const uniqueRecipesCrafted = new Set<number>();

		for (const log of craftLogs) {
			if (log.involvedRecipe === null) continue;
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

		return PLAYER_MET_CRITERIA_RESULT;
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
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`Your name must have at least one ${type} before you can complete the ${quest.name} quest.`)
	},

	// Trade Diplomat
	[Quests.TRADE_DIPLOMAT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_ACCEPTED_TRADES_NEEDED = 1;
		const tradeAcceptedLogs = activityLogService.getAcceptTradeLogsTodayWithRecpient(player);

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

		return PLAYER_MET_CRITERIA_RESULT;
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

		return PLAYER_MET_CRITERIA_RESULT;
	},

	// Get Rich Quick
	[Quests.GET_RICH_QUICK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const NUM_TOKENS_NEEDED = 200;
		const logs = activityLogService.getLogsTodayByPlayer(player);

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

		return PLAYER_MET_CRITERIA_RESULT;
	},

	// Echoed Name
	[Quests.ECHOED_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ activityLogService }: NamesmithServices
	) => {
		const changeNameLogs = activityLogService.getChangeNameLogsTodayByPlayer(player);

		if (changeNameLogs.length <= 0)
			return toFailure(`You have not changed your name yet. Your name must be changed before you can complete the ${quest.name} quest.`);

		for (const changeNameLog of changeNameLogs) {
			const previousName = changeNameLog.nameChangedFrom;
			const newName = changeNameLog.currentName;

			if (previousName === null || newName === null)
				continue;

			if (previousName.repeat(2) === newName)
				return PLAYER_MET_CRITERIA_RESULT;
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
						return PLAYER_MET_CRITERIA_RESULT;
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
				return PLAYER_MET_CRITERIA_RESULT;
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
			return PLAYER_MET_CRITERIA_RESULT;
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
				return PLAYER_MET_CRITERIA_RESULT;
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
			return PLAYER_MET_CRITERIA_RESULT;
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
		const publishNameLogs = activityLogService.getPublishNameLogsTodayByPlayer(player);

		if (publishNameLogs.length <= 0)
			return toFailure(`You have not published a name yet today. You must publish a name before you can complete the "${quest.name}" quest.`);

		for (const publishNameLog of publishNameLogs) {
			if (/[02468]/.test(publishNameLog.currentName))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You need to publish a name with an even number to complete the "${quest.name}" quest.`);
	},

	// Distinct Dozen
	[Quests.DISTINCT_DOZEN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_REQUIRED_UNQIUE_CHARACTERS = 12;
		const publishNameLogs = activityLogService.getPublishNameLogsTodayByPlayer(player);

		if (publishNameLogs.length <= 0)
			return toFailure(`You have not published a name yet today. You must publish a name before you can complete the "${quest.name}" quest.`);

		let maxCharacters = 0;
		for (const publishNameLog of publishNameLogs) {
			const numCharacters = getNumDistinctCharacters(publishNameLog.currentName);

			if (numCharacters >= NUM_REQUIRED_UNQIUE_CHARACTERS)
				return PLAYER_MET_CRITERIA_RESULT;

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

	// Treasure Hunter
	[Quests.TREASURE_HUNTER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_MYSTERY_BOXES_NEEDED = 5;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy one before you can complete the "${quest.name}" quest.`);

		const numBought = mysteryBoxLogs.length;
		if (numBought >= NUM_MYSTERY_BOXES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You've only bought ${numBought} mystery boxes today. You need to buy at least ${NUM_MYSTERY_BOXES_NEEDED} to complete the "${quest.name}" quest.`);
	},

	// Rapid Boxes
	[Quests.RAPID_BOXES.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_BOXES_NEEDED = 3;
		const SECONDS_TIME_RANGE_NEEDED = 60;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		if (mysteryBoxLogs.length < NUM_BOXES_NEEDED)
			return toFailure(`You have not bought ${NUM_BOXES_NEEDED} mystery boxes yet today. You must buy at least ${NUM_BOXES_NEEDED} before you can complete the "${quest.name}" quest.`);

		let minTimeRangeSeconds = Infinity;
		let firstBoughtBoxTime = null;
		let numBoxes = 1;
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (firstBoughtBoxTime === null)
				firstBoughtBoxTime = mysteryBoxLog.timeOccurred;

			if (numBoxes >= NUM_BOXES_NEEDED) {
				const timeRangeSeconds = getSecondsInTime(
					mysteryBoxLog.timeOccurred.getTime() - firstBoughtBoxTime.getTime()
				);

				if (timeRangeSeconds <= SECONDS_TIME_RANGE_NEEDED)
					return PLAYER_MET_CRITERIA_RESULT;

				if (timeRangeSeconds < minTimeRangeSeconds)
					minTimeRangeSeconds = timeRangeSeconds;

				firstBoughtBoxTime = mysteryBoxLogs[numBoxes - NUM_BOXES_NEEDED + 1].timeOccurred;
			}

			numBoxes++;
		}

		return toFailure(`You've only bought ${NUM_BOXES_NEEDED} mystery boxes in ${toDurationTextFromSeconds(minTimeRangeSeconds)} at most. You need to buy at least ${NUM_BOXES_NEEDED} in ${SECONDS_TIME_RANGE_NEEDED} seconds to complete the "${quest.name}" quest.`);
	},

	// Familiar Face
	[Quests.FAMILIAR_FACE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			if (mysteryBoxLog.nameChangedFrom === null)
				continue;

			const recievedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			if (recievedCharacters.some(char =>
				mysteryBoxLog.nameChangedFrom!.includes(char)
			))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not received any characters from a mystery box that were already in your name. You must do that to complete the "${quest.name}" quest.`);
	},

	// Mystery Box Splurge
	[Quests.MYSTERY_BOX_SPLURGE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_SPENT_NEEDED = 750;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		let totalTokensSpent = 0;
		for (const mysteryBoxLog of mysteryBoxLogs) {
			totalTokensSpent -= mysteryBoxLog.tokensDifference;
		}

		if (totalTokensSpent >= NUM_TOKENS_SPENT_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You have only spent ${totalTokensSpent} tokens on mystery boxes today. You need to spend at least ${NUM_TOKENS_SPENT_NEEDED} tokens to complete the "${quest.name}" quest.`);
	},

	// Mystery Box Collector
	[Quests.MYSTERY_BOX_COLLECTOR.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_UNIQUE_MYSTERY_BOXES_NEEDED = 3;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		const mysteryBoxIDs = new Set<MysteryBoxID>();
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.involvedMysteryBox === null)
				continue;

			mysteryBoxIDs.add(mysteryBoxLog.involvedMysteryBox.id);
		}

		if (mysteryBoxIDs.size >= NUM_UNIQUE_MYSTERY_BOXES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You have only bought ${mysteryBoxIDs.size} unique mystery boxes today. You need to buy at least ${NUM_UNIQUE_MYSTERY_BOXES_NEEDED} unique ones to complete the "${quest.name}" quest.`);
	},

	// Big Spender
	[Quests.BIG_SPENDER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, mysteryBoxService}: NamesmithServices
	) => {
		const mysteryBoxes = mysteryBoxService.getMysteryBoxes();

		let mostExpensiveBox = null;
		for (const mysteryBox of mysteryBoxes) {
			if (mostExpensiveBox === null)
				mostExpensiveBox = mysteryBox;

			if (mysteryBox.tokenCost > mostExpensiveBox.tokenCost)
				mostExpensiveBox = mysteryBox;
		}

		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.involvedMysteryBox === null)
				continue;

			if (mysteryBoxLog.involvedMysteryBox.id === mostExpensiveBox!.id)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not bought the most expensive mystery box, "${mostExpensiveBox!.name}". You must buy it to complete the "${quest.name}" quest.`);
	},

	// Bonus Loot
	[Quests.BONUS_LOOT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_RECIEVED_CHARACTERS_NEEDED = 2;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		let maxNumCharactersRecieved = 0;
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const numCharactersRecieved = getNumCharacters(mysteryBoxLog.charactersGained);

			if (numCharactersRecieved >= NUM_RECIEVED_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numCharactersRecieved > maxNumCharactersRecieved)
				maxNumCharactersRecieved = numCharactersRecieved;
		}


		return toFailure(`You have only recieved ${maxNumCharactersRecieved} character(s) at most from a mystery box today. You need to recieve at least ${NUM_RECIEVED_CHARACTERS_NEEDED} characters from a single mystery box to complete the "${quest.name}" quest.`);
	},

	// Expected Reward
	[Quests.EXPECTED_REWARD.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const CHARACTER_NEEDED = 'e';
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const recievedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			if (recievedCharacters.includes(CHARACTER_NEEDED))
				return PLAYER_MET_CRITERIA_RESULT;
		}


		return toFailure(`You have not recieved the character "${CHARACTER_NEEDED}" from a mystery box today. You need to recieve one to complete the "${quest.name}" quest.`);
	},

	// Three of a Kind
	[Quests.THREE_OF_A_KIND.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_SAME_RECIEVED_CHARACTERS_NEEDED = 3;
		const mysteryBoxLogs = activityLogService.getBuyMysteryBoxLogsTodayByPlayer(player);

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		const charactersCount: Record<string, number> = {};
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const recievedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			for (const character of recievedCharacters) {
				if (charactersCount[character] === undefined)
					charactersCount[character] = 0;

				charactersCount[character]++;
			}
		}

		let maxCharacterCount = 0;
		let maxCharacter = null;
		for (const characterCount of Object.entries(charactersCount)) {
			const [character, count] = characterCount;
			if (count >= NUM_SAME_RECIEVED_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (count > maxCharacterCount) {
				maxCharacterCount = count;
				maxCharacter = character;
			}
		}

		if (maxCharacter !== null)
			return toFailure(`You have recieved the character "${maxCharacter}" ${maxCharacterCount} times today from mystery boxes, but you need to recieve the same character at least ${NUM_SAME_RECIEVED_CHARACTERS_NEEDED} times to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You have not recieved the same character ${NUM_SAME_RECIEVED_CHARACTERS_NEEDED} times today from mystery boxes. You need to do that to complete the "${quest.name}" quest.`);
	},

	// ALL IN
	[Quests.ALL_IN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const currentTokens = player.tokens;
		const logs = activityLogService.getLogsTodayByPlayer(player);

		let hasBoughtMysteryBox = false;
		let minTokensAfterLog = Infinity;
		let tokensAfterLog = currentTokens
		// Loop through logs in reverse order
		for (let index = logs.length - 1; index >= 0; index--) {
			const log = logs[index];

			if (log.type === ActivityTypes.BUY_MYSTERY_BOX) {
				hasBoughtMysteryBox = true;

				if (tokensAfterLog === 0)
					return PLAYER_MET_CRITERIA_RESULT;

				if (tokensAfterLog < minTokensAfterLog)
					minTokensAfterLog = tokensAfterLog;
			}

			tokensAfterLog -= log.tokensDifference;
		}

		if (!hasBoughtMysteryBox)
			return toFailure(`You have not bought any mystery boxes today. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		return toFailure(`Buying a mystery box has only brought you down to ${minTokensAfterLog} tokens. You need to spend EVERY token you have on a mystery box to complete the "${quest.name}" quest.`);
	},

	// Emoji Alchemist
	[Quests.EMOJI_ALCHEMIST.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			if (hasEmoji(recipeLog.involvedRecipe.outputCharacters))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not crafted any emojis today. You must use a recipe that crafts an emoji to complete the "${quest.name}" quest.`);
	},

	// Many for One
	[Quests.MANY_FOR_ONE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_INPUT_CHARACTERS_NEEDED = 3;
		const MAX_OUTPUT_CHARACTERS_NEEDED = 1;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = getCharacters(recipeLog.involvedRecipe.inputCharacters);
			const outputCharacters = getCharacters(recipeLog.involvedRecipe.outputCharacters);

			if (inputCharacters.length >= MIN_INPUT_CHARACTERS_NEEDED && outputCharacters.length <= MAX_OUTPUT_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not crafted a recipe with at least ${MIN_INPUT_CHARACTERS_NEEDED} input characters and at most ${MAX_OUTPUT_CHARACTERS_NEEDED} output character(s) today. You must use a recipe with these requirements to complete the "${quest.name}" quest.`);
	},

	// Great Deal
	[Quests.GREAT_DEAL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, tradeService}: NamesmithServices
	) => {
		const MAX_CHARACTERS_GIVING = 1;
		const MIN_CHARACTERS_GETTING = 3;
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsTodayWithRecpient(player);

		if (acceptTradeLogs.length <= 0) {
			const createTradeLogs = activityLogService.getInitiateTradeLogsTodayByPlayer(player);

			if (createTradeLogs.length <= 0)
				return toFailure(`You have not created any trades today. You must initiate one before you can complete the "${quest.name}" quest.`);

			return toFailure(`You have not had a one of your trades accepted today. You must have one accepted before you can complete the "${quest.name}" quest.`);
		}

		for (const acceptTradeLog of acceptTradeLogs) {
			if (acceptTradeLog.involvedTrade === null)
				continue;

			const trade = acceptTradeLog.involvedTrade;

			const charactersGiving = tradeService.getCharactersPlayerIsGiving(trade, player);
			const charactersGetting = tradeService.getCharactersPlayerIsGetting(trade, player);

			if (
				charactersGiving.length <= MAX_CHARACTERS_GIVING &&
				charactersGetting.length >= MIN_CHARACTERS_GETTING
			)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not successfully traded only one character for three or more in return today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Crafty Crafter
	[Quests.CRAFTY_CRAFTER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		let numRecipesWithUtilities = 0;
		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = recipeLog.involvedRecipe.inputCharacters;

			if (hasUtilityCharacter(inputCharacters))
				numRecipesWithUtilities++;
		}

		if (numRecipesWithUtilities >= MIN_RECIPES_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You crafted only ${numRecipesWithUtilities} recipes with utility characters today. You must craft at least ${MIN_RECIPES_NEEDED} to complete the "${quest.name}" quest.`);
	},

	// Large Output
	[Quests.LARGE_OUTPUT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_NUM_OUTPUT_CHARACTERS_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const outputCharacters = getCharacters(recipeLog.involvedRecipe.outputCharacters);

			if (outputCharacters.length >= MIN_NUM_OUTPUT_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not craft a recipe that gave you at least ${MIN_NUM_OUTPUT_CHARACTERS_NEEDED} characters today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Dual Artisan
	[Quests.DUAL_ARTISAN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		const outputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
			continue;

			const outputCharacters = recipeLog.involvedRecipe.outputCharacters;

			if (!outputCharacterToRecipes.has(outputCharacters))
				outputCharacterToRecipes.set(outputCharacters, new Set());

			const recipesSet = outputCharacterToRecipes.get(outputCharacters)!;
			recipesSet.add(recipeLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not craft the exact same character(s) using at least ${MIN_RECIPES_NEEDED} different recipes today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Recipe Remix
	[Quests.RECIPE_REMIX.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 2;
		const recipeLogs = activityLogService.getCraftLogsTodayByPlayer(player);

		if (recipeLogs.length <= 0)
			return toFailure(`You have not crafted any characters today. You must use a recipe before you can complete the "${quest.name}" quest.`);

		const inputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const recipeLog of recipeLogs) {
			if (recipeLog.involvedRecipe === null)
				continue;

			const inputCharacters = recipeLog.involvedRecipe.inputCharacters;

			if (!inputCharacterToRecipes.has(inputCharacters))
				inputCharacterToRecipes.set(inputCharacters, new Set());

			const recipesSet = inputCharacterToRecipes.get(inputCharacters)!;
			recipesSet.add(recipeLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You did not use the same character(s) in at least ${MIN_RECIPES_NEEDED} different recipes today. You must do that to complete the "${quest.name}" quest.`);
	},

	// Scam
	[Quests.SCAM.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, tradeService}: NamesmithServices
	) => {
		const MAX_CHARACTERS_GIVEN = 1;
		const MIN_CHARACTERS_RECEIVED = 5;
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsTodayInvolvingPlayer(player);

		if (acceptTradeLogs.length <= 0)
			return toFailure(`You have not been involved in any accepted trades today. You must accept a trade or have a trade of yours accepted before you can complete the "${quest.name}" quest.`);

		let minCharactersGiven = Infinity;
		let maxCharactersReceived = 0;
		for (const acceptTradeLog of acceptTradeLogs) {
			if (acceptTradeLog.involvedTrade === null)
				continue;

			const givenCharacters = tradeService.getCharactersPlayerIsGiving(acceptTradeLog.involvedTrade, player);
			const receivedCharacters = tradeService.getCharactersPlayerIsGetting(acceptTradeLog.involvedTrade, player);

			const numGivenCharacters = getNumCharacters(givenCharacters);
			const numReceivedCharacters = getNumCharacters(receivedCharacters);

			if (
				numGivenCharacters <= MAX_CHARACTERS_GIVEN && numReceivedCharacters >= MIN_CHARACTERS_RECEIVED
			) {
				return PLAYER_MET_CRITERIA_RESULT;
			}

			if (numGivenCharacters < minCharactersGiven)
				minCharactersGiven = givenCharacters.length;

			if (numReceivedCharacters > maxCharactersReceived)
				maxCharactersReceived = receivedCharacters.length;
		}

		if (minCharactersGiven > MAX_CHARACTERS_GIVEN)
			return toFailure(`You've only had trades accepted where you gave away ${minCharactersGiven} characters at the minimum. You must give away only ${MAX_CHARACTERS_GIVEN} character(s) in a trade to complete the "${quest.name}" quest.`);

		return toFailure(`You've only had trades accepted where you received ${maxCharactersReceived} characters at most. You must receive at least ${MIN_CHARACTERS_RECEIVED} character(s) in a trade to complete the "${quest.name}" quest.`);
	},

	// Seal the Deal
	[Quests.SEAL_THE_DEAL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TRADES_ACCEPTED_NEEDED = 1
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsByPlayer(player)

		if (acceptTradeLogs.length <= 0)
			return toFailure(`You have not accepted any trades today. You must accept a trade before you can complete the "${quest.name}" quest.`);

		if (acceptTradeLogs.length >= NUM_TRADES_ACCEPTED_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You've have not accepted any trades today. You must accept a trade(s) to complete the "${quest.name}" quest.`);
	},

	// Rejecting Profit
	[Quests.REJECTING_PROFIT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, tradeService}: NamesmithServices
	) => {
		const NUM_MORE_CHARACTERS_THAN_GIVING = 5
		const declineTradeLogs = activityLogService.getDeclineTradeLogsTodayByPlayer(player);

		if (declineTradeLogs.length <= 0)
			return toFailure(`You have not declined any trades today. You must decline a trade before you can complete the "${quest.name}" quest.`);

		let maxNumMoreCharactersThanGiving = Number.NEGATIVE_INFINITY;

		for (const declineTradeLog of declineTradeLogs) {
			if (declineTradeLog.involvedTrade === null)
				continue;

			const charactersGiven = tradeService.getCharactersPlayerIsGiving(declineTradeLog.involvedTrade, player);
			const charactersReceived = tradeService.getCharactersPlayerIsGetting(declineTradeLog.involvedTrade, player);

			const numCharactersGiven = getNumCharacters(charactersGiven);
			const numCharactersReceived = getNumCharacters(charactersReceived);

			const numMoreCharactersThanGiving = numCharactersReceived - numCharactersGiven;

			if (numMoreCharactersThanGiving >= NUM_MORE_CHARACTERS_THAN_GIVING)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numMoreCharactersThanGiving > maxNumMoreCharactersThanGiving)
				maxNumMoreCharactersThanGiving = numMoreCharactersThanGiving;
		}

		if (maxNumMoreCharactersThanGiving > 0) {
			return toFailure(`You have only declined a trade where you received ${maxNumMoreCharactersThanGiving} more characters than you gave. You must receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
		else if (maxNumMoreCharactersThanGiving === 0) {
			return toFailure(`You have only declined a trade where you received the same number of characters as you gave. You must receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
		else {
			const minNumLessCharactersThanGiving = maxNumMoreCharactersThanGiving * -1;
			return toFailure(`You have only declined a trade where you received ${minNumLessCharactersThanGiving} less characters than you gave. You must receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
	},

	// Final Offer
	[Quests.FINAL_OFFER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const modifyTradeLogs = activityLogService.getModifyTradeLogsTodayByPlayer(player);

		if (modifyTradeLogs.length <= 0) {
			return toFailure(`You have not modified any trade requests today. You must modify a trade request before you can complete the "${quest.name}" quest.`);
		}

		// Get all trades that the player modified today
		const modifiedTradeIDs = new Set<number>();
		for (const modifyLog of modifyTradeLogs) {
			if (modifyLog.involvedTrade !== null) {
				modifiedTradeIDs.add(modifyLog.involvedTrade.id);
			}
		}

		// Check if any of the modified trades were accepted today
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsTodayWithRecpient(player);
		for (const acceptLog of acceptTradeLogs) {
			if (acceptLog.involvedTrade !== null && modifiedTradeIDs.has(acceptLog.involvedTrade.id)) {
				return PLAYER_MET_CRITERIA_RESULT;
			}
		}

		return toFailure(`You have modified ${modifyTradeLogs.length} trade request(s) today, but none of them have been accepted yet. To complete the "${quest.name}" quest, you need to have another player accept a trade request that you modified.`);
	},

	// Quest Combo
	[Quests.QUEST_COMBO.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_QUESTS_COMPLETED = 2;
		const MAX_MINUTES_BETWEEN_COMPLETES = 10;
		const questLogs = activityLogService.getCompleteQuestLogsTodayByPlayer(player);

		if (questLogs.length < MIN_QUESTS_COMPLETED)
			return toFailure(`You have completed ${questLogs.length} quest(s) today, but you need to complete at least ${MIN_QUESTS_COMPLETED} to complete the "${quest.name}" quest.`);

		let minIntervalTime = Number.POSITIVE_INFINITY;
		let previousCompletionDate: Date | null = null;
		for (const questLog of questLogs) {
			if (previousCompletionDate !== null) {
				const completeQuestInterval = questLog.timeOccurred.getTime() - previousCompletionDate.getTime();

				const intervalDuration = getMinutesDurationFromTime(completeQuestInterval);
				if (intervalDuration.minutes < MAX_MINUTES_BETWEEN_COMPLETES)
						return PLAYER_MET_CRITERIA_RESULT;

				if (
					intervalDuration.minutes === MAX_MINUTES_BETWEEN_COMPLETES &&
					intervalDuration.seconds === 0
				)
					return PLAYER_MET_CRITERIA_RESULT;

				if (completeQuestInterval < minIntervalTime)
					minIntervalTime = completeQuestInterval;
			}

			previousCompletionDate = questLog.timeOccurred;
		}

		return toFailure(`You have completed two quests within ${toDurationTextFromSeconds(minIntervalTime / 1000)} of each other. You must complete two within only ${MAX_MINUTES_BETWEEN_COMPLETES} minutes to complete the "${quest.name}" quest.`);
	},

	// Hoard Tokens
	[Quests.HOARD_TOKENS.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const TOKENS_NEEDED_TO_EARN = 200;
		const tokenDifferenceLogs = activityLogService.getLogsWithTokenDifferenceTodayByPlayer(player);

		let tokensEarnedWithoutSpending = 0;
		let maxTokensEarned = 0;
		for (const tokenDifferenceLog of tokenDifferenceLogs) {
			if (tokenDifferenceLog.tokensDifference > 0) {
				tokensEarnedWithoutSpending += tokenDifferenceLog.tokensDifference;
			}

			if (tokenDifferenceLog.tokensDifference < 0)
				tokensEarnedWithoutSpending = 0;

			if (tokensEarnedWithoutSpending >= TOKENS_NEEDED_TO_EARN)
				return PLAYER_MET_CRITERIA_RESULT;

			if (tokensEarnedWithoutSpending > maxTokensEarned)
				maxTokensEarned = tokensEarnedWithoutSpending;
		}

		return toFailure(`You have earned ${maxTokensEarned} tokens at most without spending any tokens today. You need to earn ${TOKENS_NEEDED_TO_EARN} to complete the "${quest.name}" quest.`);
	},

	// The Richest
	[Quests.THE_RICHEST.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{playerService}: NamesmithServices
	) => {
		const players = playerService.getPlayers();
		const playersSortedByTokens = sortByDescendingProperty(players, 'tokens');

		if (playersSortedByTokens[0].id === player.id)
			return PLAYER_MET_CRITERIA_RESULT;

		const richestPlayerID = playersSortedByTokens[0].id;
		const numTokensOfRichest = playersSortedByTokens[0].tokens;
		return toFailure(`The richest player right now is <@${richestPlayerID}> with ${numTokensOfRichest} tokens. You must be the richest to complete the "${quest.name}" quest.`);
	},

	// Character Collector
	[Quests.CHARACTER_COLLECTOR.id]: (
		{quest, player}: MeetsCriteriaParameters,
	) => {
		const NUM_DISTINCT_CHARACTERS_NEEDED = 35;
		const numDistinctCharacters = getNumDistinctCharacters(player.inventory);

		if (numDistinctCharacters >= NUM_DISTINCT_CHARACTERS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You only have ${numDistinctCharacters} distinct characters in your inventory. You need ${NUM_DISTINCT_CHARACTERS_NEEDED} distinct characters to complete the "${quest.name}" quest.`);
	},

	// You Snooze You Lose
	[Quests.YOU_SNOOZE_YOU_LOSE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const completeThisQuestLogs = activityLogService.getCompleteQuestLogsTodayForQuest(quest);

		if (completeThisQuestLogs.length <= 0)
			return PLAYER_MET_CRITERIA_RESULT;

		const playerIDs = completeThisQuestLogs.map(log => log.player.id);
		const playerMentions = playerIDs.map(id => `<@${id}>`);
		const listOfPlayerMentions = toListOfWords(playerMentions);

		activityLogService.logCompleteQuest({
			playerCompletingQuest: player.id,
			questCompleted: quest.id,
			nameBefore: player.currentName,
		});
		return toFailure(`${listOfPlayerMentions} completed the "${quest.name}" quest before you. You had to be the first to complete it to get the rewards.`);
	},

	// You Snooze You Win
	[Quests.YOU_SNOOZE_YOU_WIN.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const logQuestCompletion = () => activityLogService.logCompleteQuest({
			playerCompletingQuest: player.id,
			questCompleted: quest.id,
			nameBefore: player.currentName,
		});

		const completeThisQuestLogs = activityLogService.getCompleteQuestLogsTodayForQuest(quest);

		if (completeThisQuestLogs.length <= 0) {
			logQuestCompletion();
			return toFailure(`You were the first player to complete the "${quest.name}" quest. You must be the second player to ever complete this quest to get the rewards.`);
		}

		if (completeThisQuestLogs.some(log => log.player.id === player.id)) {
			return toFailure(`You already tried to complete the "${quest.name}" quest.`);
		}

		if (completeThisQuestLogs.length === 1)
			return PLAYER_MET_CRITERIA_RESULT;


		const secondPlayerID = completeThisQuestLogs[1].player.id

		return toFailure(`<@${secondPlayerID}> completed the "${quest.name}" quest second already. You had to have been the second player to complete this quest to get the rewards.`);
	},

	[Quests.PERK_PRIDE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{playerService, perkService}: NamesmithServices
	) => {
		const perkNames = perkService.getPerkNamesOfPlayer(player);
		const nameHasPerkName = playerService.doesNameContainAny(player, perkNames);

		if (nameHasPerkName)
			return PLAYER_MET_CRITERIA_RESULT;

		const listOfPerkNames = toListOfWords(perkNames.map(name => `"${name}"`), 'or');
		return toFailure(`Your current name does not contain the names of any of your perks. Your name must include ${listOfPerkNames} to complete the "${quest.name}" quest.`);
	},

	[Quests.ROLE_CALL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{playerService, roleService}: NamesmithServices
	) => {
		const role = roleService.getRoleOfPlayer(player);
		if (role === null)
			return toFailure(`You do not have a role. You must have a role to complete the "${quest.name}" quest.`);
		
		const nameHasRoleName = playerService.doesNameContain(player, role.name);
		if (!nameHasRoleName)
			return toFailure(`Your current name does not contain your role's name. Your name must include "${role.name}" to complete the "${quest.name}" quest.`);
			
		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.SHOW_TOKENS.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{playerService}: NamesmithServices
	) => {
		const numTokensHas = playerService.getTokens(player);
		
		if (!playerService.hasPublishedName(player))
			return toFailure(`You do not have a published name. You must have publish a name to complete the "${quest.name}" quest.`);

		const publishedNameHasTokens = playerService.doesPublishedNameContain(player, String(numTokensHas));
		if (!publishedNameHasTokens)
			return toFailure(`Your published name does not contain the number of tokens you have. Your published name should have contained "${numTokensHas}" to complete the "${quest.name}" quest.`);
			
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

	[Quests.BOX_BINGE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_BOXES_NEEDED = 25;
		const didPlayerBuyBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didPlayerBuyBox)
			return toFailure(`You did not buy any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);

		const numBoxesBought = activityLogService.getNumLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});
		if (numBoxesBought < NUM_BOXES_NEEDED)
			return toFailure(`You've only bought ${numBoxesBought} mystery boxes this week. You need to buy at least ${NUM_BOXES_NEEDED} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.HYPER_BOXES.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_BOXES_NEEDED = 10;
		const TIME_SPAN: Duration = { minutes: 3 };
		const didPlayerBuyBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didPlayerBuyBox)
			return toFailure(`You did not buy any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);

		const maxBoxesInTimeSpan = activityLogService.getMaxLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX,
			inTimeSpan: TIME_SPAN
		});
		if (maxBoxesInTimeSpan < NUM_BOXES_NEEDED)
			return toFailure(`You only bought ${maxBoxesInTimeSpan} mystery boxes at most within ${toDurationText(TIME_SPAN)} this week. You must buy at least ${NUM_BOXES_NEEDED} within ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.NAMESAKE_BOX.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes this week. You must buy a mystery box before you can complete the "${quest.name}" quest.`);

		if (player.publishedName === null)
			return toFailure(`You have not published your name yet. Your name must be published before you can complete the "${quest.name}" quest.`);

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.involvedMysteryBox === null)
				continue;

			const boxName = mysteryBoxLog.involvedMysteryBox.name;
			if (player.publishedName.toLowerCase().includes(boxName.toLowerCase()))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You never bought a mystery box this week whose name was contained in your published name. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.RIGHTMOST.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes this week. You must buy a mystery box before you can complete the "${quest.name}" quest.`);


		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null || mysteryBoxLog.nameChangedFrom === null)
				continue;

			const rightmostCharacter = mysteryBoxLog.nameChangedFrom[mysteryBoxLog.nameChangedFrom.length - 1];
			const recievedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			console.log({
				mysteryBoxLog,
				rightmostCharacter,
				recievedCharacters
			});
			if (recievedCharacters.includes(rightmostCharacter))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not received the rightmost character of your current name from a mystery box this week. You must receive that character from one to complete the "${quest.name}" quest.`);
	},

	[Quests.BUYOUT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, mysteryBoxService}: NamesmithServices
	) => {
		const allMysteryBoxes = mysteryBoxService.getMysteryBoxes();
		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		if (mysteryBoxLogs.length <= 0)
			return toFailure(`You have not bought any mystery boxes this week. You must buy at least one of every available mystery box type to complete the "${quest.name}" quest.`);

		const boughtMysteryBoxIDs = new Set<MysteryBoxID>();
		const missingMysteryBoxNames = new Set<MysteryBoxName>(allMysteryBoxes.map(mysteryBox => mysteryBox.name));
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.involvedMysteryBox === null)
				continue;

			boughtMysteryBoxIDs.add(mysteryBoxLog.involvedMysteryBox.id);
			missingMysteryBoxNames.delete(mysteryBoxLog.involvedMysteryBox.name);
		}

		const numUniqueMysteryBoxesBought = boughtMysteryBoxIDs.size;
		const totalAvailableMysteryBoxes = allMysteryBoxes.length;

		if (numUniqueMysteryBoxesBought >= totalAvailableMysteryBoxes)
			return PLAYER_MET_CRITERIA_RESULT;

		const mysteryBoxNames = Array.from(missingMysteryBoxNames).map(name => `"${name}"`);
		return toFailure(`You have only bought ${numUniqueMysteryBoxesBought} out of ${totalAvailableMysteryBoxes} available mystery box types this week. You still need to buy ${toListOfWords(mysteryBoxNames)} to complete the "${quest.name}" quest.`);
	},

	[Quests.TRIPLE_PULL.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_CHARACTERS_NEEDED = 3;
		const didBuyMysteryBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didBuyMysteryBox)
			return toFailure(`You have not bought any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);
		
		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		let maxCharactersReceived = 0;
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const numCharactersReceived = getNumCharacters(mysteryBoxLog.charactersGained);

			if (numCharactersReceived >= NUM_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numCharactersReceived > maxCharactersReceived)
				maxCharactersReceived = numCharactersReceived;
		}

		return toFailure(`You have only received ${maxCharactersReceived} characters at most from a mystery box this week. You must receive at least ${NUM_CHARACTERS_NEEDED} to complete the "${quest.name}" quest.`);
	},

	[Quests.FIND_X.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const CHARACTER_NEEDED = 'x';
		const didBuyMysteryBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didBuyMysteryBox)
			return toFailure(`You have not bought any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);

		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const receivedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			if (receivedCharacters.includes(CHARACTER_NEEDED))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not received the character "${CHARACTER_NEEDED}" from any mystery box this week. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.SEVENS.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_SAME_CHARACTERS_NEEDED = 7;
		const didBuyMysteryBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didBuyMysteryBox)
			return toFailure(`You have not bought any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);

		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		const characterCount: Record<string, number> = {};
		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.charactersGained === null)
				continue;

			const receivedCharacters = getCharacters(mysteryBoxLog.charactersGained);

			for (const character of receivedCharacters) {
				if (characterCount[character] === undefined)
					characterCount[character] = 0;

				characterCount[character]++;
			}
		}

		let maxCharacterCount = 0;
		let maxCharacter = null;
		for (const [character, count] of Object.entries(characterCount)) {
			if (count >= NUM_SAME_CHARACTERS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			if (count > maxCharacterCount) {
				maxCharacterCount = count;
				maxCharacter = character;
			}
		}

		if (maxCharacter !== null)
			return toFailure(`You have only received the character "${maxCharacter}" ${maxCharacterCount} times from mystery boxes this week. You need to receive the same character ${NUM_SAME_CHARACTERS_NEEDED} times to complete the "${quest.name}" quest.`);
		else
			return toFailure(`You have not received the same character ${NUM_SAME_CHARACTERS_NEEDED} times from mystery boxes this week. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.PRICED_RIGHT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const didBuyMysteryBox = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.BUY_MYSTERY_BOX);
		if (!didBuyMysteryBox)
			return toFailure(`You have not bought any mystery boxes this week. You must buy at least one to complete the "${quest.name}" quest.`);

		const mysteryBoxLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.BUY_MYSTERY_BOX
		});

		for (const mysteryBoxLog of mysteryBoxLogs) {
			if (mysteryBoxLog.involvedMysteryBox === null || mysteryBoxLog.nameChangedFrom === null)
				continue;

			const boxPrice = String(mysteryBoxLog.involvedMysteryBox.tokenCost);

			if (mysteryBoxLog.nameChangedFrom.includes(boxPrice))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not bought a mystery box whose price is included in your name this week. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.CRAFTING_MARATHON.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_UNIQUE_RECIPES_NEEDED = 15;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const uniqueRecipeIDs = new Set<RecipeID>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			uniqueRecipeIDs.add(craftLog.involvedRecipe.id);
		}

		if (uniqueRecipeIDs.size < NUM_UNIQUE_RECIPES_NEEDED)
			return toFailure(`You have only crafted using ${uniqueRecipeIDs.size} different recipes this week. You need to craft using at least ${NUM_UNIQUE_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.EMOJI_CRAFT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_EMOJIS_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		
		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		let numEmojisCrafted = 0;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			if (hasEmoji(craftLog.involvedRecipe.outputCharacters))
				numEmojisCrafted++;
		}

		if (numEmojisCrafted === 0)
			return toFailure(`You have not crafted any emoji characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		else if (numEmojisCrafted < NUM_EMOJIS_NEEDED)
			return toFailure(`You have only crafted ${numEmojisCrafted} emoji character(s) this week. You need to craft ${NUM_EMOJIS_NEEDED} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.BULK_RECIPE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_INPUT_CHARACTERS_NEEDED = 5;
		const NUM_OUTPUT_CHARACTERS_NEEDED = 1;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);
		
		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		let minOutputCharacters = Number.POSITIVE_INFINITY;
		let maxInputCharacters = Number.NEGATIVE_INFINITY;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			minOutputCharacters = Math.min(minOutputCharacters, craftLog.involvedRecipe.outputCharacters.length);
			maxInputCharacters = Math.max(maxInputCharacters, craftLog.involvedRecipe.inputCharacters.length);
		}

		if (minOutputCharacters > NUM_OUTPUT_CHARACTERS_NEEDED)
			return toFailure(`You never crafted a recipe that gave you only one character this week. You need to craft a recipe that takes at least ${NUM_INPUT_CHARACTERS_NEEDED} characters and gives you one character to complete the "${quest.name}" quest.`);

		if (maxInputCharacters < NUM_INPUT_CHARACTERS_NEEDED)
			return toFailure(`You only crafted a recipe that gave you one character using at most ${maxInputCharacters} characters this week. You need to craft a recipe using at least ${NUM_INPUT_CHARACTERS_NEEDED} characters to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.UTILITY_MASTER.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const utilityCharactersUsed = new Set<string>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const inputCharacters = craftLog.involvedRecipe.inputCharacters;

			if (hasUtilityCharacter(inputCharacters)) {
				const utilityChars = getCharacters(inputCharacters);
				for (const char of utilityChars) {
					if (hasUtilityCharacter(char)) {
						utilityCharactersUsed.add(char);
					}
				}
			}
		}

		if (utilityCharactersUsed.size === 0)
			return toFailure(`You have not used any utility characters in recipes this week. You must craft a recipe with at least one utility character to complete the "${quest.name}" quest.`);

		const allUtilityCharacters = UTILITY_CHARACTERS;
		const missingUtilityCharacters = Array.from(allUtilityCharacters).filter(char => !utilityCharactersUsed.has(char));
		const usedList = toListOfWords(Array.from(utilityCharactersUsed));
		const missingList = toListOfWords(missingUtilityCharacters);

		if (missingUtilityCharacters.length > 0)
			return toFailure(`You have only used the utility characters ${usedList} in your recipes this week. You still need to use ${missingList} in a recipe to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.TRI_FORGE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const outputCharacterToRecipes = new Map<string, Set<RecipeID>>();
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const outputCharacters = craftLog.involvedRecipe.outputCharacters;

			if (!outputCharacterToRecipes.has(outputCharacters))
				outputCharacterToRecipes.set(outputCharacters, new Set());

			const recipesSet = outputCharacterToRecipes.get(outputCharacters)!;
			recipesSet.add(craftLog.involvedRecipe.id);

			if (recipesSet.size >= MIN_RECIPES_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		let maxRecipesForSameOutput = 0;
		for (const recipesSet of outputCharacterToRecipes.values()) {
			if (recipesSet.size > maxRecipesForSameOutput)
				maxRecipesForSameOutput = recipesSet.size;
		}

		if (maxRecipesForSameOutput === 0)
			return toFailure(`You have not crafted any characters this week. You must craft the same character using at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return toFailure(`You have only produced the same character using ${maxRecipesForSameOutput} different recipe(s) this week. You need to produce the same character using at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);
	},

	[Quests.INPUT_REMIX.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const MIN_RECIPES_NEEDED = 3;
		const MIN_DISTINCT_OUTPUTS_NEEDED = 3;
		const didCraftCharacters = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.CRAFT_CHARACTERS);
		if (!didCraftCharacters)
			return toFailure(`You have not crafted any characters this week. You must craft at least one to complete the "${quest.name}" quest.`);

		const craftLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.CRAFT_CHARACTERS
		});

		const inputCharacterToOutputCharacters = new Map<string, Set<string>>();
		const inputCharacterToRecipes = new Map<string, Set<RecipeID>>();

		let maxRecipesForInput = 0;
		let maxDistinctOutputsForInput = 0;
		for (const craftLog of craftLogs) {
			if (craftLog.involvedRecipe === null)
				continue;

			const inputCharacters = craftLog.involvedRecipe.inputCharacters;
			const outputCharacters = craftLog.involvedRecipe.outputCharacters;

			if (!inputCharacterToOutputCharacters.has(inputCharacters))
				inputCharacterToOutputCharacters.set(inputCharacters, new Set());

			if (!inputCharacterToRecipes.has(inputCharacters))
				inputCharacterToRecipes.set(inputCharacters, new Set());

			const outputCharactersSet = inputCharacterToOutputCharacters.get(inputCharacters)!;
			const recipeIDsSet = inputCharacterToRecipes.get(inputCharacters)!;
			
			outputCharactersSet.add(outputCharacters);
			recipeIDsSet.add(craftLog.involvedRecipe.id);

			if (
				outputCharactersSet.size >= maxDistinctOutputsForInput && 
				recipeIDsSet.size >= maxRecipesForInput
			) {
				maxDistinctOutputsForInput = outputCharactersSet.size;
				maxRecipesForInput = recipeIDsSet.size;
			}
		}

		for (const [inputChars, outputsSet] of inputCharacterToOutputCharacters.entries()) {
			const recipesSet = inputCharacterToRecipes.get(inputChars)!;
			if (recipesSet.size >= MIN_RECIPES_NEEDED && outputsSet.size >= MIN_DISTINCT_OUTPUTS_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		if (maxRecipesForInput === 0)
			return toFailure(`You have not crafted any characters this week. You must use the same input characters in at least ${MIN_RECIPES_NEEDED} different recipes and get ${MIN_DISTINCT_OUTPUTS_NEEDED} distinct outputs to complete the "${quest.name}" quest.`);

		if (maxRecipesForInput < MIN_RECIPES_NEEDED)
			return toFailure(`You have only used the same input characters in ${maxRecipesForInput} different recipe(s) this week. You need to use the same input characters in at least ${MIN_RECIPES_NEEDED} different recipes to complete the "${quest.name}" quest.`);

		return toFailure(`You have only gotten ${maxDistinctOutputsForInput} different character(s) from the same input characters this week. You need to use the same input characters in three different recipes and get ${MIN_DISTINCT_OUTPUTS_NEEDED} distinct characters to complete the "${quest.name}" quest.`);
	},

	[Quests.CHAOTIC_TRADE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, tradeService}: NamesmithServices
	) => {
		const MAX_CHARACTERS_GIVEN = 1;
		const MIN_CHARACTERS_RECEIVED = 20;
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsThisWeekInvolvingPlayer(player);

		if (acceptTradeLogs.length <= 0)
			return toFailure(`You have not been involved in any accepted trades this week. You must accept a trade or have a trade of yours accepted before you can complete the "${quest.name}" quest.`);

		let minCharactersGiven = Infinity;
		let maxCharactersReceived = 0;
		for (const acceptTradeLog of acceptTradeLogs) {
			if (acceptTradeLog.involvedTrade === null)
				continue;

			const givenCharacters = tradeService.getCharactersPlayerIsGiving(acceptTradeLog.involvedTrade, player);
			const receivedCharacters = tradeService.getCharactersPlayerIsGetting(acceptTradeLog.involvedTrade, player);

			const numGivenCharacters = getNumCharacters(givenCharacters);
			const numReceivedCharacters = getNumCharacters(receivedCharacters);

			if (
				numGivenCharacters <= MAX_CHARACTERS_GIVEN && 
				numReceivedCharacters >= MIN_CHARACTERS_RECEIVED
			) {
				return PLAYER_MET_CRITERIA_RESULT;
			}

			if (numGivenCharacters < minCharactersGiven)
				minCharactersGiven = numGivenCharacters;

			if (numReceivedCharacters > maxCharactersReceived)
				maxCharactersReceived = numReceivedCharacters;
		}

		if (minCharactersGiven > MAX_CHARACTERS_GIVEN)
			return toFailure(`You've only had trades accepted where you gave away ${minCharactersGiven} characters at the minimum. You must give away only ${MAX_CHARACTERS_GIVEN} character(s) in a trade to complete the "${quest.name}" quest.`);

		return toFailure(`You've only had trades accepted where you received ${maxCharactersReceived} characters at most when giving away ${MAX_CHARACTERS_GIVEN} character(s). You must receive at least ${MIN_CHARACTERS_RECEIVED} character(s) in a trade to complete the "${quest.name}" quest.`);
	},

	[Quests.WIDE_DIPLOMAT.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_DIFFERENT_PLAYERS_NEEDED = 5;
		const acceptTradeLogs = activityLogService.getAcceptTradeLogsThisWeekWithRecipient(player);

		if (acceptTradeLogs.length <= 0) {
			const didCreateTrades = activityLogService.didPlayerDoLogOfTypeThisWeek(player.id, ActivityTypes.INITIATE_TRADE);

			if (!didCreateTrades)
				return toFailure(`You have not created any trades this week. You must initiate one before you can complete the "${quest.name}" quest.`);

			return toFailure(`You have not had any of your trades accepted this week. You must have at least one accepted before you can complete the "${quest.name}" quest.`);
		}

		const uniqueAcceptingPlayers = new Set<PlayerID>();
		for (const acceptTradeLog of acceptTradeLogs) {
			if (!acceptTradeLog.player) continue;
			uniqueAcceptingPlayers.add(acceptTradeLog.player.id);
		}

		if (uniqueAcceptingPlayers.size >= NUM_DIFFERENT_PLAYERS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		const numHas = uniqueAcceptingPlayers.size;
		const numNeeded = NUM_DIFFERENT_PLAYERS_NEEDED;
		return toFailure(
			`You have only had ${numHas} distinct player(s) accept your trades this week. You need at least ${numNeeded} different players to accept your trades to complete the "${quest.name}" quest.`
		);
	},

	[Quests.CHAIN_FIVE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TRADES_NEEDED = 5;
		const acceptTradeLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.ACCEPT_TRADE
		});

		if (acceptTradeLogs.length <= 0)
			return toFailure(`You have not accepted any trades this week. You must accept trades before you can complete the "${quest.name}" quest.`);

		const uniqueTradeIDs = new Set<TradeID>();
		const uniqueInitiatingPlayers = new Set<PlayerID>();

		for (const acceptTradeLog of acceptTradeLogs) {
			if (acceptTradeLog.involvedTrade === null)
				continue;

			uniqueTradeIDs.add(acceptTradeLog.involvedTrade.id);
			
			if (acceptTradeLog.involvedPlayer) {
				uniqueInitiatingPlayers.add(acceptTradeLog.involvedPlayer.id);
			}
		}

		const numDistinctTrades = uniqueTradeIDs.size;
		const numDifferentPlayers = uniqueInitiatingPlayers.size;

		if (numDistinctTrades < NUM_TRADES_NEEDED)
			return toFailure(`You have only accepted ${numDistinctTrades} distinct trade(s) this week. You need to accept at least ${NUM_TRADES_NEEDED} distinct trades to complete the "${quest.name}" quest.`);

		if (numDifferentPlayers < NUM_TRADES_NEEDED)
			return toFailure(`You have only accepted trades from ${numDifferentPlayers} different player(s) this week. You need to accept trades from at least ${NUM_TRADES_NEEDED} different players to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.PITY_PASS.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, tradeService}: NamesmithServices
	) => {
		const NUM_MORE_CHARACTERS_THAN_GIVING = 20;
		const declineTradeLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.DECLINE_TRADE,
		});

		if (declineTradeLogs.length <= 0)
			return toFailure(`You have not declined any trades this week. You must decline a trade before you can complete the "${quest.name}" quest.`);

		let maxNumMoreCharactersThanGiving = Number.NEGATIVE_INFINITY;

		for (const declineTradeLog of declineTradeLogs) {
			if (declineTradeLog.involvedTrade === null)
				continue;

			const charactersGiven = tradeService.getCharactersPlayerIsGiving(declineTradeLog.involvedTrade, player);
			const charactersReceived = tradeService.getCharactersPlayerIsGetting(declineTradeLog.involvedTrade, player);

			const numCharactersGiven = getNumCharacters(charactersGiven);
			const numCharactersReceived = getNumCharacters(charactersReceived);

			const numMoreCharactersThanGiving = numCharactersReceived - numCharactersGiven;

			if (numMoreCharactersThanGiving >= NUM_MORE_CHARACTERS_THAN_GIVING)
				return PLAYER_MET_CRITERIA_RESULT;

			if (numMoreCharactersThanGiving > maxNumMoreCharactersThanGiving)
				maxNumMoreCharactersThanGiving = numMoreCharactersThanGiving;
		}

		if (maxNumMoreCharactersThanGiving > 0) {
			return toFailure(`You have only declined a trade where you would have received ${maxNumMoreCharactersThanGiving} more characters than you gave. You must decline a trade where you would receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
		else if (maxNumMoreCharactersThanGiving === 0) {
			return toFailure(`You have only declined trades where you would receive the same number of characters as you gave. You must decline a trade where you would receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
		else {
			const minNumLessCharactersThanGiving = maxNumMoreCharactersThanGiving * -1;
			return toFailure(`You have only declined trades where you would receive ${minNumLessCharactersThanGiving} less characters than you gave. You must decline a trade where you would receive ${NUM_MORE_CHARACTERS_THAN_GIVING} more characters than you give to complete the "${quest.name}" quest.`);
		}
	},

	[Quests.QUEST_HOARD.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_QUESTS_NEEDED = 20;
		const didCompleteQuests = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.COMPLETE_QUEST);
		if (!didCompleteQuests)
			return toFailure(`You have not completed any quests this week. You must complete at least one quest before you can complete the "${quest.name}" quest.`);

		const numQuestsCompleted = activityLogService.getNumLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST,
		});

		if (numQuestsCompleted < NUM_QUESTS_NEEDED)
			return toFailure(`You have only completed ${numQuestsCompleted} different quest(s) this week. You need to complete at least ${NUM_QUESTS_NEEDED} quests to complete the "${quest.name}" quest.`);
		
		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.QUAD_COMBO.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_QUESTS_NEEDED = 4;
		const TIME_SPAN = { minutes: 1 };
		const didCompleteQuests = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.COMPLETE_QUEST);
		if (!didCompleteQuests)
			return toFailure(`You have not completed any quests this week. You must complete at least one quest before you can complete the "${quest.name}" quest.`);

		const numQuestsCompleted = activityLogService.getNumLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST,
		});
		if (numQuestsCompleted < NUM_QUESTS_NEEDED)
			return toFailure(`You have completed ${numQuestsCompleted} quest(s) this week, but you need to complete at least ${NUM_QUESTS_NEEDED} to complete the "${quest.name}" quest.`);

		const maxQuestsInTimeSpan = activityLogService.getMaxLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST,
			inTimeSpan: TIME_SPAN,
		});

		if (maxQuestsInTimeSpan < NUM_QUESTS_NEEDED)
			return toFailure(`You have completed at most ${maxQuestsInTimeSpan} quest(s) within ${toDurationText(TIME_SPAN)} this week, but you need to complete at least ${NUM_QUESTS_NEEDED} in ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.NAME_MATCH.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const didCompleteQuests = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.COMPLETE_QUEST);
		if (!didCompleteQuests)
			return toFailure(`You have not completed any quests this week. You must complete at least one quest before you can complete the "${quest.name}" quest.`);

		const questLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST
		});
		
		for (const questLog of questLogs) {
			if (questLog.involvedQuest === null)
				continue;

			let nameDuring = questLog.currentName;
			if (questLog.nameChangedFrom !== null)
				nameDuring = questLog.nameChangedFrom;

			const completedQuestName = questLog.involvedQuest.name;
			if (nameDuring.toLowerCase().includes(completedQuestName.toLowerCase()))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not completed any quest while your name contained that quest's name. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.QUEST_BOUNTY.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_CHARACTERS_NEEDED = 20;
		const questLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST,
		});

		if (questLogs.length <= 0)
			return toFailure(`You have not completed any quests this week. You must complete quests to earn character rewards to complete the "${quest.name}" quest.`);

		let totalCharactersGained = 0;
		for (const questLog of questLogs) {
			if (questLog.charactersGained === null)
				continue;

			totalCharactersGained += getNumCharacters(questLog.charactersGained);
		}

		if (totalCharactersGained >= NUM_CHARACTERS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You have only gained ${totalCharactersGained} character(s) from quest rewards this week. You need to gain at least ${NUM_CHARACTERS_NEEDED} characters from quest rewards to complete the "${quest.name}" quest.`);
	},

	[Quests.QUEST_RICHES.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_TOKENS_NEEDED = 1500;
		const questLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.COMPLETE_QUEST,
		});

		if (questLogs.length <= 0)
			return toFailure(`You have not completed any quests this week. You must complete quests to earn token rewards to complete the "${quest.name}" quest.`);

		let totalTokensGained = 0;
		for (const questLog of questLogs) {
			if (questLog.tokensDifference > 0)
				totalTokensGained += questLog.tokensDifference;
		}

		if (totalTokensGained >= NUM_TOKENS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You have only gained ${totalTokensGained} token(s) from quest rewards this week. You need to gain at least ${NUM_TOKENS_NEEDED} tokens from quest rewards to complete the "${quest.name}" quest.`);
	},

	[Quests.SYNCHRONIZED.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_OTHER_PLAYERS_NEEDED = 5;
		const TIME_SPAN = { minutes: 1}
		const didCompleteQuest = activityLogService.didPlayerDoLogOfTypeThisWeek(player, ActivityTypes.COMPLETE_QUEST);
		if (!didCompleteQuest)
			return toFailure(`You have not completed any quests this week. You must complete a quest at the same time as ${NUM_OTHER_PLAYERS_NEEDED} other players to complete the "${quest.name}" quest.`);

		const maxPlayers = activityLogService.getMaxPlayersDoingLogsThisWeek({
			ofType: ActivityTypes.COMPLETE_QUEST,
			inTimeSpan: TIME_SPAN,
			withPlayer: player
		});

		if (maxPlayers.length === 1)
			return toFailure(`You have not completed quests at the same time as any other players this week. You must complete a quest at the same moment as ${NUM_OTHER_PLAYERS_NEEDED} other players within ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		if (maxPlayers.length < NUM_OTHER_PLAYERS_NEEDED + 1)
			return toFailure(`You have only completed quests at the same time as ${maxPlayers.length - 1} other player(s) this week. You must complete a quest at the same moment as ${NUM_OTHER_PLAYERS_NEEDED} other players within ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.NO_PERK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const TIME_SPAN = { days: 6 };
		const maxTimeNotPickingPerk = activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.PICK_PERK,
		});

		if (maxTimeNotPickingPerk < getMillisecondsOfDuration(TIME_SPAN))
			return toFailure(`You have only avoided picking perks for ${toDurationTextFromTime(maxTimeNotPickingPerk)} at most this week. You must avoid picking any perk for ${toDurationText(TIME_SPAN)} to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

	[Quests.PERK_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const pickPerkLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.PICK_PERK,
		});

		if (pickPerkLogs.length <= 0)
			return toFailure(`You have not picked any perks this week. You must pick a perk while your current name contains that perk's exact name to complete the "${quest.name}" quest.`);

		for (const pickPerkLog of pickPerkLogs) {
			if (pickPerkLog.involvedPerk === null)
				continue;

			let name = pickPerkLog.currentName;
			if (pickPerkLog.nameChangedFrom !== null)
				name = pickPerkLog.nameChangedFrom;

			const pickedPerkName = pickPerkLog.involvedPerk.name;

			if (name.includes(pickedPerkName))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not picked any perk while your current name contained that perk's exact name. You must do so to complete the "${quest.name}" quest.`);
	},

	[Quests.UNIQUE_PERK.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService, playerService, perkService}: NamesmithServices
	) => {
		const pickPerkLogs = activityLogService.getLogsThisWeek({
			byPlayer: player,
			ofType: ActivityTypes.PICK_PERK,
		});

		if (pickPerkLogs.length <= 0)
			return toFailure(`You have not picked any perks this week. You must pick a perk that no other player has selected to complete the "${quest.name}" quest.`);

		const allPlayers = playerService.getPlayers();

		for (const pickPerkLog of pickPerkLogs) {
			if (pickPerkLog.involvedPerk === null)
				continue;

			const pickedPerkID = pickPerkLog.involvedPerk.id;

			// Check if any other player has this perk
			let isUnique = true;
			for (const otherPlayer of allPlayers) {
				if (otherPlayer.id === player.id)
					continue;

				const otherPlayerPerks = perkService.getPerksOfPlayer(otherPlayer);
				if (otherPlayerPerks.some(perk => perk.id === pickedPerkID)) {
					isUnique = false;
					break;
				}
			}

			if (isUnique)
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`All the perks you picked this week are also selected by other players. You must pick a perk that no other player on your server has selected to complete the "${quest.name}" quest.`);
	},

	[Quests.FAST_FORTUNE.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const TOKENS_NEEDED = 2000;
		const logs = activityLogService.getLogsThisWeek({byPlayer: player});

		let totalTokensGained = 0;
		for (const log of logs) {
			if (log.tokensDifference > 0)
				totalTokensGained += log.tokensDifference;
		}

		if (totalTokensGained >= TOKENS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You have only gained ${totalTokensGained} token(s) this week. You need to gain at least ${TOKENS_NEEDED} tokens to complete the "${quest.name}" quest.`);
	},

	[Quests.COMPLETE_SET.id]: (
		{quest, player}: MeetsCriteriaParameters,
	) => {
		const NUM_DISTINCT_CHARACTERS_NEEDED = 100;
		const numDistinctCharacters = getNumDistinctCharacters(player.inventory);

		if (numDistinctCharacters >= NUM_DISTINCT_CHARACTERS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You only have ${numDistinctCharacters} distinct characters in your inventory. You need ${NUM_DISTINCT_CHARACTERS_NEEDED} distinct characters to complete the "${quest.name}" quest.`);
	},

	// Silent Server (108)
	[Quests.SILENT_SERVER.id]: (
		{quest}: MeetsCriteriaParameters,
		{activityLogService}: NamesmithServices
	) => {
		const NUM_HOURS_OF_SILENCE_NEEDED = 8;
		const allNameIntervals = activityLogService.getNameIntervalsThisWeek();

		const changeTimestamps: number[] = [];
		for (const interval of allNameIntervals) {
			changeTimestamps.push(interval.startTime.getTime());
		}

		changeTimestamps.sort((a, b) => a - b);

		if (changeTimestamps.length === 0)
			return PLAYER_MET_CRITERIA_RESULT;

		let maxGap = 0;
		for (let i = 1; i < changeTimestamps.length; i++) {
			const gap = changeTimestamps[i] - changeTimestamps[i - 1];
			if (getHoursInTime(gap) >= NUM_HOURS_OF_SILENCE_NEEDED)
				return PLAYER_MET_CRITERIA_RESULT;

			maxGap = Math.max(maxGap, gap);
		}

		const now = new Date().getTime();
		const gapFromLast = now - changeTimestamps[changeTimestamps.length - 1];
		if (getHoursInTime(gapFromLast) >= NUM_HOURS_OF_SILENCE_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		maxGap = Math.max(maxGap, gapFromLast);

		return toFailure(
			`Players have only gone ${toDurationTextFromTime(maxGap)} at most without anyone changing their name this week. Everyone must ensure no player changes their name for a continuous ${NUM_HOURS_OF_SILENCE_NEEDED}-hour period to complete the "${quest.name}" quest.`
		);
	},
} as const;

/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerResolvable - The player completing the quest.
 * @param parameters.questResolvable - The quest being completed.
 * @param parameters.checkIfMetCriteria - An optional boolean indicating whether to check if the player has met the criteria for the quest. Defaults to true.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{playerResolvable, questResolvable, checkIfMetCriteria}: {
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
		checkIfMetCriteria?: boolean
	}
) {
	if (checkIfMetCriteria === undefined) checkIfMetCriteria = true;

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

	if (
		questService.isHiddenQuest(questResolvable) &&
		!questService.isHiddenQuestUnlockedForPlayer(playerResolvable)
	)
		return result.failure.hiddenQuestNotUnlocked();

	const quest = questService.resolveQuest(questResolvable);
	const player = playerService.resolvePlayer(playerResolvable);

	if (checkIfMetCriteria) {
		if (quest.id in questIDToMeetsCriteriaCheck === false) {
			if (!quest.name.includes(FREEBIE_QUEST_NAME))
				return result.failure.questCriteriaNotDefined({questName: quest.name});
		}
		else {
			const questID = quest.id as keyof typeof questIDToMeetsCriteriaCheck;
			const getMeetsCriteriaResult = questIDToMeetsCriteriaCheck[questID];
			const meetsCriteriaResult = getMeetsCriteriaResult(
				{quest, player}, services
			);

			if (meetsCriteriaResult !== PLAYER_MET_CRITERIA_RESULT)
				return meetsCriteriaResult;
		}
	}

	const nameBefore = player.currentName;

	const rewards = questService.givePlayerRewards(playerResolvable, questResolvable);

	let tokensRewarded = 0, charactersRewarded = '';
	for (const reward of rewards) {
		switch (reward.type) {
			case RewardTypes.TOKENS:
				tokensRewarded = reward.numTokens;
				break;
		
			case RewardTypes.CHARACTERS:
				charactersRewarded = reward.characters;
				break;
		
			default:
				break;
		}
	}

	activityLogService.logCompleteQuest({
		playerCompletingQuest: playerResolvable,
		questCompleted: questResolvable,
		tokensRewarded: tokensRewarded,
		charactersRewarded: charactersRewarded,
		nameBefore,
	});

	return result.success({
		player: playerService.resolvePlayer(playerResolvable),
		quest: questService.resolveQuest(questResolvable),
	});
}