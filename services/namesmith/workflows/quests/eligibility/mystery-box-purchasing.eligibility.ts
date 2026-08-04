import { Duration, getSecondsInTime, toDurationText, toDurationTextFromSeconds } from "../../../../../utilities/date-time-utils";
import { toListOfWords } from "../../../../../utilities/string-manipulation-utils";
import { Quests } from "../../../constants/quests.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { MysteryBoxID, MysteryBoxName } from "../../../types/mystery-box.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about which mystery boxes a player buys and how they buy them.
 */
export const mysteryBoxPurchasingEligibilityChecks = {

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
} as const;
