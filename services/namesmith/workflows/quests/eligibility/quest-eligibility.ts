import { Player } from "../../../types/player.types";
import { Quest } from "../../../types/quest.types";
import { completeQuestResult } from "../complete-quest-result";

/**
 * The value an eligibility check returns when the player has met the quest's criteria.
 */
export const PLAYER_MET_CRITERIA_RESULT = 'questSuccess' as const;

/**
 * The parameters every quest eligibility check receives.
 */
export type MeetsCriteriaParameters = {
	quest: Quest,
	player: Player,
}

/**
 * Builds the failure an eligibility check returns when the player has not met the quest's criteria.
 * @param userFeedbackMessage - The message explaining to the player what they still need to do.
 * @returns A failure result containing the user feedback message.
 */
export const toFailure = (userFeedbackMessage: string) =>
	completeQuestResult.failure.questCriteriaNotMet({ userFeedback: userFeedbackMessage });
