import { getHoursInTime, toDurationTextFromTime } from "../../../../../utilities/date-time-utils";
import { getNumDistinctCharacters, hasLetter, hasNumber, hasSymbol } from "../../../../../utilities/string-checks-utils";
import { toListOfWords } from "../../../../../utilities/string-manipulation-utils";
import { Quests } from "../../../constants/quests.constants";
import { NamesmithServices } from "../../../types/namesmith.types";
import { toDisplayedName } from "../../../utilities/player-message.utility";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about the contents and history of a player's name.
 */
export const namingEligibilityChecks = {

	[Quests.DIVERSE_NAME.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ publishedNameService }: NamesmithServices
	) => {
		const publishedNames = publishedNameService.getPublishedNamesOfPlayer(player);

		if (publishedNames.length === 0) {
			return toFailure(`You have not published your name yet. Your name must be published before you can complete the ${quest.name} quest.`)
		}

		const hasDiverseName = publishedNames.some(publishedName =>
			hasLetter(publishedName.name) && hasSymbol(publishedName.name) && hasNumber(publishedName.name)
		);

		if (hasDiverseName)
			return PLAYER_MET_CRITERIA_RESULT;

		const listOfPublishedNames = toListOfWords(publishedNames.map(publishedName => toDisplayedName(publishedName.name)));
		return toFailure(`None of your published names (${listOfPublishedNames}) have at least one letter, one symbol, and one number all in the same name. You must publish a name like that to complete the ${quest.name} quest.`)
	},

	[Quests.TWINSIES.id]: (
		{quest, player}: MeetsCriteriaParameters,
		{ publishedNameService }: NamesmithServices
	) => {
		const playerPublishedNames = publishedNameService.getPublishedNamesOfPlayer(player);
		if (playerPublishedNames.length === 0)
			return toFailure(`You have not published your name yet. Your name must be published before you can complete the ${quest.name} quest.`)

		const allPublishedNames = publishedNameService.getAllPublishedNameStrings();

		const hasMatchingPublishedName = playerPublishedNames.some(publishedName =>
			allPublishedNames.filter(name => name === publishedName.name).length >= 2
		);

		if (!hasMatchingPublishedName)
			return toFailure(`Nobody has the same name as you. You must have at least one player that shares the same published name as you to complete the ${quest.name} quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

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

		const hasRepeatedNameButNotRearrangedRepeated = changeNameLogs.some(changeNameLog => {
			const newName = changeNameLog.currentName;

			if (newName === null || newName.length === 0 || newName.length % 2 !== 0)
				return false;

			const halfLength = newName.length / 2;
			return newName.slice(0, halfLength) === newName.slice(halfLength);
		});

		if (hasRepeatedNameButNotRearrangedRepeated)
			return toFailure(`Your name having repeated characters isn't enough. You must rearrange your name so it becomes two identical copies of your previous name to complete the ${quest.name} quest. For example, if your current name is "Pom", rearrange it directly to "PomPom".`);

		return toFailure(`You have not changed your name into a repeated version of itself. You must do that before you can complete the ${quest.name} quest.`);
	},

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
		{playerService, publishedNameService}: NamesmithServices
	) => {
		const numTokensHas = playerService.getTokens(player);
		const publishedNames = publishedNameService.getPublishedNamesOfPlayer(player);

		if (publishedNames.length === 0)
			return toFailure(`You do not have a published name. You must have publish a name to complete the "${quest.name}" quest.`);

		const tokenCountText = String(numTokensHas).toLowerCase();
		const publishedNameHasTokens = publishedNames.some(publishedName =>
			publishedName.name.toLowerCase().includes(tokenCountText)
		);
		if (!publishedNameHasTokens)
			return toFailure(`None of your published names contain the number of tokens you have. One of your published names should have contained "${numTokensHas}" to complete the "${quest.name}" quest.`);

		return PLAYER_MET_CRITERIA_RESULT;
	},

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
