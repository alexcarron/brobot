import { ButtonStyle } from "discord.js";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { Quest, Reward } from "../../types/quest.types";
import { isReward } from "../../utilities/quest.utility";
import { NamesmithError } from "../../utilities/error.utility";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { ids } from "../../../../bot-config/discord-ids";
import { ignoreError } from "../../../../utilities/error-utils";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { completeQuest } from "../../workflows/quests/complete-quest.workflow";

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
			else if (result.isNotEnoughCrafts()) {
				const {numHas, numNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`You have need to craft at least ${numNeeded} times to complete the ${quest.name} quest, but you have only crafted ${numHas} times. You need to craft ${numNeeded - numHas} more times.`
				);
			}
			else if (result.isNotEnoughUniqueRecipes()) {
				const {numHas, numNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`You have to craft at least ${numNeeded} different recipes to complete the ${quest.name} quest, but you have only crafted ${numHas}. You need to craft ${numNeeded - numHas} more recipes you have not used before.`
				);
			}
			else if (result.isNameNotPublished())
				return await replyToInteraction(buttonInteraction,
					`You have not published your name yet. Your name must be published before you can complete the ${quest.name} quest.`
				);
			else if (result.isNameHasNoEmojis())
				return await replyToInteraction(buttonInteraction,
					`Your name must have at least one emoji before you can complete the ${quest.name} quest.`
				);
			else if (result.isNameHasNoSymbols())
				return await replyToInteraction(buttonInteraction,
					`Your name must have at least one symbol before you can complete the ${quest.name} quest.`
				);
			else if (result.isNameHasNoLetters())
				return await replyToInteraction(buttonInteraction,
					`Your name must have at least one letter before you can complete the ${quest.name} quest.`
				);
			else if (result.isNotEnoughTradesMade()) {
				const {numHas, numNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`You need to make at least ${numNeeded} trades to complete the ${quest.name} quest, but you have only made ${numHas}. You need to trade with ${numNeeded - numHas} more players.`
				);
			}
			else if (result.isNotEnoughUniquePlayersAccepted()) {
				const {numHas, numNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`You need to have at least ${numNeeded} different player accept your trades to complete the ${quest.name} quest, but only ${numHas} have. You need ${numNeeded - numHas} more unique players to accept your trades.`
				);
			}
			else if (result.isNameNotSharedByAnyone()) {
				return await replyToInteraction(buttonInteraction,
					`Nobody has the same name as you. You must have at least one player that shares the same published name as you to complete the ${quest.name} quest.`
				);
			}
			else if (result.isNameTooShort()) {
				const {currentLength, lengthNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`Your published name needs to have at least ${lengthNeeded} characters to complete the ${quest.name} quest, but it only has ${currentLength}. You need ${lengthNeeded - currentLength} more.`
				);
			}
			else if (result.isNotEnoughTokensEarned()) {
				const {numHas, numNeeded} = result;
				return await replyToInteraction(buttonInteraction,
					`You need to earn at least ${numNeeded} tokens to complete the ${quest.name} quest, but you only have ${numHas}. You need to earn ${numNeeded - numHas} more.`
				);
			}

			return await replyToInteraction(buttonInteraction,
				`You have completed the **${quest.name}** quest!`,
				...rewards.map(toRewardBulletPoint),
			);
		},
	})
}

/**
 * Creates a bullet point string for the given reward.
 * @param reward - The reward to create a bullet point for.
 * @returns The bullet point string
 */
export function toRewardBulletPoint(reward: Reward): string {
	if (isReward.tokens(reward)) {
		return `- :coin: +${reward.numTokens} Tokens`;
	}
	else if (isReward.characters(reward)) {
		// Should form a string like: `a` `b` `c` `d` `\``
		const charactersString = reward.characters
			.split('')
			.map(character => character.replace('`', '\\`'))
			.map(character => `\`${character}\``)
			.join(' ');

		return `- :symbols: +${reward.characters.length} Characters: ${charactersString}`;
	}
	else {
		throw new NamesmithError(
			`A reward bullet point has not been defined for reward type: ${reward}`
		)
	}
}

/**
 * Sends a message to the quests channel containing the details of the given quest.
 * @param quest - The quest to send details of.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendQuestMessage(quest: Quest): Promise<void> {
	const message = toQuestButton(quest);
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.QUESTS)
	await message.sendIn(questChannel);
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given quest.
 * @param quest - The quest to regenerate the message for.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateQuestMessage(quest: Quest) {
	const message = toQuestButton(quest);
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.QUESTS)
	await ignoreError(
		message.regenerate({channel: questChannel})
	);
}