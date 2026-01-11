import { addDuration, addHours, addMinutes, addSeconds } from "../../../../utilities/date-time-utils";
import { failTest, makeSure } from "../../../../utilities/jest/jest-utils";
import { getBetween, getRandomUUID } from "../../../../utilities/random-utils";
import { REFILL_COOLDOWN_HOURS } from "../../constants/namesmith.constants";
import { Quests } from "../../constants/quests.constants";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { getLatestActivityLog } from "../../mocks/mock-data/mock-activity-logs";
import { forcePlayerToBuyMysteryBox, forcePlayerToBuyNewMysteryBox } from "../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToChangeName, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from '../../mocks/mock-data/mock-players';
import { addMockQuest, forcePlayerToCompleteNewQuest } from "../../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraftRecipe, forcePlayerToCraftNewRecipe } from '../../mocks/mock-data/mock-recipes';
import { forcePlayerToAcceptNewTrade, forcePlayerToAcceptTrade, forcePlayerToDeclineNewTrade, forcePlayerToDeclineTrade, forcePlayerToInitiateTrade, forcePlayerToModifyNewTrade } from '../../mocks/mock-data/mock-trades';
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { GameStateService } from "../../services/game-state.service";
import { MysteryBoxService } from "../../services/mystery-box.service";
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
	let mysteryBoxService: MysteryBoxService;
	let gameStateService: GameStateService;

  let SOME_QUEST: Quest;
  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];

  beforeEach(() => {
    ({ db, playerService, gameStateService, mysteryBoxService } = setupMockNamesmith(addMinutes(new Date(), -1)));
    SOME_PLAYER = addMockPlayer(db, {});
    SOME_QUEST = addMockQuest(db, {
			name: FREEBIE_QUEST_NAME + getRandomUUID()
		});

		FIVE_DIFFERENT_RECIPES = [];
		for (let i = 0; i < 5; i++) {
			FIVE_DIFFERENT_RECIPES[i] = addMockRecipe(db);
		}

		THREE_DIFFERENT_PLAYERS = [];
		FIVE_DIFFERENT_PLAYERS = [];
		for (let i = 0; i < 5; i++) {
			if (i < 3) {
				THREE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
			}

			FIVE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
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
						forcePlayerToCraftRecipe(
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
						forcePlayerToCraftRecipe(
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
						forcePlayerToCraftRecipe(
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
			});

			describe('Distinct Dozen Quest', () => {
				it('returns a success if the player publishes a name with 16 distinct characters that each repeat twice', () => {
					forcePlayerToPublishName(SOME_PLAYER, "aabbccddeeffgghhiijjkkllmmnnoopp");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DISTINCT_DOZEN.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player publishes a name with exactly 12 distinct characters without repeats', () => {
					forcePlayerToPublishName(SOME_PLAYER, "abcdefghijkl");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DISTINCT_DOZEN.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player publishes a name with exactly 11 distinct characters with repeats', () => {
					forcePlayerToPublishName(SOME_PLAYER, "aabbccddeeffgghhiijjkk");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DISTINCT_DOZEN.id
						}).isFailure()
					).isTrue();
				});

				it('returns a failure if the player publishes a name with exactly 11 distinct characters without repeats', () => {
					forcePlayerToPublishName(SOME_PLAYER, "abcdefghijk");

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DISTINCT_DOZEN.id
						}).isFailure()
					).isTrue();
				});

				it('returns a failure if the player never publishes a name', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.DISTINCT_DOZEN.id
						}).isFailure()
					).isTrue();
				});
			});

			describe('High Yield Quest', () => {
				it('returns a success if the player got 10 tokens from a mine', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 10);

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HIGH_YIELD.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player got 5 tokens from a mine at least once', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_PLAYER, 3);
					forcePlayerToMineTokens(SOME_PLAYER, 5);
					forcePlayerToMineTokens(SOME_PLAYER, 2);
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_PLAYER, 2);

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HIGH_YIELD.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player got 4 tokens from a mine at the most', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_PLAYER, 3);
					forcePlayerToMineTokens(SOME_PLAYER, 4);
					forcePlayerToMineTokens(SOME_PLAYER, 2);
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_PLAYER, 4);
					forcePlayerToMineTokens(SOME_PLAYER, 4);
					forcePlayerToMineTokens(SOME_PLAYER, 2);
					forcePlayerToMineTokens(SOME_PLAYER, 4);
					forcePlayerToMineTokens(SOME_PLAYER, 4);
					forcePlayerToMineTokens(SOME_PLAYER, 4);

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HIGH_YIELD.id
						}).isFailure()
					).isTrue();
				});

				it('returns a failure if the player did nothing', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.HIGH_YIELD.id
						}).isFailure()
					).isTrue();
				});
			});

			describe('One Hundred Swings Quest', () => {
				it('returns a success if the player mined 100 times', () => {
					for (let numLoop = 0; numLoop < 100; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ONE_HUNDRED_SWINGS.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player mined 99 times', () => {
					for (let numLoop = 0; numLoop < 99; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ONE_HUNDRED_SWINGS.id
						}).isFailure()
					).isTrue();
				});

				it('returns a success if the player mined 0 times', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ONE_HUNDRED_SWINGS.id
						}).isFailure()
					).isTrue();
				});
			});

			describe('Rapid Extraction Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns a success if the player mined 20 times in a single moment', () => {
					for (let numLoop = 0; numLoop < 20; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.RAPID_EXTRACTION.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player mined 20 times in exactly 1 minute', () => {
					for (let numLoop = 0; numLoop < 20; numLoop++) {
						jest.setSystemTime(addSeconds(new Date(), 60/19));
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.RAPID_EXTRACTION.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player mined 20 times in exactly 1 minute and 2 seconds', () => {
					for (let numLoop = 0; numLoop < 20; numLoop++) {
						jest.setSystemTime(addSeconds(NOW, 61 * (numLoop/19)));
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RAPID_EXTRACTION.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player mined 19 times in exactly 1 minute', () => {
					for (let numLoop = 0; numLoop < 19; numLoop++) {
						jest.setSystemTime(addSeconds(NOW, 60 * (numLoop/19)));
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RAPID_EXTRACTION.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Lucky Mining Streak Quest', () => {
				it('returns a success if the player mined 100 tokens 10 times', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 100);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LUCKY_MINING_STREAK.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player mined 3 tokens 5 times', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 3);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LUCKY_MINING_STREAK.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player mined 3 tokens 4 times', () => {
					for (let numLoop = 0; numLoop < 4; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 3);
					}
					forcePlayerToMineTokens(SOME_PLAYER, 2);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LUCKY_MINING_STREAK.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player mined 2 tokens 5 times', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 2);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LUCKY_MINING_STREAK.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Refill Jackpot Quest', () => {
				it('returns a success if the player claimed a refill that gave them 999 tokens', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 999);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_JACKPOT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill that gave them 100 tokens at least once', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 20);
					forcePlayerToClaimRefill(SOME_PLAYER, 35);
					forcePlayerToClaimRefill(SOME_PLAYER, 12);
					forcePlayerToClaimRefill(SOME_PLAYER, 100);
					forcePlayerToClaimRefill(SOME_PLAYER, 99);
					forcePlayerToClaimRefill(SOME_PLAYER, 35);
					forcePlayerToClaimRefill(SOME_PLAYER, 50);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_JACKPOT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a dailure if the player claimed a refill that gave them 99 tokens', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 20);
					forcePlayerToClaimRefill(SOME_PLAYER, 35);
					forcePlayerToClaimRefill(SOME_PLAYER, 12);
					forcePlayerToClaimRefill(SOME_PLAYER, 99);
					forcePlayerToClaimRefill(SOME_PLAYER, 99);
					forcePlayerToClaimRefill(SOME_PLAYER, 35);
					forcePlayerToClaimRefill(SOME_PLAYER, 50);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_JACKPOT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mine Together Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns a success if the player mined at the same moment as another player', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_OTHER_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_TOGETHER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player mined exactly 60 seconds before another player', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToMineTokens(SOME_OTHER_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_TOGETHER.id
					});
					console.log(result);
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player mined exactly 61 seconds before another player', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					jest.setSystemTime(addSeconds(new Date(), 61));
					forcePlayerToMineTokens(SOME_OTHER_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_TOGETHER.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player mined exactly 60 seconds before themself', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_TOGETHER.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if some other player mined exactly 60 seconds before another different player', () => {
					forcePlayerToMineTokens(SOME_OTHER_PLAYER, 1);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToMineTokens(THREE_DIFFERENT_PLAYERS[2], 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_TOGETHER.id
					});
					console.log(result);
				makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mining Speedrun Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				});

				it('returns a success if the player earned 35 tokens in a single mine', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 35);

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.MINING_SPEEDRUN.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player earned 35 tokens across multiple mines within 60 seconds', () => {
					// 10 + 10 + 10 + 5 within 30 seconds
					forcePlayerToMineTokens(SOME_PLAYER, 10);
					jest.setSystemTime(addSeconds(new Date(), 10));
					forcePlayerToMineTokens(SOME_PLAYER, 10);
					jest.setSystemTime(addSeconds(new Date(), 20));
					forcePlayerToMineTokens(SOME_PLAYER, 10);
					jest.setSystemTime(addSeconds(new Date(), 30));
					forcePlayerToMineTokens(SOME_PLAYER, 5);

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.MINING_SPEEDRUN.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player only earned 35 tokens but spread across more than 60 seconds', () => {
					// 20 tokens now, 15 tokens after 61 seconds -> no 60s window with 35+
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					jest.setSystemTime(addSeconds(NOW, 61));
					forcePlayerToMineTokens(SOME_PLAYER, 15);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINING_SPEEDRUN.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player did nothing', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINING_SPEEDRUN.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Collective Mining Quest', () => {
				it('returns a success if a single player mined 1000 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1000);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINING_SPEEDRUN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if multiple players collectively mined 1000 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 250);

					// Use a few different players to sum to 1000
					for (let i = 0; i < 3; i++) {
						forcePlayerToMineTokens(THREE_DIFFERENT_PLAYERS[i], 1000 / 4 );
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINING_SPEEDRUN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if players only mined 999 tokens collectively', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 500);
					forcePlayerToMineTokens(SOME_OTHER_PLAYER, 499);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COLLECTIVE_MINING.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if nobody mined at all', () => {
					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.COLLECTIVE_MINING.id
						}).isFailure()
					).isTrue();
				});
			});

			describe('Refill Frenzy Quest', () => {
				it('returns a success if the player claimed a refill 100 times', () => {
					for (let numLoop = 0; numLoop < 100; numLoop++) {
						forcePlayerToClaimRefill(SOME_PLAYER, 1);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_FRENZY.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill 5 times', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToClaimRefill(SOME_PLAYER, 1);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_FRENZY.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill 4 times', () => {
					for (let numLoop = 0; numLoop < 4; numLoop++) {
						forcePlayerToClaimRefill(SOME_PLAYER, 1);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_FRENZY.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Instant Refill Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				});

				it('returns a success if the player claimed a refill the moment the cooldown expired', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), REFILL_COOLDOWN_HOURS));
					forcePlayerToClaimRefill(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_REFILL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill 60 seconds after the cooldown expired', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), REFILL_COOLDOWN_HOURS));
					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToClaimRefill(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_REFILL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player claimed a refill 61 seconds after the cooldown expired', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), REFILL_COOLDOWN_HOURS));
					jest.setSystemTime(addSeconds(new Date(), 61));
					forcePlayerToClaimRefill(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_REFILL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player only claimed one refill', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_REFILL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Refill Together Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns a success if the player claimed a refill at the same moment as two other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[2]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_TOGETHER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill 60 seconds before two other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[2]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_TOGETHER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player claimed a refill 61 seconds before two other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addSeconds(new Date(), 61));
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[2]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_TOGETHER.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player claimed a refill 60 seconds before one other player', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[1]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_TOGETHER.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player never refilled but three other players did', () => {
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(THREE_DIFFERENT_PLAYERS[2]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_TOGETHER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Treasure Hunter Quest', () => {
				it('returns a success if the player bought a mystery box 100 times', () => {
					for (let numLoop = 0; numLoop < 100; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TREASURE_HUNTER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player bought a mystery box 5 times', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TREASURE_HUNTER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player bought a mystery box 4 times', () => {
					for (let numLoop = 0; numLoop < 4; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TREASURE_HUNTER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Rapid Boxes Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns a success if the player bought three mystery boxes in a single moment', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.RAPID_BOXES.id
						}).isFailure()
					).isFalse();
				});

				it('returns a success if the player bought 3 mystery boxes in exactly 1 minute', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						jest.setSystemTime(addSeconds(new Date(), 60/2));
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.RAPID_BOXES.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure if the player bought 3 mystery boxes in exactly 1 minute and 1 second', () => {
					for (let numLoop = 0; numLoop < 3; numLoop++) {
						jest.setSystemTime(addSeconds(NOW, 61 * (numLoop/2)));
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RAPID_BOXES.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player bought 2 mystery boxes in exactly 1 minute', () => {
					for (let numLoop = 0; numLoop < 2; numLoop++) {
						jest.setSystemTime(addSeconds(NOW, 60 * (numLoop/1)));
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RAPID_BOXES.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Familiar Face Quest', () => {
				it('returns a success if the player got a character from a mystery box already in their name', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'abcdefghijklmnopqrstuvwxyz');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FAMILIAR_FACE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player got a character from a mystery box not already in their name', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'bcdefghijklmnopqrstuvwxyz');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FAMILIAR_FACE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player did not get a character from a mystery box', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FAMILIAR_FACE.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mystery Box Splurge Quest', () => {
				it('returns a success if the player spends 10,000 tokens on mystery boxes', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 10000
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_SPLURGE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player spends 750 tokens across three mystery boxes', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 500
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 200
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 50
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_SPLURGE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player spends 749 tokens across three mystery boxes', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 500
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 200
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 49
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_SPLURGE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a success if the player spends 749 tokens on one mystery box', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 749
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_SPLURGE.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mystery Box Collector Quest', () => {
				it('returns a success if the player buys three different mystery boxes', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_COLLECTOR.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player buys two different mystery boxes across many', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MYSTERY_BOX_COLLECTOR.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Big Spender Quest', () => {
				it('returns a success if the player buys every mystery box', () => {
					const mysteryBoxes = mysteryBoxService.getMysteryBoxes();
					for (const mysteryBox of mysteryBoxes) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, mysteryBox);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BIG_SPENDER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player buys only the most expensive mystery box', () => {
					const mysteryBoxes = mysteryBoxService.getMysteryBoxes();

					let mostExpensiveBox = mysteryBoxes[0];
					for (const mysteryBox of mysteryBoxes) {
						if (mysteryBox.tokenCost > mostExpensiveBox.tokenCost) {
							mostExpensiveBox = mysteryBox;
						}
					}

					forcePlayerToBuyMysteryBox(SOME_PLAYER, mostExpensiveBox);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BIG_SPENDER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player buys everything but the most expensive mystery box', () => {
					const mysteryBoxes = mysteryBoxService.getMysteryBoxes();

					let mostExpensiveBox = mysteryBoxes[0];
					for (const mysteryBox of mysteryBoxes) {
						if (mysteryBox.tokenCost > mostExpensiveBox.tokenCost) {
							mostExpensiveBox = mysteryBox;
						}
					}

					for (const mysteryBox of mysteryBoxes) {
						if (mysteryBox.id !== mostExpensiveBox.id) {
							forcePlayerToBuyMysteryBox(SOME_PLAYER, mysteryBox);
						}
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BIG_SPENDER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Bonus Loot Quest', () => {
				it('returns a success if you get two characteres from a mystery Box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'aa');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BONUS_LOOT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if you get only one character from mystery boxes', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BONUS_LOOT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Expected Reward Quest', () => {
				it('returns a success if you get an "e" from a mystery box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'e');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EXPECTED_REWARD.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if you get every letter but an "e" from a mystery box', () => {
					for (const letter of ['a', 'b', 'c', 'd', 'E', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, letter);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EXPECTED_REWARD.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Three of a Kind Quest', () => {
				it('returns a success if you receive the same character from a mystery box three times', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.THREE_OF_A_KIND.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if you receive two different characters from a mystery box three times', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'b');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.THREE_OF_A_KIND.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if you receive three different characters from a mystery box three times', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'a');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'b');
					forcePlayerToBuyMysteryBox(SOME_PLAYER, 'c');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.THREE_OF_A_KIND.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('All In Quest', () => {
				it('returns a success if the player buys a mystery box with all their tokens and is left with 0 tokens', () => {
					playerService.giveTokens(SOME_PLAYER, 100);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 100
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.ALL_IN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player buys a mystery box with all their tokens in between mining and buying other boxes', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					forcePlayerToClaimRefill(SOME_PLAYER, 60);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 30
					});
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: playerService.getTokens(SOME_PLAYER)
					});
					forcePlayerToMineTokens(SOME_PLAYER, 65);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 30
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.ALL_IN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player buys a mystery box with all their tokens but is left with some tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					forcePlayerToClaimRefill(SOME_PLAYER, 60);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 30
					});
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: playerService.getTokens(SOME_PLAYER) - 1
					});
					forcePlayerToMineTokens(SOME_PLAYER, 65);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 30
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.ALL_IN.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Emoji Alchemist Quest', () => {
				it('returns a success if the player uses a recipe that creates an emoji', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						outputCharacters: '👾'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_ALCHEMIST.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player uses a recipe the outputs at least one emoji', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						outputCharacters: 'h'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						outputCharacters: '👾abc3478'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						outputCharacters: '$#@$%abc3478:D'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_ALCHEMIST.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player uses a recipe the outputs no emojis', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						outputCharacters: '$#@$%abc3478:D'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_ALCHEMIST.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Many For One Quest', () => {
				it('returns a success if the player uses a recipe with 10 input characters and one output character', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: '0123456789',
						outputCharacters: 'a',
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MANY_FOR_ONE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player uses a recipe with 3 input characters and one output character at least once', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'bv',
						outputCharacters: 'os',
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: '012',
						outputCharacters: 'a',
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: 'b',
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MANY_FOR_ONE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player uses a recipe with 3 input characters and more than one output character', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: '012',
						outputCharacters: 'ab',
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MANY_FOR_ONE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a success if the player uses a recipe with 2 input characters and one output character', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: '12',
						outputCharacters: '1',
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MANY_FOR_ONE.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Great Deal Quest', () => {
				it('returns a success if the player traded one character for ten in return', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '0123456789'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player traded one character for 3 in return at least once', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: 'b'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '123'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'abc',
						requestedCharacters: 'def'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player traded one character for only 2 in return', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: 'b'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'a',
						requestedCharacters: '12'
					});
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						offeredCharacters: 'abc',
						requestedCharacters: 'def'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.GREAT_DEAL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Crafty Crafter Quest', () => {
				it('returns a success if the player used three recipes that require utility characters', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a↻",
						outputCharacters: "e"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "b⇋",
						outputCharacters: "d"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "ab⤻cd",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTY_CRAFTER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player used two recipes that require utility characters and one that does not', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a↻",
						outputCharacters: "e"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "b⇋",
						outputCharacters: "d"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "abcd",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTY_CRAFTER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Large Output Quest', () => {
				it('returns a success if the player uses a recipe that produces 2+ characters at least once', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "b"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "d"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "e",
						outputCharacters: "fg"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "h",
						outputCharacters: "i"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LARGE_OUTPUT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player never uses a recipe that produces 2+ characters', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "b"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "cd",
						outputCharacters: "e"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "efg",
						outputCharacters: "h"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "h",
						outputCharacters: "i"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.LARGE_OUTPUT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Dual Artisan Quest', () => {
				it('returns a success if the player uses two different recipes that craft the same characters', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "bb"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "bb"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "a"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "bb",
						outputCharacters: "c"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "def",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DUAL_ARTISAN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player crafts the same characters with the same recipe twice', () => {
					const craftResult = forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "bb"
					});
					forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed);
					forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed);
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "a"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "bb",
						outputCharacters: "c"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "def",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DUAL_ARTISAN.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Recipe Remix Quest', () => {
				it('returns a success if the player uses two different recipes that use the same input characters', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "bb",
						outputCharacters: "a"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "bb",
						outputCharacters: "c"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "c"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "bb"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "def",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DUAL_ARTISAN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player crafts the same characters with the same recipe twice', () => {
					const craftResult = forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "bb",
						outputCharacters: "a"
					});
					forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed);
					forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed);
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "a",
						outputCharacters: "c"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "c",
						outputCharacters: "bb"
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: "def",
						outputCharacters: "jkl"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.DUAL_ARTISAN.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Scam Quest', () => {
				it('returns a success if the player accepted a trade where they give away one character and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player has their trade accepted where they give away one character and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SOME_OTHER_PLAYER,
						offeredCharacters: "1",
						requestedCharacters: "12345"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player accepted a trade where they give away one character and recieve four', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "1234",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player accepted a trade where they give away two characters and recieve five', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "12"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SCAM.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Seal The Deal', () => {
				it('returns a success if the player accepted a trade before', () => {
					forcePlayerToAcceptNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEAL_THE_DEAL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player did not accept a trade before', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEAL_THE_DEAL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Rejecting Profit', () => {
				it('returns a success if the player declined a trade where they would\'ve recieved six characters for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "123456",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a failure if the player declined a trade where they would\'ve recieved five characters for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "12345",
						requestedCharacters: "1"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns a failure if the player declined a trade where they would\'ve recieved one character for one', () => {
					forcePlayerToDeclineNewTrade(SOME_PLAYER, {
						initiatingPlayer: SOME_OTHER_PLAYER,
						recipientPlayer: SOME_PLAYER,
						offeredCharacters: "1",
						requestedCharacters: "12345"
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REJECTING_PROFIT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Final Offer Quest', () => {
				it('returns success when player has modified a trade today that was accepted by another player', () => {
					const modifyResult = forcePlayerToModifyNewTrade(SOME_PLAYER, {
						charactersGiving: "abc",
						charactersReceiving: "def"
					});

					forcePlayerToAcceptTrade(modifyResult.trade.initiatingPlayer, modifyResult.trade);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has modified a trade today that was declined by another player', () => {
					const modifyResult = forcePlayerToModifyNewTrade(SOME_PLAYER, {
						charactersGiving: "abc",
						charactersReceiving: "def"
					});

					forcePlayerToDeclineTrade(modifyResult.trade.initiatingPlayer, modifyResult.trade);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has not modified a trade today that was accepted by another player', () => {
					forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
						initiatingPlayer: SOME_PLAYER,
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FINAL_OFFER.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Quest Combo Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				});

				it('returns success when player has completed two quests exactly 10 minutes apart', () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);

					jest.setSystemTime(addMinutes(new Date(), 10));
					forcePlayerToCompleteNewQuest(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.QUEST_COMBO.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has completed two quest exactly 10 minutes and 1 second apart', () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);

					jest.setSystemTime(addDuration(new Date(), { minutes: 10, seconds: 1 }));
					forcePlayerToCompleteNewQuest(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.QUEST_COMBO.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has completed only one quest', () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.QUEST_COMBO.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Hoard Tokens Quest', () => {
				it('returns success when player earns 200 tokens at once from claiming a refill', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 200);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when players earn 200 tokens total over many mines', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 20);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					})
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when players eanrs 1000 tokens total over many mines but spends between earning 200 tokens', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 200);
						forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {tokenCost: 100});
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					})
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure if player only earned 199 tokens total', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 199);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure if player only earned 199 tokens over many mines', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						let numTokens = 20;
						if (numLoop === 9)
							numTokens = 19;

						forcePlayerToMineTokens(SOME_PLAYER, numTokens);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure if player earned 200 tokens but spend tokens in between', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 100);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {tokenCost: 10});
					forcePlayerToMineTokens(SOME_PLAYER, 100);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HOARD_TOKENS.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('The Richest Quest', () => {
				it('returns success when player has the most tokens out of everyone else', () => {
					const RICHEST_PLAYER = addMockPlayer(db, {tokens: 9999});
					addMockPlayer(db, {tokens: 1000});
					addMockPlayer(db, {tokens: 9000});

					const result = completeQuest({
						playerResolvable: RICHEST_PLAYER.id,
						questResolvable: Quests.THE_RICHEST.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure if one player has more tokens than another', () => {
					const RICHEST_PLAYER = addMockPlayer(db, {tokens: 9000});
					addMockPlayer(db, {tokens: 9999});
					addMockPlayer(db, {tokens: 1000});
					addMockPlayer(db, {tokens: 0});

					const result = completeQuest({
						playerResolvable: RICHEST_PLAYER.id,
						questResolvable: Quests.THE_RICHEST.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Character Collector Quest', () => {
				it('returns success when player has an inventory of 35 unique characters', () => {
					const player = addMockPlayer(db, {inventory: 'abcdefghijklmnopqrstuvwxyz01234567890'});

					const result = completeQuest({
						playerResolvable: player.id,
						questResolvable: Quests.CHARACTER_COLLECTOR.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has an inventory of only 34 unique characters', () => {
					const player = addMockPlayer(db, {inventory: 'abcdefghijklmnopqrstuvwxyz01234567'});

					const result = completeQuest({
						playerResolvable: player.id,
						questResolvable: Quests.CHARACTER_COLLECTOR.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has an inventory of only 34 unique characters but 100s of total characters', () => {
					const player = addMockPlayer(db, {inventory: 'abcdefghijklmnopqrstuvwxyz01234567aaabbc23332hhhasdhjhhcxzhghjasd07234762ghjgdakjhdsadhas7qwopepoijoi434237daskjhkj322hjcs'});

					const result = completeQuest({
						playerResolvable: player.id,
						questResolvable: Quests.CHARACTER_COLLECTOR.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('You Snooze You Lose Quest', () => {
				it('returns success when the player is the first one to complete it', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player is the last one to complete it', () => {
					completeQuest({
						playerResolvable: SOME_OTHER_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player is the second one to complete it', () => {
					completeQuest({
						playerResolvable: SOME_OTHER_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});

					completeQuest({
						playerResolvable: THREE_DIFFERENT_PLAYERS[0].id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player is the last of five to complete it', () => {
					for (let i = 0; i < 5; i++) {
						completeQuest({
							playerResolvable: FIVE_DIFFERENT_PLAYERS[i].id,
							questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
						});
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_LOSE.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('You Snooze You Win Quest', () => {
				it('returns success when the player is the second one to complete it', () => {
					completeQuest({
						playerResolvable: SOME_OTHER_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});

					completeQuest({
						playerResolvable: THREE_DIFFERENT_PLAYERS[0].id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player is the first and second one to complete it', () => {
					const result1 = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});
					makeSure(result1.isFailure()).isTrue();

					const result2 = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});
					makeSure(result2.isFailure()).isTrue();
				});

				it('returns failure when the player is the third one to complete it', () => {
					completeQuest({
						playerResolvable: THREE_DIFFERENT_PLAYERS[0].id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});

					completeQuest({
						playerResolvable: THREE_DIFFERENT_PLAYERS[1].id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});

					const result = completeQuest({
						playerResolvable: THREE_DIFFERENT_PLAYERS[2].id,
						questResolvable: Quests.YOU_SNOOZE_YOU_WIN.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});
		});
	});
});