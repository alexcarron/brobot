import { addHours, addMinutes } from "../../../../utilities/date-time-utils";
import { failTest, makeSure } from "../../../../utilities/jest/jest-utils";
import { getBetween, getRandomUUID } from "../../../../utilities/random-utils";
import { Quests } from "../../constants/quests.constants";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { getLatestActivityLog } from "../../mocks/mock-data/mock-activity-logs";
import { forcePlayerToBuyNewMysteryBox } from "../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToChangeName, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from '../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraft } from '../../mocks/mock-data/mock-recipes';
import { forcePlayerToAcceptNewTrade, forcePlayerToInitiateTrade } from '../../mocks/mock-data/mock-trades';
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { GameStateService } from "../../services/game-state.service";
import { PlayerService } from "../../services/player.service";
import { ActivityTypes } from "../../types/activity-log.types";
import { Player } from "../../types/player.types";
import { Quest } from "../../types/quest.types";
import { Recipe } from '../../types/recipe.types';
import { throwIfNotFailure, returnIfNotFailure } from "../../utilities/workflow.utility";
import { completeQuest } from "./complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;
	let playerService: PlayerService;
	let gameStateService: GameStateService;

  let SOME_QUEST: Quest;
  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];

  beforeEach(() => {
    ({ db, playerService, gameStateService } = setupMockNamesmith(addMinutes(new Date(), -1)));
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
		it('creates an activity log with accurate metadata', () => {
			const namedPlayer = addMockPlayer(db, { currentName: 'SOME_NAME' });

			const questWithRewards = addMockQuest(db, {
				name: FREEBIE_QUEST_NAME + getRandomUUID(),
				tokensReward: 28,
				charactersReward: 'Abc34#🔥',
			});

			throwIfNotFailure(
				completeQuest({
					playerResolvable: namedPlayer,
					questResolvable: questWithRewards
				})
			);

			const activityLog = getLatestActivityLog(db);
			makeSure(activityLog.player.id).is(namedPlayer.id);
			makeSure(activityLog.type).is(ActivityTypes.COMPLETE_QUEST);
			makeSure(activityLog.nameChangedFrom).is('SOME_NAME');
			makeSure(activityLog.currentName).is('SOME_NAME' + 'Abc34#🔥');
			makeSure(activityLog.tokensDifference).is(28);
			makeSure(activityLog.charactersGained).is('Abc34#🔥');
			makeSure(activityLog.charactersLost).isNull();
			makeSure(activityLog.involvedQuest!.id).is(questWithRewards.id);
		});

		it('should give the rewards of the quest to the player', () => {
			const questWithRewards = addMockQuest(db, {
				name: FREEBIE_QUEST_NAME + getRandomUUID(),
				tokensReward: 28,
				charactersReward: 'Abc34#🔥',
			});

			throwIfNotFailure(
				completeQuest({
					playerResolvable: SOME_PLAYER,
					questResolvable: questWithRewards
				})
			);

			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.tokens).is(SOME_PLAYER.tokens + 28);
			makeSure(resolvedPlayer.inventory).is(SOME_PLAYER.inventory + 'Abc34#🔥');
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
						}).isQuestCriteriaNotMet()
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
						}).isQuestCriteriaNotMet()
					).isTrue();
				});
			});

			describe('Diverse Name', () => {
				it('returns success for Diverse Name quest if player has published a name with at 3 numbers, 3 letters, and 3 symbols', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'abc!#%123');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns success for Diverse Name quest if player has published a name with 1 number, 1 letter, and 1 symbol', () => {
					forcePlayerToPublishName(SOME_PLAYER, '0x=');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DIVERSE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns NameNeedsMoreCharactersOfType failure for Diverse Name quest if player has published a name with a letter and symbol but no numbers', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'I l⭕ve numbers! :D');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DIVERSE_NAME.id
					});

					if (result.isQuestCriteriaNotMet() === false)
						failTest('Expected result to be NameNeedsMoreCharactersOfType failure, but was not');
				});

				it('returns NameHasNoSymbols failure for Diverse Name quest if player has published a name with a number and letter but no symbols', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'I 3 Symbols');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DIVERSE_NAME.id
					});

					if (result.isQuestCriteriaNotMet() === false)
						failTest('Expected result to be NameNeedsMoreCharactersOfType failure, but was not');
				});

				it('returns NameHasNoLetters failure for Diverse Name quest if player has published a name with a number and symbol but no letters', () => {
					forcePlayerToPublishName(SOME_PLAYER, '| 3 |𝑒ττ𝑒ℛ∫');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DIVERSE_NAME.id
					});

					if (result.isQuestCriteriaNotMet() === false)
						failTest('Expected result to be NameNeedsMoreCharactersOfType failure, but was not');
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

				it('returns NotEnoughTradesMade failure for Trade Diplomat quest if player\'s trades were not yet accepted', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						const otherPlayer = THREE_DIFFERENT_PLAYERS[numLoop];
						forcePlayerToInitiateTrade(SOME_PLAYER, {
							recipientPlayer: otherPlayer,
						});
					}


					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TRADE_DIPLOMAT.id
						}).isQuestCriteriaNotMet()
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
						}).isQuestCriteriaNotMet()
					).isTrue();
				});
			})

			describe('Twinsies Quest', () => {
				it('returns success for Twinsies quest if player has same published name as someone else and it\'s over 6 characters', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
					forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TWINSIES.id
						}).isFailure()
					).isFalse();
				});

				it('returns NameNotSharedByAnyone failure for Twinsies quest if player does not have the same published name as someone else even though its over 6 characters', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Twinsies');
					forcePlayerToPublishName(SOME_OTHER_PLAYER, 'Twinsies but different');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.TWINSIES.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				});
			});

			describe('Get Rich Quickly Quest', () => {
				it('returns success for Get Rich Quickly quest if player has mined 200 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 200);
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

				it('returns failure for Get Rich Quickly quest if player has only earned 199 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 99);
					forcePlayerToClaimRefill(SOME_PLAYER, 100);
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.GET_RICH_QUICK.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				})
			});

			describe('Echoed Name Quest', () => {
				it('returns success for Echoed Name quest if player has changed their name to a repeated version of itself', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'Echo');
					forcePlayerToChangeName(SOME_PLAYER, 'EchoEcho');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ECHOED_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns failure for Echoed Name quest if player has not changed their name to a repeated version of itself', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'Echo');
					forcePlayerToChangeName(SOME_PLAYER, 'Echo Echo');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ECHOED_NAME.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				});

				it('returns failure for Echoed Name quest if player has not changed their name at all', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ECHOED_NAME.id
						}).isQuestCriteriaNotMet()
					).isTrue();
				});
			});

			describe('Identity Theft Quest', () => {
				let START_OF_TODAY: Date;
				let BEFORE_TWO_HOUR_INTERVAL: Date;
				let AFTER_TWO_HOUR_INTERVAL: Date;
				let NOW: Date;

				let NAMED_PLAYER: Player;
				let OTHER_NAMED_PLAYER: Player;

				beforeEach(() => {
					NOW = new Date();
					START_OF_TODAY = gameStateService.getStartOfTodayOrThrow(NOW);

					BEFORE_TWO_HOUR_INTERVAL = addHours(START_OF_TODAY, 5);
					AFTER_TWO_HOUR_INTERVAL = addHours(START_OF_TODAY, 7);

					NAMED_PLAYER = addMockPlayer(db, {
						currentName: 'Player Name'
					});

					OTHER_NAMED_PLAYER = addMockPlayer(db, {
						currentName: 'Other Player Name'
					});

					jest.useFakeTimers({ now: NOW });
				});

				afterEach(() => {
					jest.useRealTimers();
				});

				it('returns a success when the player has shared the same name as another player the entire day', () => {
					addMockPlayer(db, {
						currentName: NAMED_PLAYER.currentName
					});

					makeSure(
						completeQuest({
							playerResolvable: NAMED_PLAYER.id,
							questResolvable: Quests.IDENTITY_THEFT.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success when the player and other player has changed their name to the same name without changing it again for exactly 2 hours', () => {
					jest.setSystemTime(BEFORE_TWO_HOUR_INTERVAL);
					forcePlayerToChangeName(NAMED_PLAYER, "Shared Name");
					forcePlayerToChangeName(OTHER_NAMED_PLAYER, "Shared Name");

					jest.setSystemTime(AFTER_TWO_HOUR_INTERVAL);
					forcePlayerToChangeName(NAMED_PLAYER, "Player Name");
					forcePlayerToChangeName(OTHER_NAMED_PLAYER, "Other Player Name");

					makeSure(
						completeQuest({
							playerResolvable: NAMED_PLAYER.id,
							questResolvable: Quests.IDENTITY_THEFT.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure when the player and other player has changed their name to the same name without changing it again for 1 hour and 59 minutes hours', () => {
					jest.setSystemTime(BEFORE_TWO_HOUR_INTERVAL);
					forcePlayerToChangeName(NAMED_PLAYER, "Shared Name");
					forcePlayerToChangeName(OTHER_NAMED_PLAYER, "Shared Name");

					jest.setSystemTime(
						addMinutes(AFTER_TWO_HOUR_INTERVAL, -1)
					);
					forcePlayerToChangeName(NAMED_PLAYER, "Player Name");
					forcePlayerToChangeName(OTHER_NAMED_PLAYER, "Other Player Name");

					makeSure(
						completeQuest({
							playerResolvable: NAMED_PLAYER.id,
							questResolvable: Quests.IDENTITY_THEFT.id
						}).isFailure()
					).isTrue();
				});
			});

			describe('Fragile Name Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: NOW });
				});

				afterEach(() => {
					jest.useRealTimers();
				});

				it('return success if player does absolutely nothing', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.FRAGILE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('return success if player changes their name every hour except for an exact 8 hour gap', () => {
					for (let numLoop = 0; numLoop < 24; numLoop++) {
						// Skip the exact 8 hour gap
						if (numLoop > 8 && numLoop < 16)
							continue;

						jest.setSystemTime(addHours(NOW, numLoop));
						forcePlayerToChangeName(SOME_PLAYER, `Name ${numLoop}`);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.FRAGILE_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('return failure if player changes their name every hour except for a 7 hour and 59 minute gap', () => {
					for (let numLoop = 0; numLoop < 24; numLoop++) {
						if (numLoop > 8 && numLoop < 15)
							continue;

						let timeToChange = addHours(NOW, numLoop);
						if (numLoop === 15)
							timeToChange = addMinutes(timeToChange, -1);

						jest.setSystemTime(timeToChange);
						forcePlayerToChangeName(SOME_PLAYER, `Name ${numLoop}`);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.FRAGILE_NAME.id
						}).isFailure()
					).isTrue();
				})
			});

			describe('Hour of Silence Quest', () => {
				it('return success if everyone does absolutely nothing', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HOUR_OF_SILENCE.id
						}).isFailure()
					).isFalse();
				});

				it('return success if everyone changes their name every hour', () => {
					jest.useFakeTimers({ now: new Date() });

					const ANOTHER_PLAYER = addMockPlayer(db);
					for (let numLoop = 0; numLoop < 24; numLoop++) {
						jest.setSystemTime(addHours(new Date(), 1));
						forcePlayerToChangeName(SOME_PLAYER, `Name ${numLoop}`);
						forcePlayerToChangeName(ANOTHER_PLAYER, `Name ${numLoop}`);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HOUR_OF_SILENCE.id
						}).isFailure()
					).isFalse();

					jest.useRealTimers();
				});

				it('return failure if a single person changes their name every 59 minutes', () => {
					jest.useFakeTimers({ now: new Date() });
					forcePlayerToChangeName(SOME_PLAYER, `Name 0`);
					for (let numLoop = 1; numLoop <= 24; numLoop++) {
						jest.setSystemTime(addMinutes(new Date(), 59));
						forcePlayerToChangeName(SOME_PLAYER, `Name ${numLoop}`);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HOUR_OF_SILENCE.id
						}).isFailure()
					).isTrue();

					jest.useRealTimers();
				});
			});

			describe('Even Number Name Quest', () => {
				it('returns a success if the player has published a name with a 2 in it', () => {
					forcePlayerToPublishName(SOME_PLAYER, "abcdefhj2iojfklsf");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.EVEN_NUMBER_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player has published name with only odd numbers', () => {
					forcePlayerToPublishName(SOME_PLAYER, "13579951");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.EVEN_NUMBER_NAME.id
						}).isFailure()
					).isTrue();
				});

				it('returns a failure if the player has never published a name', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.EVEN_NUMBER_NAME.id
						}).isFailure()
					).isTrue();
				});
			})
		});
  });
});