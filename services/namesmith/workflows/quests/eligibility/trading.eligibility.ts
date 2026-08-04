import { getNumCharacters } from "../../../../../utilities/string-checks-utils";
import { Quests } from "../../../constants/quests.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { PlayerID } from "../../../types/player.types";
import { TradeID } from "../../../types/trade.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about trading characters with other players.
 */
export const tradingEligibilityChecks = {

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
} as const;
