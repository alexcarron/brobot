import { ids } from "../../../../bot-config/discord-ids";
import { setNewMessageInChannel } from "../../../../utilities/discord/message-utils";
import { ignoreError } from "../../../../utilities/error-utils";
import { logSetup } from "../../../../utilities/logging-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Quest } from "../../types/quest.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { toQuestButton } from "./complete-quest-button";
import { getPingForAllPlayers } from "../../utilities/player-message.utility";

const WEEKLY_QUESTS_HEADER_TEXT = `# Weekly Quests`;
const WEEKLY_QUESTS_INTRO_TEXT = `Every week, 3-4 weekly quests are shown here for you to complete. These quests take longer and require more effort than daily quests, but they grant higher rewards. Do what the quest asks and click the "Complete Quest" button to claim your reward!`;

/**
 * Sends a message to the quests channel containing the daily quests.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendShownWeeklyQuestsMessages(): Promise<void> {
	const {questService} = getNamesmithServices();
	const shownWeeklyQuests = questService.getCurrentShownWeeklyQuests();
	
	const shownWeeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);

	await setNewMessageInChannel(shownWeeklyQuestsChannel,
		WEEKLY_QUESTS_HEADER_TEXT,
		getPingForAllPlayers(),
		WEEKLY_QUESTS_INTRO_TEXT,
	);

	for (const quest of shownWeeklyQuests) {
		await sendShownWeeklyQuestMessage(quest);
	}
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given daily quests.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateShownWeeklyQuestsMessages() {
	const {questService} = getNamesmithServices();
	const shownDailyQuests = questService.getCurrentShownWeeklyQuests();
	const shownWeeklyQuestRegenerations = [];
	for (const quest of shownDailyQuests) {
		shownWeeklyQuestRegenerations.push(logSetup(`[WEEKLY QUEST] ${quest.name}`, regenerateShownWeeklyQuestMessage(quest)));
	}

	await Promise.all(shownWeeklyQuestRegenerations);
}

export async function sendShownWeeklyQuestMessage(quest: Quest): Promise<void> {
	const message = toQuestButton(quest);
	const shownWeeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);
	await message.sendIn(shownWeeklyQuestsChannel);
}

export async function regenerateShownWeeklyQuestMessage(quest: Quest) {
	const message = toQuestButton(quest);
	const shownWeeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);
	await ignoreError(
		message.regenerate({channel: shownWeeklyQuestsChannel})
	);
}