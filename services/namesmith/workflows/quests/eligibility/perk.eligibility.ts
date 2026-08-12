import { getMillisecondsOfDuration, toDurationText, toDurationTextFromTime } from "../../../../../utilities/date-time-utils";
import { Quests } from "../../../constants/quest.constants";
import { ActivityTypes } from "../../../types/activity-log.types";
import { NamesmithServices } from "../../../types/namesmith.types";
import { MeetsCriteriaParameters, PLAYER_MET_CRITERIA_RESULT, toFailure } from "./quest-eligibility";

/**
 * Eligibility checks for quests about picking perks.
 */
export const perkEligibilityChecks = {

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
} as const;
