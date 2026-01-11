import { ids } from "../../../../bot-config/discord-ids";
import { deleteAllMessagesInChannel } from "../../../../utilities/discord-action-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Quest } from "../../types/quest.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { regenerateQuestMessage, sendQuestMessage } from "./quest-message";

/**
 * Sends a message to the quests channel containing the daily quests.
 * @param parameters - The parameters for sending the daily quests message.
 * @param parameters.dailyQuests - The daily quests to be sent in the message.
 * @returns A promise that resolves when the message has been sent.
 */
export async function sendDailyQuestsMessage(
	{dailyQuests}: { dailyQuests: Quest[] }
) {
	const questChannel = await fetchNamesmithChannel(ids.namesmith.channels.QUESTS);

	await deleteAllMessagesInChannel(questChannel);

	await questChannel.send(joinLines(
		'# Daily Quests',
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		'The following are short, fun challenges you can complete for quick rewards! Do what the quest asks, and click the "Complete Quest" button to claim your reward!',
	));

	for (const quest of dailyQuests) {
		await sendQuestMessage(quest);
	}
}

/**
 * Regenerates the message that was sent to the quests channel containing the details of the given daily quests.
 * @returns A promise that resolves when the message has been regenerated.
 */
export async function regenerateDailyQuestsMessage() {
	const {questService} = getNamesmithServices();
	const dailyQuests = questService.getCurrentDailyQuests();
	for (const quest of dailyQuests) {
		await regenerateQuestMessage(quest);
	}
}