import { ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Quest } from "../../types/quest.types";
import { completeQuest } from "../../workflows/quests/complete-quest.workflow";
import { toRewardBulletPoint } from "./quest-message";
import { revealHiddenQuestToPlayer } from "../../utilities/hidden-quest.utility";
import { ids } from "../../../../bot-config/discord-ids";

/**
 * Creates a message with details about the given quest and a button to complete it.
 * @param quest - The quest to create a message for.
 * @returns The create message
 */
export function toQuestButton(quest: Quest) {
	const { questService } = getNamesmithServices();
	const rewards = questService.getRewards(quest);

	return new DiscordButton({
		promptText: joinLines(
			`_ _`,
			`## ${quest.name}`,
			`${quest.description}`,
			...rewards.map(toRewardBulletPoint),
		),
		label: 'Complete Quest',
		id: `complete-quest-button-${quest.id}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			const result = completeQuest({
				playerResolvable: buttonInteraction.user.id,
				questResolvable: quest,
			});

			if (result.isNotAPlayer())
				return await replyToInteraction(buttonInteraction,
					'You are not a player, so you cannot complete a quest.'
				);
			else if (result.isQuestDoesNotExist())
				return await replyToInteraction(buttonInteraction,
					`This quest no longer exists, so you cannot complete it.`
				);
			else if (result.isAlreadyCompletedQuest())
				return await replyToInteraction(buttonInteraction,
					`You already completed this quest! You cannot claim the rewards again.`
				);
			else if (result.isHiddenQuestNotUnlocked()) {
				return await replyToInteraction(buttonInteraction,
					`You have not yet unlocked the hidden quests yet. Complete all visible daily quests to unlock it!`
				);
			}
			else if (result.isQuestCriteriaNotDefined()) {
				const { questName } = result;
				return await replyToInteraction(buttonInteraction,
					`The criteria for completing the ${questName} quest has not been defined yet! Alert the host and please try again later.`
				);
			}
			else if (result.isQuestCriteriaNotMet()) {
				const { userFeedback } = result;
				return await replyToInteraction(buttonInteraction, userFeedback);
			}

			const baseCompletionLines = [
				`You have successfully completed the ${quest.name} quest!`,
				...rewards.map(toRewardBulletPoint),
			];
			let hiddenQuestLines: string[] = [];

			// If completing this quest unlocked the hidden quest, reveal it and notify the user
			if (
				questService.isHiddenQuestUnlockedForPlayer(buttonInteraction.user.id) &&
				!questService.isHiddenQuest(quest.id)
			) {
				await revealHiddenQuestToPlayer(buttonInteraction.user.id);
				const hiddenChannelId = ids.namesmith.channels.HIDDEN_QUEST;
				hiddenQuestLines = [
					`_ _`,
					`You successfully completed all daily quests and unlocked today's hidden quest! See it in <#${hiddenChannelId}>.`
				];
			}
			
			await replyToInteraction(buttonInteraction,
				...baseCompletionLines,
				...hiddenQuestLines,
			);

			return;
		},
	})
}