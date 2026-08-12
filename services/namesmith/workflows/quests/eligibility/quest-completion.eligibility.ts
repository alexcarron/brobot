import { getMinutesDurationFromTime, toDurationText, toDurationTextFromSeconds } from "../../../../../utilities/date-time-utils";
import { getNumCharacters } from "../../../../../utilities/string-checks-utils";
import { toListOfWords } from "../../../../../utilities/string-manipulation-utils";
import { Quests } from "../../../constants/quest.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about completing other quests.
 */
export const questCompletionEligibilityChecks = {

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
} as const;
