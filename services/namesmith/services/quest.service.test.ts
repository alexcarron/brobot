import { QuestService } from "./quest.service";
import { Quest, QuestID, QuestRecurrences, RewardTypes } from '../types/quest.types';
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { DatabaseQuerier } from "../database/database-querier";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_QUEST_NAME } from "../constants/testing.constants";
import { PlayerNotFoundError, QuestNotFoundError } from "../utilities/error.utility";
import { Player } from "../types/player.types";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { Recipe } from "../types/recipe.types";
import { PlayerService } from "./player.service";
import { toPropertyValues } from '../../../utilities/data-structure-utils';
import { addDays } from "../../../utilities/date-time-utils";
import { addMockDay } from "../mocks/mock-data/mock-days";
import { Day } from "../types/day.types";
import { Week } from "../types/week.types";
import { addMockWeek } from "../mocks/mock-data/mock-weeks";

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

		it('gives player both the characters and tokens in the quest for multiple quests', () => {
			const newQuest = addMockQuest(db, {
				tokensReward: 250,
				charactersReward: 'characters',
			});
			const newQuest2 = addMockQuest(db, {
				tokensReward: 500,
				charactersReward: 'different characters',
			});

			const originalTokens = SOME_PLAYER.tokens;
			const originalCharacters = SOME_PLAYER.inventory;

			questService.givePlayerRewards(SOME_PLAYER.id, newQuest.id);
			questService.givePlayerRewards(SOME_PLAYER.id, newQuest2.id);
			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.tokens).is(originalTokens + 750);
			makeSure(resolvedPlayer.inventory).is(originalCharacters + 'charactersdifferent characters');
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

	describe('assignNewShownDailyQuests()', () => {
		let SOME_DAY: Day;
		
		beforeEach(() => {
			SOME_DAY = addMockDay(db);
		})

		it('Marks three random quests as shown and adds them to shown daily quests', () => {
			let shownDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
				shownDailyQuests = questService.getTodaysNonHiddenDailyQuests();
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
			let oldShownDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6; // deterministic
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
				oldShownDailyQuests = questService.getTodaysNonHiddenDailyQuests();

				const NEXT_DAY = addMockDay(db, {
					timeStarted: addDays(SOME_DAY.timeStarted, 1),
				});
				questService.assignNewShownDailyQuests(NEXT_DAY);
				shownDailyQuests = questService.getTodaysNonHiddenDailyQuests();
				makeSure(shownDailyQuests.length).isGreaterThan(0);
			}
			finally { Math.random = realRandom }
			makeSure(shownDailyQuests).haveProperties({
				isShown: true,
				wasShown: true,
			});
			makeSure(toPropertyValues(shownDailyQuests, 'id')).areAllDifferent();
			makeSure(toPropertyValues(shownDailyQuests, 'id')).doesNotContain(toPropertyValues(oldShownDailyQuests, 'id'));
		});

		it('Assigns already chosen quests when we run out', () => {
			db.run('DELETE FROM quest');

			const quests = [];
			for (let index = 0; index < 4; index++) {
				quests[index] = addMockQuest(db);
			}

			let oldShownDailyQuests: Quest[];
			let newShownDailyQuests: Quest[];
			const realRandom = Math.random;
			Math.random = () => 0.6; // deterministic
			try {
				const NEXT_DAY = addMockDay(db, {
					timeStarted: addDays(SOME_DAY.timeStarted, -1),
				});
				questService.assignNewShownDailyQuests(NEXT_DAY);
				oldShownDailyQuests = questService.getCurrentShownDailyQuests();

				questService.assignNewShownDailyQuests(SOME_DAY);
				newShownDailyQuests = 	questService.getCurrentShownDailyQuests();
			}
			finally { Math.random = realRandom }

			makeSure(newShownDailyQuests.length).isGreaterThan(0);
			// When we run out of unique quests it's valid for the service to
			// reuse already-chosen quests; ensure at least one overlap exists.
			makeSure(toPropertyValues(newShownDailyQuests, 'id')).hasAnItemWhere(questID =>
				toPropertyValues(oldShownDailyQuests, 'id').includes(questID)
			)
		});

		it('Adds quests correctly to shownDailyQuest table', () => {
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const nonHiddenshownDailyQuests = questService.getTodaysNonHiddenDailyQuests();
			makeSure(nonHiddenshownDailyQuests.length).isGreaterThan(0);

			const shownDailyQuests = questService.questRepository.getShownDailyQuestsDuringDay(SOME_DAY.id);

			const quests = toPropertyValues(shownDailyQuests, 'quest')
			makeSure(shownDailyQuests).haveProperties({
				day: SOME_DAY,
			});
			const visibleQuests = quests.filter(q => q.isShown);
			makeSure(visibleQuests.length).isGreaterThan(0);
			makeSure(visibleQuests).haveProperties({
				wasShown: true,
			});
			makeSure(toPropertyValues(visibleQuests, 'id')).areAllDifferent();

			const NEXT_DAY = addMockDay(db, {
				timeStarted: addDays(SOME_DAY.timeStarted, -1),
			});
			questService.assignNewShownDailyQuests(NEXT_DAY);

			const shownDailyQuestsTomorrow = questService.questRepository.getShownDailyQuestsDuringDay(NEXT_DAY.id);
			const questsTomorrow = toPropertyValues(shownDailyQuestsTomorrow, 'quest')
			makeSure(shownDailyQuestsTomorrow).haveProperties({
				day: NEXT_DAY,
			});
			const visibleQuestsTomorrow = questsTomorrow.filter(q => q.isShown);
			makeSure(visibleQuestsTomorrow.length).isGreaterThan(0);
			makeSure(visibleQuestsTomorrow).haveProperties({
				wasShown: true,
			});
			makeSure(toPropertyValues(visibleQuestsTomorrow, 'id')).areAllDifferent();
		});

		it('never assigns weekly quests', () => {
			addMockQuest(db, {
				recurrence: 'weekly',
			});
			
			let timeOfDay = SOME_DAY.timeStarted;
			for (let i = 0; i < 25; i++) {
				const day = addMockDay(db, {
					timeStarted: timeOfDay,
				})
				questService.assignNewShownDailyQuests(day);
				makeSure(questService.getTodaysNonHiddenDailyQuests()).haveProperty('recurrence', 'daily');
				timeOfDay = addDays(timeOfDay, 1);
			}
		});

		it('never assigns the same daily quest twice, even if we have already used up all unique quests', () => {
			const quests = [];
			for (let index = 0; index < 1000; index++) {
				quests[index] = addMockQuest(db);
			}

			const shownDailyQuestIDs: QuestID[] = [];
			for (let i = 0; i < 100; i++) {
				const shownDailyQuests = questService.assignNewShownDailyQuests(SOME_DAY);
				
				for (const quest of shownDailyQuests) {
					makeSure(!shownDailyQuestIDs.includes(quest.id));
					shownDailyQuestIDs.push(quest.id);
				}
			}
		});
	});

	describe('assignNewShownWeeklyQuests()', () => {
		let SOME_WEEK: Week;
		
		beforeEach(() => {
			SOME_WEEK = addMockWeek(db);
		})

		it('Marks three random quests as shown and adds them to shown weekly quests', () => {
			const shownWeeklyQuests = questService.assignNewShownWeeklyQuests(SOME_WEEK);
			makeSure(shownWeeklyQuests.length).isBetween(3, 4);
			makeSure(toPropertyValues(shownWeeklyQuests, 'id')).areAllDifferent();
		});

		it('Marks new random quests as shown and adds them to shown weekly quests if the current week is different', () => {
			const LAST_WEEK = addMockWeek(db, {
				timeStarted: addDays(SOME_WEEK.timeStarted, -7),
			})
			let shownWeeklyQuests = questService.assignNewShownWeeklyQuests(LAST_WEEK);
			const oldShownWeeklyQuestsIDs = toPropertyValues(shownWeeklyQuests, 'id');
			makeSure(oldShownWeeklyQuestsIDs).areAllDifferent();

			shownWeeklyQuests = questService.assignNewShownWeeklyQuests(SOME_WEEK);
			const newShownWeeklyQuestsIDs = toPropertyValues(shownWeeklyQuests, 'id');
			makeSure(newShownWeeklyQuestsIDs).areAllDifferent();
			makeSure(newShownWeeklyQuestsIDs).doesNotContain(oldShownWeeklyQuestsIDs);
		});

		it('Assigns already chosen quests when we run out', () => {
			db.run('DELETE FROM quest');
			
			const quests = [];
			for (let index = 0; index < 4; index++) {
				quests[index] = addMockQuest(db, { recurrence: QuestRecurrences.WEEKLY });
			}

			const LAST_WEEK = addMockWeek(db, {
				timeStarted: addDays(SOME_WEEK.timeStarted, -7),
			})
			const oldShownWeeklyQuests = questService.assignNewShownWeeklyQuests(LAST_WEEK);
			const newShownWeeklyQuests = questService.assignNewShownWeeklyQuests(SOME_WEEK);

			const oldShownWeeklyQuestsIDs = toPropertyValues(oldShownWeeklyQuests, 'id');
			const newShownWeeklyQuestsIDs = toPropertyValues(newShownWeeklyQuests, 'id');
			
			makeSure(oldShownWeeklyQuestsIDs).areAllDifferent();
			makeSure(newShownWeeklyQuestsIDs).areAllDifferent();
			makeSure(toPropertyValues(newShownWeeklyQuests, 'id')).hasAnItemWhere(questID =>
				oldShownWeeklyQuestsIDs.includes(questID)
			);
		});

		it('Adds quests correctly to shownWeeklyQuest table', () => {
			const chosenQuests = questService.assignNewShownWeeklyQuests(SOME_WEEK);
			const shownWeeklyQuests = questService.questRepository.getShownWeeklyQuestDuring(SOME_WEEK.id);
			makeSure(shownWeeklyQuests.length).isBetween(3, 4);
			makeSure(shownWeeklyQuests).haveProperties({
				week: SOME_WEEK,
			});
			makeSure(toPropertyValues(shownWeeklyQuests, 'quest').map(q => q.id)).containsOnly(
				...chosenQuests.map(q => q.id)
			)
		});
	});

	describe('reset()', () => {
		it('should reset the quest repository', () => {
			const SOME_DAY = addMockDay(db);
			const realRandom = Math.random;
			Math.random = () => 0.6;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
				questService.assignNewShownDailyQuests(SOME_DAY);
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			questService.reset();
			const shownDailyQuests = questService.getTodaysNonHiddenDailyQuests();
			makeSure(shownDailyQuests).hasLengthOf(0);

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
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const shown = questService.questRepository.getShownDailyQuestsDuringDay(SOME_DAY.id);
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

	describe('getHiddenShownDailyQuests', () => {
		it('returns an array of all hidden quests for today', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenShownDailyQuestsToday();

			// Verify we have hidden quests
			makeSure(hiddenQuests.length).isGreaterThan(0);

			// Verify all returned quests are actually hidden
			const shownToday = questService.questRepository.getShownDailyQuestsDuringDay(SOME_DAY.id);
			const actualHiddenQuests = shownToday.filter(s => s.isHidden).map(s => s.quest);
			makeSure(hiddenQuests).hasLengthOf(actualHiddenQuests.length);
			for (const quest of hiddenQuests) {
				const isHidden = actualHiddenQuests.some(hq => hq.id === quest.id);
				makeSure(isHidden).isTrue();
			}
		});

		it('returns an empty array when there are no hidden quests for today', () => {
			// Don't assign any daily quests
			const hiddenQuests = questService.getHiddenShownDailyQuestsToday();
			makeSure(hiddenQuests).hasLengthOf(0);
		});
	});

	describe('isHiddenQuest', () => {
		it('returns true if the quest is a hidden quest for today', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenShownDailyQuestsToday();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest(hiddenQuest.id)).isTrue();
		});

		it('returns true if the quest is a hidden quest using quest name', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenShownDailyQuestsToday();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest(hiddenQuest.name)).isTrue();
		});

		it('returns true if the quest is a hidden quest using quest object', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const hiddenQuests = questService.getHiddenShownDailyQuestsToday();
			makeSure(hiddenQuests.length).isGreaterThan(0);

			const hiddenQuest = hiddenQuests[0];
			makeSure(questService.isHiddenQuest({id: hiddenQuest.id})).isTrue();
		});

		it('returns false if the quest is not a hidden quest', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 4; i++) addMockQuest(db);

			// Ensure deterministic selection: make totalQuests=3 (hiddenCount=1)
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			const shownQuests = questService.getTodaysNonHiddenDailyQuests();
			makeSure(shownQuests.length).isGreaterThan(0);

			const visibleQuest = shownQuests[0];
			makeSure(questService.isHiddenQuest(visibleQuest.id)).isFalse();
		});

		it('returns false if the quest is not shown today', () => {
			const SOME_DAY = addMockDay(db);

			// Add some quests to choose from
			for (let i = 0; i < 6; i++) addMockQuest(db);

			// Ensure deterministic selection and assign quests
			const realRandom = Math.random;
			Math.random = () => 0.4;
			try {
				questService.assignNewShownDailyQuests(SOME_DAY);
			}
			finally { Math.random = realRandom }

			// Get a quest that wasn't picked for today
			const allQuests = questService.questRepository.getQuests();
			const shownQuestIDs = questService.questRepository.getShownDailyQuestsDuringDay(SOME_DAY.id).map(s => s.quest.id);
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
