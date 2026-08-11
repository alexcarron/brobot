import { logInfo } from "../../../utilities/logging-utils";
import { sendShownWeeklyQuestsMessages } from "../interfaces/quests/weekly-quests-message";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { telemetry } from "../telemetry/telemetry";
import { EventType } from "../telemetry/telemetry-event.types";

/**
 * Triggers any game events that must occur at the start of each week
 */
export async function onWeekStart() {
	const { questService, weekService } = getNamesmithServices();
	const now = new Date();

	const thisWeek = weekService.addNewWeek(now);
	const shownWeeklyQuests = questService.assignNewShownWeeklyQuests(thisWeek);
	await sendShownWeeklyQuestsMessages();

	for (const quest of shownWeeklyQuests) {
		telemetry.track({
			eventType: EventType.QUEST_SHOWN,
			questID: quest.id,
			isHiddenQuest: false,
		});
	}

	logInfo(`Week ${thisWeek.id} started at ${thisWeek.timeStarted.toISOString()}.`);
	logInfo(`Weekly quests assigned.`);
}