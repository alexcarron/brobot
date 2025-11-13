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

export function completeQuest(
	{player, quest}: {
		player: PlayerResolvable,
		quest: QuestResolvable,
	}
) {
	const {playerService, questService} = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayer();
	}

	if (!questService.isQuest(quest)) {
		return result.failure.questDoesNotExist();
	}
}