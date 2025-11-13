import { createMockQuestService } from "../mocks/mock-services";
import { QuestService } from "./quest.service";
import { Quest } from '../types/quest.types';
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { DatabaseQuerier } from "../database/database-querier";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_QUEST_ID, INVALID_QUEST_NAME } from "../constants/test.constants";

describe('QuestService', () => {
	let db: DatabaseQuerier;
	let questService: QuestService;

	let SOME_QUEST: Quest;

	beforeEach(() => {
		questService = createMockQuestService();
		db = questService.questRepository.db;

		SOME_QUEST = addMockQuest(db, {
			name: 'Some Quest',
			description: 'Some description',
			tokensReward: 10,
			charactersReward: 'abc',
		});
	});

	describe('isQuest', () => {
		it('returns true if the quest id exists', () => {
			makeSure(questService.isQuest(SOME_QUEST.id)).isTrue();
		});

		it('returns true if the quest name exists', () => {
			makeSure(questService.isQuest(SOME_QUEST.name)).isTrue();
		});

		it('return true if the quest object exists', () => {
			makeSure(questService.isQuest({id: SOME_QUEST.id})).isTrue();
		});

		it('returns false if the quest id does not exist', () => {
			makeSure(questService.isQuest(INVALID_QUEST_ID)).isFalse();
		});

		it('returns false if the quest name does not exist', () => {
			makeSure(questService.isQuest(INVALID_QUEST_NAME)).isFalse();
		});

		it('returns false if the quest object does not exist', () => {
			makeSure(questService.isQuest({id: INVALID_QUEST_ID})).isFalse();
		});
	});
});