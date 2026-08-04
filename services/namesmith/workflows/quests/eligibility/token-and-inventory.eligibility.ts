import { sortByDescendingProperty } from "../../../../../utilities/data-structure-utils";
import { getNumDistinctCharacters } from "../../../../../utilities/string-checks-utils";
import { Quests } from "../../../constants/quests.constants";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about how many tokens and characters a player has accumulated.
 */
export const tokenAndInventoryEligibilityChecks = {

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

	[Quests.COMPLETE_SET.id]: (
		{quest, player}: MeetsCriteriaParameters,
	) => {
		const NUM_DISTINCT_CHARACTERS_NEEDED = 100;
		const numDistinctCharacters = getNumDistinctCharacters(player.inventory);

		if (numDistinctCharacters >= NUM_DISTINCT_CHARACTERS_NEEDED)
			return PLAYER_MET_CRITERIA_RESULT;

		return toFailure(`You only have ${numDistinctCharacters} distinct characters in your inventory. You need ${NUM_DISTINCT_CHARACTERS_NEEDED} distinct characters to complete the "${quest.name}" quest.`);
	},
} as const;
