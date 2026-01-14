import { toPropertyValues } from "../../../utilities/data-structure-utils";
import { addDays, addHours } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { Quests } from "../constants/quests.constants";
import { INVALID_QUEST_ID, INVALID_QUEST_NAME } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { Quest } from "../types/quest.types";
import { QuestNotFoundError, ShownDailyQuestNotFoundError } from "../utilities/error.utility";
import { QuestRepository } from "./quest.repository";

describe('QuestRepository', () => {
	let questRepository: QuestRepository;
	let db: DatabaseQuerier;

	let SOME_QUEST: Quest;

	beforeEach(() => {
		questRepository = QuestRepository.asMock();
		db = questRepository.db;

		SOME_QUEST = addMockQuest(db, {
			name: 'Some Quest',
			description: 'Some description',
			tokensReward: 10,
			charactersReward: 'abc',
		});
	});

	describe('getQuests()', () => {
		it('returns all quests', () => {
			const quests = questRepository.getQuests();
			makeSure(quests).isNotEmpty();
			makeSure(quests).haveProperties(
				'id', 'name', 'description', 'tokensReward', 'charactersReward', 'wasShown', 'isShown'
			);
		});
	});

	describe('getQuestByID()', () => {
		it('returns the quest with the given ID', () => {
			const quest = questRepository.getQuestByID(SOME_QUEST.id);
			makeSure(quest).is(SOME_QUEST);
		});

		it('returns null if no quest with the given ID exists', () => {
			const quest = questRepository.getQuestByID(INVALID_QUEST_ID);
			makeSure(quest).isNull();
		});
	});

	describe('getQuestOrThrow()', () => {
		it('returns the quest with the given ID', () => {
			const quest = questRepository.getQuestOrThrow(SOME_QUEST.id);
			makeSure(quest).is(SOME_QUEST);
		});

		it('throws a QuestNotFoundError if no quest with the given ID exists', () => {
			makeSure(() =>
				questRepository.getQuestOrThrow(INVALID_QUEST_ID)
			).throws(QuestNotFoundError);
		});
	});

	describe('getQuestByName()', () => {
		it('returns the quest with the given name', () => {
			const quest = questRepository.getQuestByName(SOME_QUEST.name);
			makeSure(quest).is(SOME_QUEST);
		});

		it('returns null if no quest with the given name exists', () => {
			const quest = questRepository.getQuestByName(INVALID_QUEST_NAME);
			makeSure(quest).isNull();
		});
	});

	describe('getQuestByNameOrThrow()', () => {
		it('returns the quest with the given name', () => {
			const quest = questRepository.getQuestByNameOrThrow(SOME_QUEST.name);
			makeSure(quest).is(SOME_QUEST);
		});

		it('throws a QuestNotFoundError if no quest with the given name exists', () => {
			makeSure(() =>
				questRepository.getQuestByNameOrThrow(INVALID_QUEST_NAME)
			).throws(QuestNotFoundError);
		});
	});

	describe('resolveQuest()', () => {
		it('resolves a quest object from a given quest ID.', () => {
			const quest = questRepository.resolveQuest(SOME_QUEST.id);
			makeSure(quest).is(SOME_QUEST);
		});

		it('resolves a quest object from a given quest name.', () => {
			const quest = questRepository.resolveQuest(SOME_QUEST.name);
			makeSure(quest).is(SOME_QUEST);
		});

		it('resolves a quest object from a given quest object.', () => {
			const quest = questRepository.resolveQuest({id: SOME_QUEST.id});
			makeSure(quest).is(SOME_QUEST);
		});

		it('throws a QuestNotFoundError if no quest with the given ID exists.', () => {
			makeSure(() =>
				questRepository.resolveQuest(INVALID_QUEST_ID)
			).throws(QuestNotFoundError);
		});

		it('throws a QuestNotFoundError if no quest with the given name exists.', () => {
			makeSure(() =>
				questRepository.resolveQuest(INVALID_QUEST_NAME)
			).throws(QuestNotFoundError);
		});

		it('throws a QuestNotFoundError if no quest with the given object exists.', () => {
			makeSure(() =>
				questRepository.resolveQuest({id: INVALID_QUEST_ID})
			).throws(QuestNotFoundError);
		});
	});

	describe('resolveID()', () => {
		it('resolves a quest ID from a given quest ID.', () => {
			const id = questRepository.resolveID(SOME_QUEST.id);
			makeSure(id).is(SOME_QUEST.id);
		});

		it('resolves a quest ID from a given quest name.', () => {
			const id = questRepository.resolveID(SOME_QUEST.name);
			makeSure(id).is(SOME_QUEST.id);
		});

		it('resolves a quest ID from a given quest object.', () => {
			const id = questRepository.resolveID({id: SOME_QUEST.id});
			makeSure(id).is(SOME_QUEST.id);
		});

		it('throws a QuestNotFoundError if no quest with the given name exists.', () => {
			makeSure(() =>
				questRepository.resolveID(INVALID_QUEST_NAME)
			).throws(QuestNotFoundError);
		});
	});

	describe('doesQuestExist()', () => {
		it('returns true if a quest with the given ID exists.', () => {
			makeSure(questRepository.doesQuestExist(SOME_QUEST.id)).isTrue();
		});

		it('returns false if no quest with the given ID exists.', () => {
			makeSure(questRepository.doesQuestExist(INVALID_QUEST_ID)).isFalse();
		});

		it('returns true if a quest with the given name exists.', () => {
			makeSure(questRepository.doesQuestExist(SOME_QUEST.name)).isTrue();
		});

		it('returns false if no quest with the given name exists.', () => {
			makeSure(questRepository.doesQuestExist(INVALID_QUEST_NAME)).isFalse();
		});
	});

	describe('addQuest()', () => {
		it('adds a new quest to the database.', () => {
			const quest = questRepository.addQuest({
				id: 100001,
				name: 'New Quest',
				description: 'New Quest Description',
				tokensReward: 100,
				charactersReward: 'abc',
				wasShown: true,
				isShown: true,
			});

			makeSure(quest).is({
				id: 100001,
				name: 'New Quest',
				description: 'New Quest Description',
				tokensReward: 100,
				charactersReward: 'abc',
				wasShown: true,
				isShown: true,
			});

			const resolvedQuest = questRepository.resolveQuest(quest.id);
			makeSure(resolvedQuest).is(quest);
		});

		it('generates an id if one is not provided.', () => {
			const quest = questRepository.addQuest({
				name: 'New Quest',
				description: 'New Quest Description',
				tokensReward: 100,
				charactersReward: 'abc',
				wasShown: true,
				isShown: true,
			});

			makeSure(quest).hasProperty('id');

			const resolvedQuest = questRepository.resolveQuest(quest.id);
			makeSure(resolvedQuest).is(quest);
		});
	});

	describe('updateQuest()', () => {
		it('updates minimal fields of a quest in the database.', () => {
			const quest = questRepository.updateQuest({
				id: SOME_QUEST.id,
				name: 'New Name',
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
			});

			makeSure(quest).is({
				...SOME_QUEST,
				name: 'New Name',
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
			});

			const resolvedQuest = questRepository.resolveQuest(quest.id);
			makeSure(resolvedQuest).is(quest);
		});

		it('updates all fields of a quest in the database.', () => {
			const quest = questRepository.updateQuest({
				id: SOME_QUEST.id,
				name: 'New Name',
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
				wasShown: true,
				isShown: true,
			});

			makeSure(quest).is({
				...SOME_QUEST,
				name: 'New Name',
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
				wasShown: true,
				isShown: true,
			});

			const resolvedQuest = questRepository.resolveQuest(quest.id);
			makeSure(resolvedQuest).is(quest);
		});

		it('updates a quest by name.', () => {
			const quest = questRepository.updateQuest({
				name: SOME_QUEST.name,
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
			});

			makeSure(quest).is({
				...SOME_QUEST,
				description: 'New Description',
				tokensReward: 20,
				charactersReward: 'efg',
			});

			const resolvedQuest = questRepository.resolveQuest(quest.id);
			makeSure(resolvedQuest).is(quest);
		});
	});

	describe('addShownDailyQuest()', () => {
		const TIME_SHOWN = new Date('2023-01-01');

		it('adds a new shown daily quest to the database.', () => {
			const quest = questRepository.addShownDailyQuest({
				timeShown: TIME_SHOWN,
				quest: SOME_QUEST.id,
			});

			makeSure(quest).is({
				timeShown: TIME_SHOWN,
				quest: SOME_QUEST,
				isHidden: false,
			});

			const resolvedQuest = questRepository.getShownDailyQuestOrThrow({timeShown: TIME_SHOWN, questID: SOME_QUEST.id});
			makeSure(resolvedQuest).is(quest);
		});

		it('throws a QuestNotFoundError if no quest with the given ID exists.', () => {
			makeSure(() =>
				questRepository.addShownDailyQuest({
					timeShown: TIME_SHOWN,
					quest: INVALID_QUEST_ID,
				})
			).throws(QuestNotFoundError);
		});
	});

	describe('getShownDailyQuestOrThrow()', () => {
		it('returns the shown daily quest with the given date and quest id', () => {
			const newShownDailyQuest = questRepository.addShownDailyQuest({
				timeShown: new Date('2023-01-01'),
				quest: SOME_QUEST.id,
			});

			const shownDailyQuest = questRepository.getShownDailyQuestOrThrow({timeShown: new Date('2023-01-01'), questID: SOME_QUEST.id});
			makeSure(shownDailyQuest).is(newShownDailyQuest);
		});

		it('throws a ShownDailyQuestNotFoundError if no shown daily quest with the given date and quest id exists', () => {
			makeSure(() =>
				questRepository.getShownDailyQuestOrThrow({timeShown: new Date('2023-01-01'), questID: INVALID_QUEST_ID})
			).throws(ShownDailyQuestNotFoundError);
		});
	});

	describe('getShownDailyQuestDuring()', () => {
		const SOME_DATE = new Date('2023-01-01');
		it('returns all shown daily quests', () => {
			let shownDailyQuests = questRepository.getShownDailyQuestDuring(SOME_DATE);
			makeSure(shownDailyQuests).isEmpty();

			questRepository.addShownDailyQuest({
				timeShown: SOME_DATE,
				quest: SOME_QUEST.id,
			});

			shownDailyQuests = questRepository.getShownDailyQuestDuring(SOME_DATE);
			makeSure(shownDailyQuests).is([{
				timeShown: SOME_DATE,
				quest: SOME_QUEST,
				isHidden: false,
			}]);
		});

		it('returns only shown daily quests within given time frame', () => {
			const SOME_YESTERDAY = addDays(SOME_DATE, -1);
			const SOME_QUESTS = [
				SOME_QUEST,
				addMockQuest(db),
				addMockQuest(db),
				addMockQuest(db),
			];

			questRepository.addShownDailyQuest({
				timeShown: SOME_YESTERDAY,
				quest: SOME_QUESTS[0].id,
			});

			questRepository.addShownDailyQuest({
				timeShown: SOME_YESTERDAY,
				quest: SOME_QUESTS[1].id,
			});

			questRepository.addShownDailyQuest({
				timeShown: SOME_DATE,
				quest: SOME_QUESTS[2].id,
			});

			questRepository.addShownDailyQuest({
				timeShown: SOME_DATE,
				quest: SOME_QUESTS[3].id,
			});

			let shownDailyQuests = questRepository.getShownDailyQuestDuring(addHours(SOME_DATE, -1));
			makeSure(shownDailyQuests).containsOnly(
				{
					timeShown: SOME_YESTERDAY,
					quest: SOME_QUESTS[0],
					isHidden: false,
				},
				{
					timeShown: SOME_YESTERDAY,
					quest: SOME_QUESTS[1],
					isHidden: false,
				},
			);

			shownDailyQuests = questRepository.getShownDailyQuestDuring(addHours(SOME_DATE, 1));
			makeSure(shownDailyQuests).containsOnly(
				{
					timeShown: SOME_DATE,
					quest: SOME_QUESTS[2],
					isHidden: false,
				},
				{
					timeShown: SOME_DATE,
					quest: SOME_QUESTS[3],
					isHidden: false,
				},
			);
		});
	});

	describe('getDailyQuestIDsNotShown()', () => {
		it('returns all quest IDs that have not been shown daily', () => {
			let dailyQuestIDsNotShown = questRepository.getNotShownQuestIDs();
			makeSure(dailyQuestIDsNotShown).containsOnly(
				...toPropertyValues(Object.values(Quests), 'id'),
				SOME_QUEST.id,
			);

			questRepository.setWasShown(SOME_QUEST.id, true);

			dailyQuestIDsNotShown = questRepository.getNotShownQuestIDs();
			makeSure(dailyQuestIDsNotShown).containsOnly(
				...toPropertyValues(Object.values(Quests), 'id'),
			);
		});
	});

	describe('getQuestIDsBeingShown()', () => {
		it('returns all quest IDs thare have isShown set to true', () => {
			questRepository.updateQuest({id: SOME_QUEST.id, isShown: true});
			const questIDsBeingShown = questRepository.getCurrentlyShownQuestIDs();
			makeSure(questIDsBeingShown).containsOnly(SOME_QUEST.id);
		});

		it('returns quests with isShown set to true but NOT quests being currently shown daily', () => {
			const anotherQuest = addMockQuest(db, {name: 'Another Quest'});
			questRepository.addShownDailyQuest({
				timeShown: new Date('2023-01-01'),
				quest: SOME_QUEST.id,
			});

			questRepository.updateQuest({id: anotherQuest.id, isShown: true});
			const questIDsBeingShown = questRepository.getCurrentlyShownQuestIDs();
			makeSure(questIDsBeingShown).containsOnly(anotherQuest.id);
		})
	});

	describe('setWasShown()', () => {
		it('sets the wasShown field of a quest to true', () => {
			questRepository.setWasShown(SOME_QUEST.id, true);
			const quest = questRepository.resolveQuest(SOME_QUEST.id);
			makeSure(quest).hasProperty('wasShown', true);
		});

		it('sets the wasShown field of a quest to false', () => {
			questRepository.setWasShown(SOME_QUEST.id, false);
			const quest = questRepository.resolveQuest(SOME_QUEST.id);
			makeSure(quest).hasProperty('wasShown', false);
		});

		it('throws a QuestNotFoundError if no quest with the given ID exists', () => {
			makeSure(() => questRepository.setWasShown(INVALID_QUEST_ID, true)).throws(QuestNotFoundError);
		});
	});

	describe('setIsShown()', () => {
		it('sets the isShown field of a quest to true', () => {
			questRepository.setIsShown(SOME_QUEST.id, true);
			const quest = questRepository.resolveQuest(SOME_QUEST.id);
			makeSure(quest).hasProperty('isShown', true);
		});

		it('sets the isShown field of a quest to false', () => {
			questRepository.setIsShown(SOME_QUEST.id, false);
			const quest = questRepository.resolveQuest(SOME_QUEST.id);
			makeSure(quest).hasProperty('isShown', false);
		});

		it('throws a QuestNotFoundError if no quest with the given ID exists', () => {
			makeSure(() => questRepository.setIsShown(INVALID_QUEST_ID, true)).throws(QuestNotFoundError);
		});
	});

	describe('resetDailyQuests()', () => {
		it('sets wasShown for all not currently shown quests to false', () => {
			questRepository.setWasShown(SOME_QUEST.id, true);
			questRepository.setIsShown(SOME_QUEST.id, false);

			const anotherQuest = addMockQuest(db, {name: 'Another Quest'});
			questRepository.setWasShown(anotherQuest.id, true);
			questRepository.setIsShown(anotherQuest.id, true);

			questRepository.resetWasShownForUnshownQuests();
			const quest1 = questRepository.resolveQuest(SOME_QUEST.id);
			const quest2 = questRepository.resolveQuest(anotherQuest.id);
			makeSure(quest1).hasProperties({
				wasShown: false,
				isShown: false,
			});
			makeSure(quest2).hasProperties({
				wasShown: true,
				isShown: true,
			});
		})
	})
});