import { sendWeeklyQuestsMessages } from "../interfaces/quests/weekly-quests-message";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Triggers any game events that must occur at the start of each week
 */
export async function onWeekStart() {
	const { questService } = getNamesmithServices();
	const now = new Date();

	questService.assignNewWeeklyQuests(now);
	await sendWeeklyQuestsMessages();
}