import { Quest, Reward } from "../../types/quest.types";
import { isReward } from "../../utilities/quest.utility";
import { NamesmithError } from "../../utilities/error.utility";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { ids } from "../../../../bot-config/discord-ids";
import { ignoreError } from "../../../../utilities/error-utils";
import { toQuestButton } from "./complete-quest-button";
import { toBacktickedCharacterList } from "../../utilities/player-message.utility";

const TOKENS_REWARD_BULLET_TEXT = (numTokens: number) => `- :coin: +${numTokens} Tokens`;
const CHARACTERS_REWARD_BULLET_TEXT = (
	{ numCharacters, charactersString }: { numCharacters: number, charactersString: string }
) => `- :symbols: +${numCharacters} Characters: ${charactersString}`;

/**
 * Creates a bullet point string for the given reward.
 * @param reward - The reward to create a bullet point for.
 * @returns The bullet point string
 */
export function toRewardBulletPoint(reward: Reward): string {
	if (isReward.tokens(reward)) {
		return TOKENS_REWARD_BULLET_TEXT(reward.numTokens);
	}
	else if (isReward.characters(reward)) {
		const charactersString = toBacktickedCharacterList(reward.characters, ' ');

		return CHARACTERS_REWARD_BULLET_TEXT({ numCharacters: reward.characters.length, charactersString });
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
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.DAILY_QUESTS)
	await message.sendIn(questChannel);
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given quest.
 * @param quest - The quest to regenerate the message for.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateQuestMessage(quest: Quest) {
	const message = toQuestButton(quest);
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.DAILY_QUESTS)
	await ignoreError(
		message.regenerate({channel: questChannel})
	);
}