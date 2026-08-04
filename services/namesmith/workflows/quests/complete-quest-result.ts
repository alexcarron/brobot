import { Player } from "../../types/player.types";
import { Quest } from "../../types/quest.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";

/**
 * The result of attempting to complete a quest for a player.
 */
export const completeQuestResult = getWorkflowResultCreator({
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
