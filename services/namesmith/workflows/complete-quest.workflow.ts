import { getNamesmithServices } from "../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../types/player.types";
import { Quest, QuestResolvable } from "../types/quest.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		quest: Quest,
	}>(),
	notAPlayer: null,
	questDoesNotExist: null,
	alreadyCompletedQuest: null,
	notEligibleToCompleteQuest: provides<{questName: string}>(),
});

/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerResolvable - The player completing the quest.
 * @param parameters.questResolvable - The quest being completed.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{playerResolvable, questResolvable}: {
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
	}
) {
	const {playerService, questService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer();
	}

	if (!questService.isQuest(questResolvable)) {
		return result.failure.questDoesNotExist();
	}

	if (activityLogService.hasPlayerAlreadyCompletedQuest(playerResolvable, questResolvable)) {
		return result.failure.alreadyCompletedQuest();
	}

	if (!questService.isPlayerEligibleToComplete(playerResolvable, questResolvable)) {
		const quest = questService.resolveQuest(questResolvable);
		return result.failure.notEligibleToCompleteQuest({
			questName: quest.name
		});
	}

	// Give the player the rewards for the request
	questService.givePlayerRewards(playerResolvable, questResolvable);

	activityLogService.logCompleteQuest({
		playerCompletingQuest: playerResolvable,
		questCompleted: questResolvable,
	});

	return result.success({
		player: playerService.resolvePlayer(playerResolvable),
		quest: questService.resolveQuest(questResolvable),
	});
}