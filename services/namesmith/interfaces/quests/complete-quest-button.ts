import { ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Quest } from "../../types/quest.types";
import { completeQuest } from "../../workflows/quests/complete-quest.workflow";
import { toRewardBulletPoint } from "./quest-message";


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

			return await replyToInteraction(buttonInteraction,
				`You have completed the **${quest.name}** quest!`,
				...rewards.map(toRewardBulletPoint),
			);
		},
	})
}