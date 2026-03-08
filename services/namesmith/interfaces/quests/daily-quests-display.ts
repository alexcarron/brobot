import { TextChannel } from "discord.js";
import { ids } from "../../../../bot-config/discord-ids";
import { deleteAllMessagesInChannel, setNewMessageInChannel } from "../../../../utilities/discord-action-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { regenerateQuestMessage, sendQuestMessage } from "./quest-message";

/**
 * Sends a message to the quests channel containing the daily quests.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendDailyQuestsDisplay(): Promise<void> {
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.DAILY_QUESTS);
	await deleteAllMessagesInChannel(questChannel);
	await sendInitialDailyQuestsMessage(questChannel);
	await sendQuestMessages();
}

async function sendInitialDailyQuestsMessage(questChannel: TextChannel) {
	await setNewMessageInChannel(questChannel,
		'# Daily Quests',
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		'The following are short, fun challenges you can complete for quick rewards! Do what the quest asks, and click the "Complete Quest" button to claim your reward!',
	);
}

async function sendQuestMessages() {
	const {questService} = getNamesmithServices();
	const dailyQuests = questService.getCurrentDailyQuests();
	for (const quest of dailyQuests) {
		await sendQuestMessage(quest);
	}
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given daily quests.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateDailyQuestsDisplay() {
	const {questService} = getNamesmithServices();
	const dailyQuests = questService.getDailyQuestsShownToday();
	for (const quest of dailyQuests) {
		await regenerateQuestMessage(quest);
	}
}