import { QuestService } from "./quest.service";
import { Quest, RewardTypes } from '../types/quest.types';
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
	})
});
