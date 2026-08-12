import { quests } from "../../../database/static-data/quests";
import { FREEBIE_QUEST_NAME } from "../../../constants/test.constants";
import { questIDToMeetsCriteriaCheck } from "../complete-quest.workflow";

describe('quest eligibility check coverage', () => {
	it.each(quests.filter(quest => !quest.name.includes(FREEBIE_QUEST_NAME)))(
		'has an eligibility check defined for quest $id ($name)',
		(quest) => {
			expect(quest.id in questIDToMeetsCriteriaCheck).toBe(true);
		}
	);
});
