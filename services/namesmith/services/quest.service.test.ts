import { QuestService } from "./quest.service";
import { Quest, RewardTypes } from '../types/quest.types';
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { DatabaseQuerier } from "../database/database-querier";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_QUEST_NAME } from "../constants/test.constants";
import { PlayerNotFoundError, QuestEligbilityNotImplementedError, QuestNotFoundError } from "../utilities/error.utility";
import { Player } from "../types/player.types";
import { addMockPlayer, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from "../mocks/mock-data/mock-players";
import { Quests } from "../constants/quests.constants";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { addMockRecipe, forcePlayerToCraft } from "../mocks/mock-data/mock-recipes";
import { Recipe } from "../types/recipe.types";
import { forcePlayerToAcceptNewTrade, forcePlayerToInitiateTrade } from "../mocks/mock-data/mock-trades";
import { getBetween, getRandomUUID } from "../../../utilities/random-utils";
import { forcePlayerToBuyNewMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";
import { PlayerService } from "./player.service";

describe('QuestService', () => {
	let db: DatabaseQuerier;
	let questService: QuestService;
	let playerService: PlayerService;

	let SOME_QUEST: Quest;
	let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
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

		SOME_OTHER_PLAYER = THREE_DIFFERENT_PLAYERS[0];
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

	describe('isPlayerEligibleToComplete()', () => {
		describe('Experienced Craftsman', () => {
			it('return true for Experienced Craftsman quest if player has crafted characters five times with three unique recipes', () => {
				for (let numLoop = 0; numLoop < 5; numLoop++) {
					const recipeNum = numLoop % 3; // Only 3 unique recipes
					forcePlayerToCraft(
						SOME_PLAYER,
						FIVE_DIFFERENT_RECIPES[recipeNum]
					)
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.EXPERIENCED_CRAFTSMAN.id
					)
				).isTrue();
			});

			it('return false for Experienced Craftsman quest if player has crafted characters five times with only two unique recipes', () => {
				for (let numLoop = 0; numLoop < 5; numLoop++) {
					const recipeNum = numLoop % 2; // Only 2 unique recipes
					forcePlayerToCraft(
						SOME_PLAYER,
						FIVE_DIFFERENT_RECIPES[recipeNum]
					)
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.EXPERIENCED_CRAFTSMAN.id
					)
				).isFalse();
			});

			it('return false for Experienced Craftsman quest if player has crafted characters only four times with three unique recipes', () => {
				for (let numLoop = 0; numLoop < 4; numLoop++) {
					const recipeNum = numLoop % 3; // Only 3 unique recipes
					forcePlayerToCraft(
						SOME_PLAYER,
						FIVE_DIFFERENT_RECIPES[recipeNum]
					)
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.EXPERIENCED_CRAFTSMAN.id
					)
				).isFalse();
			});
		});

		describe('Diverse Name', () => {
			it('return true for Diverse Name quest if player has published a name with at 3 emojis, 3 letters, and 3 symbols', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'abc!#%🔥🎉😨');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.DIVERSE_NAME.id
					)
				).isTrue();
			});

			it('return true for Diverse Name quest if player has published a name with 1 emoji, 1 letter, and 1 symbol', () => {
				forcePlayerToPublishName(SOME_PLAYER, '😅x=');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.DIVERSE_NAME.id
					)
				).isTrue();
			});

			it('returns false for Diverse Name quest if player has published a name with a letter and symbol but no emojis', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'I l0ve emojis! :D');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.DIVERSE_NAME.id
					)
				).isFalse();
			});

			it('returns false for Diverse Name quest if player has published a name with an emoji and letter but no symbols', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'I ❤️ Symbols');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.DIVERSE_NAME.id
					)
				).isFalse();
			});

			it('returns false for Diverse Name quest if player has published a name with an emoji and symbol but no letters', () => {
				forcePlayerToPublishName(SOME_PLAYER, '| ❤️ |𝑒ττ𝑒ℛ∫');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.DIVERSE_NAME.id
					)
				).isFalse();
			});
		})

		describe('Trade Diplomat', () => {
			it('return true for Trade Diplomat quest if player\'s trade were accepted by 3 different players', () => {
				for (let numLoop = 0; numLoop < 3; numLoop++) {
					const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
					forcePlayerToAcceptNewTrade(otherPlayer, {
						initiatingPlayer: SOME_PLAYER,
					});
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TRADE_DIPLOMAT.id
					)
				).isTrue();
			});

			it('return false for Trade Diplomat quest if player\'s trade were accepted by only 2 different players', () => {
				for (let numLoop = 0; numLoop < 2; numLoop++) {
					const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
					forcePlayerToAcceptNewTrade(otherPlayer, {
						initiatingPlayer: SOME_PLAYER,
					});
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TRADE_DIPLOMAT.id
					)
				).isFalse();
			});

			it('return false for Trade Diplomat quest if player\'s trade were accepted by only 2 different players and not yet accepted by another trade', () => {
				for (let numLoop = 0; numLoop < 2; numLoop++) {
					const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
					forcePlayerToAcceptNewTrade(otherPlayer, {
						initiatingPlayer: SOME_PLAYER,
					});
				}

				forcePlayerToInitiateTrade(SOME_PLAYER, {
					recipientPlayer: THREE_DIFFERENT_PLAYERS[2],
				});

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TRADE_DIPLOMAT.id
					)
				).isFalse();
			});

			it('return false for Trade Diplomat quest if player only accepted trades from 3 different players', () => {
				for (let numLoop = 0; numLoop < 3; numLoop++) {
					const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: otherPlayer,
					});
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TRADE_DIPLOMAT.id
					)
				).isFalse();
			});
		})

		describe('Twinsies Quest', () => {
			it('returns true for Twinsies quest if player has same published name as someone else and it\'s over 6 characters', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
				forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TWINSIES.id
					)
				).isTrue();
			});

			it('returns false for Twinsies quest if player has same published name as someone else but it\'s only 6 characters', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'SixsiX');
				forcePlayerToPublishName(SOME_OTHER_PLAYER, 'SixsiX');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TWINSIES.id
					)
				).isFalse();
			});

			it('returns false for Twinsies quest if player does not have the same published name as someone else even though its over 6 characters', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
				forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies but different');

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.TWINSIES.id
					)
				).isFalse();
			});
		});

		describe('Get Rich Quickly Quest', () => {
			it('returns true for Get Rich Quickly quest if player has mined 1000 tokens', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 1000);
				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.GET_RICH_QUICK.id
					)
				).isTrue();
			});

			it('return true for Get Rich Quickly quest if player has mined 1000 tokens through many different mines', () => {
				for (let numLoop = 0; numLoop < 10; numLoop++) {
					forcePlayerToMineTokens(SOME_PLAYER,
						getBetween(100, 1000)
					);
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.GET_RICH_QUICK.id
					)
				).isTrue();
			});

			it('return true for Get Rich Quickly quest if player has gained 1000 tokens through different methods', () => {
				for (let numLoop = 0; numLoop < 5; numLoop++) {
					forcePlayerToClaimRefill(SOME_PLAYER,
						getBetween(100, 1000)
					);
					forcePlayerToMineTokens(SOME_PLAYER,
						getBetween(100, 1000)
					);
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.GET_RICH_QUICK.id
					)
				).isTrue();
			});

			it('return true for Get Rich Quickly quest even if player has lost the tokens they gained', () => {
				for (let numLoop = 0; numLoop < 5; numLoop++) {
					forcePlayerToClaimRefill(SOME_PLAYER,
						getBetween(100, 1000)
					);
					forcePlayerToMineTokens(SOME_PLAYER,
						getBetween(100, 1000)
					);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: getBetween(200, 1000),
					});
				}

				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.GET_RICH_QUICK.id
					)
				).isTrue();
			});

			it('return false for Get Rich Quickly quest if player has only earned 999 tokens', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 499);
				forcePlayerToClaimRefill(SOME_PLAYER, 500);
				makeSure(
					questService.isPlayerEligibleToComplete(
						SOME_PLAYER.id,
						Quests.GET_RICH_QUICK.id
					)
				).isFalse();
			})
		});

		it('throws a QuestEligbilityNotImplementedError if the given quest does not have an implementation for verifying eligibility for its completion', () => {
			makeSure(() => {
				questService.isPlayerEligibleToComplete(
					SOME_PLAYER.id,
					SOME_QUEST.id
				);
			}).throws(QuestEligbilityNotImplementedError);
		});

		it('throws a PlayerNotFoundError if the player does not exist', () => {
			makeSure(() => {
				questService.isPlayerEligibleToComplete(
					INVALID_PLAYER_ID,
					SOME_QUEST.id
				);
			}).throws(PlayerNotFoundError);
		});

		it('throws a QuestNotFoundError if the quest does not exist', () => {
			makeSure(() => {
				questService.isPlayerEligibleToComplete(
					SOME_PLAYER.id,
					INVALID_QUEST_ID
				);
			}).throws(QuestNotFoundError);
		});

		it('should return true for the test freebie quest', () => {
			const freebieQuest = addMockQuest(db, {
				name: FREEBIE_QUEST_NAME + getRandomUUID()
			})

			makeSure(
				questService.isPlayerEligibleToComplete(
					SOME_PLAYER.id,
					freebieQuest
				)
			).isTrue();
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
