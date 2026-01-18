import { makeSure } from "../../../../utilities/jest/jest-utils";
import { QuestRepository } from "../../repositories/quest.repository";
import { DatabaseQuerier } from "../database-querier";
import { syncQuestsToDB } from "./sync-quests";

describe('sync-quests.ts', () => {
	let db: DatabaseQuerier;
	let questRepository: QuestRepository;

	beforeEach(() => {
		questRepository = QuestRepository.asMock();
		db = questRepository.db;
	});

	describe('syncQuestsToDB()', () => {
		it('should add new quest defintions to the database', () => {
			syncQuestsToDB(db, [
				{
					name: 'Quest 1',
					description: 'Description 1',
					recurrence: 'daily',
					tokensReward: 10,
				},
				{
					name: 'Quest 2',
					description: 'Description 2',
					recurrence: 'daily',
					charactersReward: 'abc',
				}
			]);

			const quests = questRepository.getQuests();
			makeSure(quests).hasLengthOf(2);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 1' &&
				quest.description === 'Description 1' &&
				quest.tokensReward === 10
			);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 2' &&
				quest.description === 'Description 2' &&
				quest.charactersReward === 'abc'
			);
		});

		it('should delete quests not defined in the static data', () => {
			syncQuestsToDB(db, [
				{
					name: 'Quest 2',
					description: 'Description 2',
					recurrence: 'daily',
					tokensReward: 100,
				},
			]);

			syncQuestsToDB(db, [
				{
					name: 'Quest 1',
					description: 'Description 1',
					recurrence: 'daily',
					tokensReward: 10,
				},
			]);

			const quests = questRepository.getQuests();
			makeSure(quests).hasLengthOf(1);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 1' &&
				quest.description === 'Description 1' &&
				quest.tokensReward === 10
			);
		});

		it('should update existing quests defined in the static data', () => {
			syncQuestsToDB(db, [
				{
					name: 'Quest 1',
					description: 'Description 1',
					recurrence: 'daily',
					tokensReward: 10,
				},
			]);

			syncQuestsToDB(db, [
				{
					name: 'Quest 1',
					description: 'Description 2',
					recurrence: 'daily',
					tokensReward: 100,
				},
			]);

			const quests = questRepository.getQuests();
			makeSure(quests).hasLengthOf(1);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 1' &&
				quest.description === 'Description 2' &&
				quest.tokensReward === 100
			);
		});

		it('should delete, update, and add quests all at once', () => {
			syncQuestsToDB(db, [
				{
					id: 3,
					name: 'Quest 1',
					description: 'Description 1',
					recurrence: 'daily',
					tokensReward: 10,
				},
				{
					id: 2,
					name: 'Quest 2',
					description: 'Description 2',
					recurrence: 'daily',
				},
				{
					name: 'Quest 3',
					description: 'Description 3',
					recurrence: 'daily',
					tokensReward: 1000,
					charactersReward: 'abc',
				}
			]);

			syncQuestsToDB(db, [
				{
					id: 2,
					name: 'New Quest 2',
					description: 'New Description 2',
					recurrence: 'daily',
					tokensReward: 200,
				},
				{
					name: 'Quest 3',
					description: 'New Description 3',
					recurrence: 'daily',
					tokensReward: 2000,
					charactersReward: 'edf',
				},
				{
					name: 'Quest 4',
					description: 'Description 4',
					recurrence: 'daily',
				}
			]);

			const quests = questRepository.getQuests();
			makeSure(quests).hasLengthOf(3);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.id === 2 &&
				quest.name === 'New Quest 2' &&
				quest.description === 'New Description 2' &&
				quest.tokensReward === 200
			);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 3' &&
				quest.description === 'New Description 3' &&
				quest.tokensReward === 2000 &&
				quest.charactersReward === 'edf'
			);
			makeSure(quests).hasAnItemWhere(quest =>
				quest.name === 'Quest 4' &&
				quest.description === 'Description 4'
			);
		});
	});
});