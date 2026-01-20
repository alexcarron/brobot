import { QuestService } from "./quest.service";
import { Quest, QuestRecurrences, RewardTypes } from '../types/quest.types';
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { DatabaseQuerier } from "../database/database-querier";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_QUEST_NAME } from "../constants/test.constants";
import { PlayerNotFoundError, QuestNotFoundError } from "../utilities/error.utility";
import { Player } from "../types/player.types";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { Recipe } from "../types/recipe.types";
import { PlayerService } from "./player.service";
import { toPropertyValues } from "../../../utilities/data-structure-utils";
import { addDays } from "../../../utilities/date-time-utils";

describe('QuestService', () => {
	let db: DatabaseQuerier;
	let questService: QuestService;
	let playerService: PlayerService;

	let SOME_QUEST: Quest;
	let SOME_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];

	beforeEach(() => {
		({ db, questService, playerService } = setupMockNamesmith())

		SOME_PLAYER = addMockPlayer(db);
		SOME_QUEST = addMockQuest(db, {
			name: 'Some Quest',
			description: 'Some description',
			tokensReward: 10,
			charactersReward: 'abc',
		});

		FIVE_DIFFERENT_RECIPES = [];
		for (let i = 0; i < 5; i++) {
			FIVE_DIFFERENT_RECIPES[i] = addMockRecipe(db);
		}

		THREE_DIFFERENT_PLAYERS = [];
		for (let i = 0; i < 3; i++) {
			THREE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
		}
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

	describe('givePlayerRewards()', () => {
		it('gives player the number of tokens in the quest token reward', () => {
			const newQuest = addMockQuest(db, {
				tokensReward: 100,
			});

			const originalTokens = SOME_PLAYER.tokens;

			questService.givePlayerRewards(SOME_PLAYER.id, newQuest.id);
			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.tokens).is(originalTokens + 100);
		});

		it('gives player the characters in the quest character reward', () => {
			const newQuest = addMockQuest(db, {
				charactersReward: 'characters',
			});

			const originalCharacters = SOME_PLAYER.inventory;

			questService.givePlayerRewards(SOME_PLAYER.id, newQuest.id);
			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.inventory).is(originalCharacters + 'characters');
		});

		it('throws a PlayerNotFoundError if the player does not exist', () => {
			makeSure(() => {
				questService.givePlayerRewards(INVALID_PLAYER_ID, SOME_QUEST.id);
			}).throws(PlayerNotFoundError);
		});

		it('throws a QuestNotFoundError if the player does not have any completed quests', () => {
			makeSure(() => {
				questService.givePlayerRewards(SOME_PLAYER.id, INVALID_QUEST_ID);
			}).throws(QuestNotFoundError);
		})
	});

	describe('getRewards()', () => {
		it('returns an empty array if the quest has no rewards', () => {
			const quest = addMockQuest(db, {
				tokensReward: 0,
				charactersReward: '',
			});

			const rewards = questService.getRewards(quest);

			makeSure(rewards).is([]);
		});

		it('returns a token reward object if the quest has a token reward', () => {
			const quest = addMockQuest(db, {
				tokensReward: 100,
			});

			const rewards = questService.getRewards(quest);

			makeSure(rewards).is([{
				type: RewardTypes.TOKENS,
				numTokens: 100
			}]);
		});

		it('returns a character reward object if the quest has a character reward', () => {
			const quest = addMockQuest(db, {
				charactersReward: 'characters',
			});

			const rewards = questService.getRewards(quest);

			makeSure(rewards).is([{
				type: RewardTypes.CHARACTERS,
				characters: 'characters'
			}]);
		});

		it('returns both token and character reward objects if the quest has both', () => {
			const quest = addMockQuest(db, {
				tokensReward: 100,
				charactersReward: 'characters',
			});

			const rewards = questService.getRewards(quest);

			makeSure(rewards).is([
				{
					type: RewardTypes.TOKENS,
					numTokens: 100
				},
				{
					type: RewardTypes.CHARACTERS,
					characters: 'characters'
				}
			]);
		});

		it('throws a QuestNotFoundError if the quest does not exist', () => {
			makeSure(() => {
				questService.getRewards(INVALID_QUEST_ID);
			}).throws(QuestNotFoundError);
		});
	});

	describe('assignNewDailyQuests()', () => {
		const SOME_DATE = new Date();

		it('Marks three random quests as shown and adds them to shown daily quests', () => {
			let shownDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
				shownDailyQuests = questService.getCurrentDailyQuests();
				makeSure(shownDailyQuests.length).isGreaterThan(0);
			}
			finally { Math.random = realRandom }
			makeSure(shownDailyQuests).haveProperties({
				isShown: true,
				wasShown: true,
			});
			makeSure(toPropertyValues(shownDailyQuests, 'id')).areAllDifferent();
		});

		it('Marks new random quests as shown and adds them to shown daily quests if the current date is different', () => {
			let shownDailyQuests: Quest[];
			let oldDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6; // deterministic
			try {
				questService.assignNewDailyQuests(addDays(SOME_DATE, -1));
				oldDailyQuests = questService.getCurrentDailyQuests();
				questService.assignNewDailyQuests(SOME_DATE);
				shownDailyQuests = questService.getCurrentDailyQuests();
				makeSure(shownDailyQuests.length).isGreaterThan(0);
			}
			finally { Math.random = realRandom }
			makeSure(shownDailyQuests).haveProperties({
				isShown: true,
				wasShown: true,
			});
			makeSure(toPropertyValues(shownDailyQuests, 'id')).areAllDifferent();
			makeSure(toPropertyValues(shownDailyQuests, 'id')).doesNotContain(toPropertyValues(oldDailyQuests, 'id'));
		});

		it('Assigns already chosen quests when we run out', () => {
			db.run('DELETE FROM quest');

			const quests = [];
			for (let index = 0; index < 4; index++) {
				quests[index] = addMockQuest(db);
			}

			let oldDailyQuests: Quest[];
			let newDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6; // deterministic
			try {
				questService.assignNewDailyQuests(addDays(SOME_DATE, -1));
				oldDailyQuests = questService.getCurrentDailyQuests();

				questService.assignNewDailyQuests(SOME_DATE);
				newDailyQuests = 	questService.getCurrentDailyQuests();
			}
			finally { Math.random = realRandom }

			makeSure(newDailyQuests.length).isGreaterThan(0);
			// When we run out of unique quests it's valid for the service to
			// reuse already-chosen quests; ensure at least one overlap exists.
			makeSure(toPropertyValues(newDailyQuests, 'id')).hasAnItemWhere(questID =>
				toPropertyValues(oldDailyQuests, 'id').includes(questID)
			)
		});

		it('Adds quests correctly to shownDailyQuest table', () => {
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const dailyQuests = questService.getCurrentDailyQuests();
			makeSure(dailyQuests.length).isGreaterThan(0);

			const shownDailyQuests = questService.questRepository.getShownDailyQuestDuring(SOME_DATE);

			const quests = toPropertyValues(shownDailyQuests, 'quest')
			makeSure(shownDailyQuests).haveProperties({
				timeShown: SOME_DATE,
			});
			const visibleQuests = quests.filter(q => q.isShown);
			makeSure(visibleQuests.length).isGreaterThan(0);
			makeSure(visibleQuests).haveProperties({
				wasShown: true,
			});
			makeSure(toPropertyValues(visibleQuests, 'id')).areAllDifferent();


			const SOME_TOMORROW = addDays(SOME_DATE, 1);
			questService.assignNewDailyQuests(SOME_TOMORROW);

			const shownDailyQuestsTomorrow = questService.questRepository.getShownDailyQuestDuring(SOME_TOMORROW);
			const questsTomorrow = toPropertyValues(shownDailyQuestsTomorrow, 'quest')
			makeSure(shownDailyQuestsTomorrow).haveProperties({
				timeShown: SOME_TOMORROW,
			});
			const visibleQuestsTomorrow = questsTomorrow.filter(q => q.isShown);
			makeSure(visibleQuestsTomorrow.length).isGreaterThan(0);
			makeSure(visibleQuestsTomorrow).haveProperties({
				wasShown: true,
			});
			makeSure(toPropertyValues(visibleQuestsTomorrow, 'id')).areAllDifferent();

			console.log(questService.questRepository.db.getRows(
				`SELECT * FROM shownDailyQuest`
			));
		});

		it('never assigns weekly quests', () => {
			addMockQuest(db, {
				recurrence: 'weekly',
			});
			
			let day = SOME_DATE;
			for (let i = 0; i < 25; i++) {
				questService.assignNewDailyQuests(day);
				makeSure(questService.getCurrentDailyQuests()).haveProperty('recurrence', 'daily');
				day = addDays(day, 1);
			}
		});
	});

	describe('assignNewWeeklyQuests()', () => {
		const SOME_DATE = new Date();

		it('Marks three random quests as shown and adds them to shown weekly quests', () => {
			const shownWeeklyQuests = questService.assignNewWeeklyQuests(SOME_DATE);
			makeSure(shownWeeklyQuests.length).isBetween(3, 4);
			makeSure(toPropertyValues(shownWeeklyQuests, 'id')).areAllDifferent();
		});

		it('Marks new random quests as shown and adds them to shown weekly quests if the current week is different', () => {
			let shownWeeklyQuests = questService.assignNewWeeklyQuests(addDays(SOME_DATE, -7));
			const oldWeeklyQuestsIDs = toPropertyValues(shownWeeklyQuests, 'id');
			makeSure(oldWeeklyQuestsIDs).areAllDifferent();

			shownWeeklyQuests = questService.assignNewWeeklyQuests(SOME_DATE);
			const newWeeklyQuestsIDs = toPropertyValues(shownWeeklyQuests, 'id');
			makeSure(newWeeklyQuestsIDs).areAllDifferent();
			makeSure(newWeeklyQuestsIDs).doesNotContain(oldWeeklyQuestsIDs);
		});

		it('Assigns already chosen quests when we run out', () => {
			db.run('DELETE FROM quest');
			
			const quests = [];
			for (let index = 0; index < 4; index++) {
				quests[index] = addMockQuest(db, { recurrence: QuestRecurrences.WEEKLY });
			}

			const oldWeeklyQuests = questService.assignNewWeeklyQuests(addDays(SOME_DATE, -7));
			const newWeeklyQuests = questService.assignNewWeeklyQuests(SOME_DATE);

			const oldWeeklyQuestsIDs = toPropertyValues(oldWeeklyQuests, 'id');
			const newWeeklyQuestsIDs = toPropertyValues(newWeeklyQuests, 'id');
			
			makeSure(oldWeeklyQuestsIDs).areAllDifferent();
			makeSure(newWeeklyQuestsIDs).areAllDifferent();
			makeSure(toPropertyValues(newWeeklyQuests, 'id')).hasAnItemWhere(questID =>
				oldWeeklyQuestsIDs.includes(questID)
			);
		});

		it('Adds quests correctly to shownWeeklyQuest table', () => {
			const chosenQuests = questService.assignNewWeeklyQuests(SOME_DATE);
			const shownWeeklyQuests = questService.questRepository.getShownWeeklyQuestDuring(SOME_DATE);
			makeSure(shownWeeklyQuests.length).isBetween(3, 4);
			makeSure(shownWeeklyQuests).haveProperties({
				timeShown: SOME_DATE,
			});
			makeSure(toPropertyValues(shownWeeklyQuests, 'quest').map(q => q.id)).containsOnly(
				...chosenQuests.map(q => q.id)
			)
		});
	});

	describe('reset()', () => {
		it('should reset the quest repository', () => {
			const SOME_DATE = new Date();
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
				questService.assignNewDailyQuests(SOME_DATE);
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			questService.reset();
			const dailyQuests = questService.getCurrentDailyQuests();
			makeSure(dailyQuests).hasLengthOf(0);

			const currentlyShownQuestIDs = questService.questRepository.getCurrentlyShownDailyQuestIDs();
			makeSure(currentlyShownQuestIDs).hasLengthOf(0);

			const quests = questService.questRepository.getQuests();
			for (const quest of quests) {
				makeSure(quest.isShown).is(false);
				makeSure(quest.wasShown).is(false);
			}
		});
	});

	describe('isHiddenQuestUnlockedForPlayer', () => {
		it('returns true only after player completes all visible quests', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const shown = questService.questRepository.getShownDailyQuestDuring(SOME_DATE);
			// There should be one hidden quest and at least one visible quest
			const visible = shown.filter(s => !s.isHidden);
			const hidden = shown.filter(s => s.isHidden);

			makeSure(visible.length).isGreaterThan(0);
			makeSure(hidden.length).isGreaterThan(0);

			const player = addMockPlayer(db);

			// Initially locked
			makeSure(questService.isHiddenQuestUnlockedForPlayer(player.id)).isFalse();

			// Complete all visible quests for player
			for (const v of visible) {
				questService.activityLogService.logCompleteQuest({
					playerCompletingQuest: player.id,
					questCompleted: v.quest.id,
					nameBefore: player.currentName,
				});
			}

			// Now unlocked
			makeSure(questService.isHiddenQuestUnlockedForPlayer(player.id)).isTrue();
		});
	});

	describe('getHiddenDailyQuests', () => {
		it('returns an array of all hidden quests for today', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenDailyQuests();

			// Verify we have hidden quests
			makeSure(hiddenQuests.length).isGreaterThan(0);

			// Verify all returned quests are actually hidden
			const shownToday = questService.questRepository.getShownDailyQuestDuring(SOME_DATE);
			const actualHiddenQuests = shownToday.filter(s => s.isHidden).map(s => s.quest);
			makeSure(hiddenQuests).hasLengthOf(actualHiddenQuests.length);
			for (const quest of hiddenQuests) {
				const isHidden = actualHiddenQuests.some(hq => hq.id === quest.id);
				makeSure(isHidden).isTrue();
			}
		});

		it('returns an empty array when there are no hidden quests for today', () => {
			// Don't assign any daily quests
			const hiddenQuests = questService.getHiddenDailyQuests();
			makeSure(hiddenQuests).hasLengthOf(0);
		});
	});

	describe('isHiddenQuest', () => {
		it('returns true if the quest is a hidden quest for today', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenDailyQuests();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest(hiddenQuest.id)).isTrue();
		});

		it('returns true if the quest is a hidden quest using quest name', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenDailyQuests();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest(hiddenQuest.name)).isTrue();
		});

		it('returns true if the quest is a hidden quest using quest object', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenDailyQuests();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest({id: hiddenQuest.id})).isTrue();
		});

		it('returns false if the quest is not a hidden quest', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			const shownQuests = questService.getCurrentDailyQuests();
			makeSure(shownQuests.length).isGreaterThan(0);

			const visibleQuest = shownQuests[0];
			makeSure(questService.isHiddenQuest(visibleQuest.id)).isFalse();
		});

		it('returns false if the quest is not shown today', () => {
			const SOME_DATE = new Date();

			// Add some quests to choose from
			for (let i = 0; i < 6; i++) addMockQuest(db);

			// Ensure deterministic selection and assign quests
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewDailyQuests(SOME_DATE);
			}
			finally { Math.random = realRandom }

			// Get a quest that wasn't picked for today
			const allQuests = questService.questRepository.getQuests();
			const shownQuestIDs = questService.questRepository.getShownDailyQuestDuring(SOME_DATE).map(s => s.quest.id);
			const notShownQuest = allQuests.find(q => !shownQuestIDs.includes(q.id));

			makeSure(notShownQuest).isNotNull();
			makeSure(questService.isHiddenQuest(notShownQuest!.id)).isFalse();
		});

		it('returns false when there are no hidden quests for today', () => {
			// Don't assign any daily quests
			const someRandomQuestID = SOME_QUEST.id;
			makeSure(questService.isHiddenQuest(someRandomQuestID)).isFalse();
		});
	});
});
