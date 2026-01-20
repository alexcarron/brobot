import { Quest } from "../../types/quest.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { ids } from "../../../../bot-config/discord-ids";
import { ignoreError } from "../../../../utilities/error-utils";
import { toQuestButton } from "./complete-quest-button";
import { closeChannel, setNewMessageInChannel } from "../../../../utilities/discord-action-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";


/**
 * Sends the initial hidden quest introduction message to the hidden quest channel and the hidden quest messages.
 * This message is sent at the start of the day to explain the hidden quest mechanic.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendHiddenQuestsMessages(): Promise<void> {
	const {questService} = getNamesmithServices();
	const hiddenQuests = questService.getHiddenDailyQuests();

	const hiddenChannel = await fetchNamesmithChannel(ids.namesmith.channels.HIDDEN_QUESTS);
	await closeChannel(hiddenChannel);

	await setNewMessageInChannel(hiddenChannel,
		`# Hidden Quests`,
		`You unlocked today's hidden quest by completing all daily quests. Read the objective, perform the required actions, and click the "Complete Quest" button to claim your reward`,
	);

	for (const quest of hiddenQuests) {
		await sendHiddenQuestMessage(quest);
	}
}

export async function regenerateHiddenQuestsMessages() {
	const {questService} = getNamesmithServices();
	const hiddenQuests = questService.getHiddenDailyQuests();
	for (const quest of hiddenQuests) {
		await regenerateHiddenQuestMessage(quest);
	}
}

/**
 * Sends a message to the hidden quest channel containing the details of the given hidden quest.
 * @param quest - The hidden quest to send details of.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendHiddenQuestMessage(quest: Quest): Promise<void> {
	const message = toQuestButton(quest);
	const hiddenChannel = await fetchNamesmithChannel(ids.namesmith.channels.HIDDEN_QUESTS);
	await message.sendIn(hiddenChannel);
}

/**
 * Regenerates the message that was sent to the hidden quest channel containing the details of the given hidden quest.
 * @param quest - The hidden quest to regenerate the message for.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateHiddenQuestMessage(quest: Quest): Promise<void> {
	const message = toQuestButton(quest);
	const hiddenChannel = await fetchNamesmithChannel(ids.namesmith.channels.HIDDEN_QUESTS);
	await ignoreError(
		message.regenerate({ channel: hiddenChannel })
	);
}
