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
			await replyToInteraction(buttonInteraction,
				'This is a temporary response message until the functionality is implemented.'
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