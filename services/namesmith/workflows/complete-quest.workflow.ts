import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { QuestResolvable } from "../types/quest.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{

	}>(),
	nonPlayer: null,
	questDoesNotExist: null,
	playerAlreadyCompletedQuest: null,
});

/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.player - The player completing the quest.
 * @param parameters.quest - The quest being completed.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{player, quest}: {
		player: PlayerResolvable,
		quest: QuestResolvable,
	}
) {
	const {playerService, questService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayer();
	}

	if (!questService.isQuest(quest)) {
		return result.failure.questDoesNotExist();
	}

	if (activityLogService.hasPlayerCompletedQuest(player, quest)) {
		return result.failure.playerAlreadyCompletedQuest();
	}

	activityLogService.logCompleteQuest({
		playerCompletingQuest: player,
		questCompleted: quest,
	});

	return result.success({});
}