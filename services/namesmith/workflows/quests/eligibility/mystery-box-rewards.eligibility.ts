import { getCharacters, getNumCharacters } from "../../../../../utilities/string-checks-utils";
import { Quests } from "../../../constants/quests.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about the characters a player receives from mystery boxes.
 */
export const mysteryBoxRewardsEligibilityChecks = {

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

			if (recievedCharacters.includes(rightmostCharacter))
				return PLAYER_MET_CRITERIA_RESULT;
		}

		return toFailure(`You have not received the rightmost character of your current name from a mystery box this week. You must receive that character from one to complete the "${quest.name}" quest.`);
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
} as const;
