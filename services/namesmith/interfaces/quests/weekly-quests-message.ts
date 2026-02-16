import { ids } from "../../../../bot-config/discord-ids";
import { setNewMessageInChannel } from "../../../../utilities/discord-action-utils";
import { ignoreError } from "../../../../utilities/error-utils";
import { logSetup } from "../../../../utilities/logging-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Quest } from "../../types/quest.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { toQuestButton } from "./complete-quest-button";

/**
 * Sends a message to the quests channel containing the daily quests.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendWeeklyQuestsMessages(): Promise<void> {
	const {questService} = getNamesmithServices();
	const weeklyQuests = questService.getShownWeeklyQuests();
	
	const weeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);

	await setNewMessageInChannel(weeklyQuestsChannel,
		'# Weekly Quests',
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		'Every week, 3-4 weekly quests are shown here for you to complete. These quests take longer and require more effort than daily quests, but they grant higher rewards. Do what the quest asks and click the "Complete Quest" button to claim your reward!',
	);

	for (const quest of weeklyQuests) {
		await sendWeeklyQuestMessage(quest);
	}
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given daily quests.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateWeeklyQuestsMessages() {
	const {questService} = getNamesmithServices();
	const dailyQuests = questService.getShownWeeklyQuests();
	const weeklyQuestRegenerations = [];
	for (const quest of dailyQuests) {
		weeklyQuestRegenerations.push(logSetup(`[WEEKLY QUEST] ${quest.name}`, regenerateWeeklyQuestMessage(quest)));
	}

	await Promise.all(weeklyQuestRegenerations);
}

export async function sendWeeklyQuestMessage(quest: Quest): Promise<void> {
	const message = toQuestButton(quest);
	const weeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);
	await message.sendIn(weeklyQuestsChannel);
}

export async function regenerateWeeklyQuestMessage(quest: Quest) {
	const message = toQuestButton(quest);
	const weeklyQuestsChannel = await fetchNamesmithChannel(ids.namesmith.channels.WEEKLY_QUESTS);
	await ignoreError(
		message.regenerate({channel: weeklyQuestsChannel})
	);
}