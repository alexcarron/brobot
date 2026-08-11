import { getNamesmithServices } from "../../services/get-namesmith-services";
import { PlayerResolvable } from "../../types/player.types";
import { QuestResolvable, RewardTypes } from "../../types/quest.types";
import { FREEBIE_QUEST_NAME } from '../../constants/test.constants';
import { completeQuestResult } from "./complete-quest-result";
import { PLAYER_MET_CRITERIA_RESULT } from "./eligibility/quest-eligibility";
import { craftingEligibilityChecks } from "./eligibility/crafting.eligibility";
import { miningEligibilityChecks } from "./eligibility/mining.eligibility";
import { mysteryBoxPurchasingEligibilityChecks } from "./eligibility/mystery-box-purchasing.eligibility";
import { mysteryBoxRewardsEligibilityChecks } from "./eligibility/mystery-box-rewards.eligibility";
import { namingEligibilityChecks } from "./eligibility/naming.eligibility";
import { perkEligibilityChecks } from "./eligibility/perk.eligibility";
import { questCompletionEligibilityChecks } from "./eligibility/quest-completion.eligibility";
import { refillEligibilityChecks } from "./eligibility/refill.eligibility";
import { tokenAndInventoryEligibilityChecks } from "./eligibility/token-and-inventory.eligibility";
import { tradingEligibilityChecks } from "./eligibility/trading.eligibility";
import { telemetry } from "../../telemetry/telemetry";
import { EventType } from "../../telemetry/telemetry-event.types";

const questIDToMeetsCriteriaCheck = {
	...miningEligibilityChecks,
	...refillEligibilityChecks,
	...mysteryBoxPurchasingEligibilityChecks,
	...mysteryBoxRewardsEligibilityChecks,
	...craftingEligibilityChecks,
	...tradingEligibilityChecks,
	...namingEligibilityChecks,
	...questCompletionEligibilityChecks,
	...tokenAndInventoryEligibilityChecks,
	...perkEligibilityChecks,
} as const;

/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerResolvable - The player completing the quest.
 * @param parameters.questResolvable - The quest being completed.
 * @param parameters.checkIfMetCriteria - An optional boolean indicating whether to check if the player has met the criteria for the quest. Defaults to true.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{playerResolvable, questResolvable, checkIfMetCriteria}: {
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
		checkIfMetCriteria?: boolean
	}
) {
	if (checkIfMetCriteria === undefined) checkIfMetCriteria = true;

	const services = getNamesmithServices();
	const {playerService, questService, activityLogService} = services;

	if (!playerService.isPlayer(playerResolvable)) {
		return completeQuestResult.failure.notAPlayer();
	}

	if (!questService.isQuest(questResolvable)) {
		return completeQuestResult.failure.questDoesNotExist();
	}

	if (activityLogService.hasPlayerAlreadyCompletedQuest(playerResolvable, questResolvable)) {
		return completeQuestResult.failure.alreadyCompletedQuest();
	}

	if (
		questService.isHiddenQuest(questResolvable) &&
		!questService.isHiddenQuestUnlockedForPlayer(playerResolvable)
	)
		return completeQuestResult.failure.hiddenQuestNotUnlocked();

	const quest = questService.resolveQuest(questResolvable);
	const player = playerService.resolvePlayer(playerResolvable);

	if (checkIfMetCriteria) {
		if (quest.id in questIDToMeetsCriteriaCheck === false) {
			if (!quest.name.includes(FREEBIE_QUEST_NAME))
				return completeQuestResult.failure.questCriteriaNotDefined({questName: quest.name});
		}
		else {
			const questID = quest.id as keyof typeof questIDToMeetsCriteriaCheck;
			const getMeetsCriteriaResult = questIDToMeetsCriteriaCheck[questID];
			const meetsCriteriaResult = getMeetsCriteriaResult(
				{quest, player}, services
			);

			if (meetsCriteriaResult !== PLAYER_MET_CRITERIA_RESULT)
				return meetsCriteriaResult;
		}
	}

	const nameBefore = player.currentName;

	const rewards = questService.givePlayerRewards(playerResolvable, questResolvable);

	let tokensRewarded = 0, charactersRewarded = '';
	for (const reward of rewards) {
		switch (reward.type) {
			case RewardTypes.TOKENS:
				tokensRewarded = reward.numTokens;
				break;

			case RewardTypes.CHARACTERS:
				charactersRewarded = reward.characters;
				break;

			default:
				break;
		}
	}

	activityLogService.logCompleteQuest({
		playerCompletingQuest: playerResolvable,
		questCompleted: questResolvable,
		tokensRewarded: tokensRewarded,
		charactersRewarded: charactersRewarded,
		nameBefore,
	});

	telemetry.track({
		eventType: EventType.QUEST_COMPLETED,
		playerID: playerService.resolveID(playerResolvable),
		questID: quest.id,
	});

	return completeQuestResult.success({
		player: playerService.resolvePlayer(playerResolvable),
		quest: questService.resolveQuest(questResolvable),
	});
}
