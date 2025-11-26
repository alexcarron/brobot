import { makeSure } from "../../../../utilities/jest/jest-utils";
import { getBetween, getRandomUUID } from "../../../../utilities/random-utils";
import { Quests } from "../../constants/quests.constants";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { forcePlayerToBuyNewMysteryBox } from "../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from '../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraft } from '../../mocks/mock-data/mock-recipes';
import { forcePlayerToAcceptNewTrade, forcePlayerToInitiateTrade } from '../../mocks/mock-data/mock-trades';
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { ActivityLogService } from "../../services/activity-log.service";
import { PlayerService } from "../../services/player.service";
import { Player } from "../../types/player.types";
import { Quest } from "../../types/quest.types";
import { Recipe } from '../../types/recipe.types';
import { assertNotFailure, returnIfNotFailure } from "../../utilities/workflow.utility";
import { completeQuest } from "./complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;
	let activityLogService: ActivityLogService;
	let playerService: PlayerService;

  let SOME_QUEST: Quest;
  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];

  beforeEach(() => {
    ({ db, activityLogService, playerService } = setupMockNamesmith());
    SOME_PLAYER = addMockPlayer(db, {});
    SOME_QUEST = addMockQuest(db, {
			name: FREEBIE_QUEST_NAME + getRandomUUID()
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

  describe('completeQuest()', () => {
		it('should give the rewards of the quest to the player', () => {
			const questWithRewards = addMockQuest(db, {
				name: FREEBIE_QUEST_NAME + getRandomUUID(),
				tokensReward: 28,
				charactersReward: 'Abc34#🔥',
			});

			assertNotFailure(
				completeQuest({
					playerResolvable: SOME_PLAYER,
					questResolvable: questWithRewards
				})
			);

			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.tokens).is(SOME_PLAYER.tokens + 28);
			makeSure(resolvedPlayer.inventory).is(SOME_PLAYER.inventory + 'Abc34#🔥');
		});

    it('should log the quest as completed in the activity log', () => {
      const activityLogSpy = jest.spyOn(activityLogService, 'logCompleteQuest');

      completeQuest({ playerResolvable: SOME_PLAYER, questResolvable: SOME_QUEST });

      makeSure(activityLogSpy).toHaveBeenCalledWith({
        playerCompletingQuest: SOME_PLAYER,
        questCompleted: SOME_QUEST,
      });
    });

    it('should return a success result if the player successfully completes the quest', () => {
      const result = returnIfNotFailure(
				completeQuest({ playerResolvable: SOME_PLAYER, questResolvable: SOME_QUEST })
			);

      makeSure(result.isFailure()).isFalse();
			makeSure(result.player.id).is(SOME_PLAYER.id);
			makeSure(result.quest.id).is(SOME_QUEST.id);
    });

    it('should return nonPlayer failure if the player does not exist', () => {
      const result = completeQuest({
				playerResolvable: INVALID_PLAYER_ID,
				questResolvable: SOME_QUEST
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isNotAPlayer()).isTrue();
    });

    it('should return questDoesNotExist failure if the quest does not exist', () => {
      const result = completeQuest({
				playerResolvable: SOME_PLAYER,
				questResolvable: INVALID_QUEST_ID
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isQuestDoesNotExist()).isTrue();
    });

    it('should return playerAlreadyCompletedQuest failure if the player has already completed the quest', () => {
			// First complete the quest once
			completeQuest({ playerResolvable: SOME_PLAYER, questResolvable: SOME_QUEST });

			// Try to complete the same quest again
      const result = completeQuest({
				playerResolvable: SOME_PLAYER,
				questResolvable: SOME_QUEST
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isAlreadyCompletedQuest()).isTrue();
    });

		it('should return QuestCriteriaNotDefined failure if the given quest has no meets criteria function defined', () => {
			const newQuest = addMockQuest(db, {
				name: "Quest without a criteria function",
			});

			const result = completeQuest({
				playerResolvable: SOME_PLAYER,
				questResolvable: newQuest,
			});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isQuestCriteriaNotDefined()).isTrue();
			if (result.isQuestCriteriaNotDefined()) {
				makeSure(result.questName).is(newQuest.name);
			}
		});

		describe('Quest criteria functions', () => {
			describe('Experienced Craftsman', () => {
				it('returns success for Experienced Craftsman quest if player has crafted characters five times with three unique recipes', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						const recipeNum = numLoop % 3; // Only 3 unique recipes
						forcePlayerToCraft(
							SOME_PLAYER,
							FIVE_DIFFERENT_RECIPES[recipeNum]
						)
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER,
							questResolvable: Quests.EXPERIENCED_CRAFTSMAN
						}).isFailure()
					).isFalse();
				});

				it('returns NotEnoughUniqueRecipes failure for Experienced Craftsman quest if player has crafted characters five times with only two unique recipes', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						const recipeNum = numLoop % 2; // Only 2 unique recipes
						forcePlayerToCraft(
							SOME_PLAYER,
							FIVE_DIFFERENT_RECIPES[recipeNum]
						)
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.EXPERIENCED_CRAFTSMAN.id
						}).isNotEnoughUniqueRecipes()
					).isTrue();
				});

				it('returns NotEnoughCrafts failure for Experienced Craftsman quest if player has crafted characters only four times with three unique recipes', () => {
					for (let numLoop = 0; numLoop < 4; numLoop++) {
						const recipeNum = numLoop % 3; // Only 3 unique recipes
						forcePlayerToCraft(
							SOME_PLAYER,
							FIVE_DIFFERENT_RECIPES[recipeNum]
						)
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.EXPERIENCED_CRAFTSMAN.id
						}).isNotEnoughCrafts()
					).isTrue();
				});
			});

			describe('Diverse Name', () => {
				it('returns success for Diverse Name quest if player has published a name with at 3 emojis, 3 letters, and 3 symbols', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'abc!#%🔥🎉😨');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns success for Diverse Name quest if player has published a name with 1 emoji, 1 letter, and 1 symbol', () => {
					forcePlayerToPublishName(SOME_PLAYER, '😅x=');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns NameHasNoEmojis failure for Diverse Name quest if player has published a name with a letter and symbol but no emojis', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'I l0ve emojis! :D');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isNameHasNoEmojis()
					).isTrue();
				});

				it('returns NameHasNoSymbols failure for Diverse Name quest if player has published a name with an emoji and letter but no symbols', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'I ❤️ Symbols');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isNameHasNoSymbols()
					).isTrue();
				});

				it('returns NameHasNoLetters failure for Diverse Name quest if player has published a name with an emoji and symbol but no letters', () => {
					forcePlayerToPublishName(SOME_PLAYER, '| ❤️ |𝑒ττ𝑒ℛ∫');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isNameHasNoLetters()
					).isTrue();
				});
			})

			describe('Trade Diplomat', () => {
				it('returns success for Trade Diplomat quest if player\'s trade were accepted by 3 different players', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToAcceptNewTrade(otherPlayer, {
							initiatingPlayer: SOME_PLAYER,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isFailure()
					).isFalse();
				});

				it('returns NotEnoughUniquePlayersAccepted failure for Trade Diplomat quest if player\'s three accepted trades were accepted by only 2 different players', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop % 2];
						forcePlayerToAcceptNewTrade(otherPlayer, {
							initiatingPlayer: SOME_PLAYER,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isNotEnoughUniquePlayersAccepted()
					).isTrue();
				});

				it('returns NotEnoughTradesMade failure for Trade Diplomat quest if player\'s trades were accepted by only 2 different players and another one was not yet accepted', () => {
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
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isNotEnoughTradesMade()
					).isTrue();
				});

				it('returns NotEnoughTradesMade failure for Trade Diplomat quest if player accepted trades but did not have trades they created accepted', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToAcceptNewTrade(SOME_PLAYER, {
							initiatingPlayer: otherPlayer,
						});
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isNotEnoughTradesMade()
					).isTrue();
				});
			})

			describe('Twinsies Quest', () => {
				it('returns true for Twinsies quest if player has same published name as someone else and it\'s over 6 characters', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
					forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TWINSIES.id
						}).isFailure()
					).isFalse();
				});

				it('returns NameTooShort failure for Twinsies quest if player has same published name as someone else but it\'s only 6 characters', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'SixsiX');
					forcePlayerToPublishName(SOME_OTHER_PLAYER, 'SixsiX');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TWINSIES.id
						}).isNameTooShort()
					).isTrue();
				});

				it('returns NameNotSharedByAnyone failure for Twinsies quest if player does not have the same published name as someone else even though its over 6 characters', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
					forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies but different');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TWINSIES.id
						}).isNameNotSharedByAnyone()
					).isTrue();
				});
			});

			describe('Get Rich Quickly Quest', () => {
				it('returns true for Get Rich Quickly quest if player has mined 1000 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1000);
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isFailure()
					).isFalse();
				});

				it('returns success for Get Rich Quickly quest if player has mined 1000 tokens through many different mines', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER,
							getBetween(100, 1000)
						);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isFailure()
					).isFalse();
				});

				it('returns success for Get Rich Quickly quest if player has gained 1000 tokens through different methods', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToClaimRefill(SOME_PLAYER,
							getBetween(100, 1000)
						);
						forcePlayerToMineTokens(SOME_PLAYER,
							getBetween(100, 1000)
						);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isFailure()
					).isFalse();
				});

				it('returns success for Get Rich Quickly quest even if player has lost the tokens they gained', () => {
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
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isFailure()
					).isFalse();
				});

				it('returns failure for Get Rich Quickly quest if player has only earned 999 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 499);
					forcePlayerToClaimRefill(SOME_PLAYER, 500);
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isNotEnoughTokensEarned()
					).isTrue();
				})
			});
		});
  });
});