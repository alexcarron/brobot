import { logInfo } from "../../../utilities/logging-utils";
import { sendShownWeeklyQuestsMessages } from "../interfaces/quests/weekly-quests-message";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Triggers any game events that must occur at the start of each week
 */
export async function onWeekStart() {
	const { questService, weekService } = getNamesmithServices();
	const now = new Date();

	const thisWeek = weekService.addNewWeek(now);
	questService.assignNewShownWeeklyQuests(thisWeek);
	await sendShownWeeklyQuestsMessages();

	logInfo(`Week ${thisWeek.id} started at ${thisWeek.timeStarted.toISOString()}.`);
	logInfo(`Weekly quests assigned.`);
}