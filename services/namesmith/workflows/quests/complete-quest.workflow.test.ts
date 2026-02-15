import { addDays, addDuration, addHours, addMinutes, addSeconds } from "../../../../utilities/date-time-utils";
import { failTest, makeSure, repeatEveryIntervalUntil, repeatOverDuration } from "../../../../utilities/jest/jest-utils";
import { repeat } from "../../../../utilities/loop-utils";
import { getBetween, getRandomUUID } from "../../../../utilities/random-utils";
import { UTILITY_CHARACTERS } from "../../constants/characters.constants";
import { REFILL_COOLDOWN_HOURS } from "../../constants/namesmith.constants";
import { Quests } from "../../constants/quests.constants";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../../constants/test.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { getLatestActivityLog } from "../../mocks/mock-data/mock-activity-logs";
import { forcePlayerToBuyMysteryBox, forcePlayerToBuyNewMysteryBox } from "../../mocks/mock-data/mock-mystery-boxes";
import { addMockPerk, forcePlayerToPickNewPerk, forcePlayerToPickPerk } from "../../mocks/mock-data/mock-perks";
import { addMockPlayer, forcePlayerToChangeName, forcePlayerToClaimRefill, forcePlayerToHaveInventory, forcePlayerToMineTokens, forcePlayerToPublishName } from '../../mocks/mock-data/mock-players';
import { addMockQuest, forcePlayerToCompleteNewQuest, forcePlayerToCompleteQuest } from "../../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraftRecipe, forcePlayerToCraftNewRecipe } from '../../mocks/mock-data/mock-recipes';
import { addMockRole } from "../../mocks/mock-data/mock-roles";
import { addMockTrade, forcePlayerToAcceptNewTrade, forcePlayerToAcceptTrade, forcePlayerToDeclineNewTrade, forcePlayerToDeclineTrade, forcePlayerToInitiateTrade, forcePlayerToModifyNewTrade } from '../../mocks/mock-data/mock-trades';
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { GameStateService } from "../../services/game-state.service";
import { MysteryBoxService } from "../../services/mystery-box.service";
import { PlayerService } from "../../services/player.service";
import { ActivityTypes } from "../../types/activity-log.types";
import { Perk } from "../../types/perk.types";
import { Player } from "../../types/player.types";
import { Quest } from "../../types/quest.types";
import { Recipe } from '../../types/recipe.types';
import { Role } from "../../types/role.types";
import { TradeStatuses } from "../../types/trade.types";
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
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;
	let RIGHT_BEFORE_END_OF_WEEK: Date;
	let RIGHT_BEFORE_END_OF_DAY: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1)
		RIGHT_BEFORE_END_OF_WEEK = addDuration(START_OF_WEEK, { days: 7, minutes: -1 });
		RIGHT_BEFORE_END_OF_DAY = addDuration(START_OF_WEEK, { days: 1, minutes: -1 });
		
    ({ db, playerService, gameStateService, mysteryBoxService } = setupMockNamesmith(START_OF_WEEK));
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
		SEVEN_DIFFERENT_PLAYERS = [];
		for (let i = 0; i < 7; i++) {
			if (i < 3) {
				THREE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
			}

			if (i < 5) {
				FIVE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
			}

			SEVEN_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
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

					jest.setSystemTime(RIGHT_BEFORE_END_OF_DAY);

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
					jest.setSystemTime(RIGHT_BEFORE_END_OF_DAY);
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

			describe('Perk Pride Quest', () => {
				let PERK1: Perk;
				let PERK2: Perk;
				let PLAYER_WITH_PERKS: Player;

				beforeEach(() => {
					PERK1 = addMockPerk(db, {name: 'perk1'});
					PERK2 = addMockPerk(db, {name: 'perk2'});
					PLAYER_WITH_PERKS = addMockPlayer(db, {perks: [PERK1, PERK2]});
				});
				
				it('returns success when the player name is one of their perk names', () => {
					forcePlayerToChangeName(PLAYER_WITH_PERKS, PERK1.name);
					const result = completeQuest({
						playerResolvable: PLAYER_WITH_PERKS,
						questResolvable: Quests.PERK_PRIDE
					});
					makeSure(result.isFailure()).isFalse();
				});
				
				it('returns success when the player name contains one of their perk names', () => {
					forcePlayerToChangeName(PLAYER_WITH_PERKS, `In between ${PERK1.name} characters`);
					const result = completeQuest({
						playerResolvable: PLAYER_WITH_PERKS,
						questResolvable: Quests.PERK_PRIDE
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player name does not contain any of their perk names', () => {
					forcePlayerToChangeName(PLAYER_WITH_PERKS, 'new name');
					const result = completeQuest({
						playerResolvable: PLAYER_WITH_PERKS,
						questResolvable: Quests.PERK_PRIDE
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Role Call Quest', () => {
				let SOME_ROLE: Role;
				let SOME_PLAYER: Player;

				beforeEach(() => {
					SOME_ROLE = addMockRole(db, {name: 'some role'});
					SOME_PLAYER = addMockPlayer(db, {role: SOME_ROLE});
				});
				
				it('returns success when the player name is their role name', () => {
					forcePlayerToChangeName(SOME_PLAYER, SOME_ROLE.name);
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.ROLE_CALL
					});
					makeSure(result.isFailure()).isFalse();
				});
				
				it('returns success when the player name contains their role name', () => {
					forcePlayerToChangeName(SOME_PLAYER, `In between ${SOME_ROLE.name} characters`);
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.ROLE_CALL
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player name does not contain their role name', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'new name');
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.ROLE_CALL
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Show Tokens Quest', () => {
				it('returns success when the player has a published name that is exactly the number of tokens they have', () => {
					forcePlayerToPublishName(SOME_PLAYER, String(SOME_PLAYER.tokens));
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SHOW_TOKENS
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player has a published name containing the number of tokens they have', () => {
					const mockPlayer = addMockPlayer(db, {tokens: 20});
					forcePlayerToPublishName(mockPlayer, `In between ${mockPlayer.tokens} characters`);
					const result = completeQuest({
						playerResolvable: mockPlayer,
						questResolvable: Quests.SHOW_TOKENS
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player does not have a published name', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SHOW_TOKENS
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has a published name that does not contain the number of tokens they have', () => {
					const mockPlayer = addMockPlayer(db, {tokens: 20});
					forcePlayerToPublishName(mockPlayer, '12345678902');
					const result = completeQuest({
						playerResolvable: mockPlayer,
						questResolvable: Quests.SHOW_TOKENS
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Gold Spike Quest', () => {
				it('returns success when the player has mined 10 tokens from a single mine this week', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 10);
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.GOLD_SPIKE
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player has mined more than 10 tokens from at least one mine', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(SOME_PLAYER, 3);
					forcePlayerToMineTokens(SOME_PLAYER, 20);
					forcePlayerToMineTokens(SOME_PLAYER, 2);
					forcePlayerToMineTokens(SOME_PLAYER, 5);
					forcePlayerToMineTokens(SOME_PLAYER, 8);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.GOLD_SPIKE
					});
					makeSure(result.isFailure()).isFalse();
				});
				
				it('returns failure when the player has never mined 10 tokens', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 5);
					forcePlayerToMineTokens(SOME_PLAYER, 9);
					forcePlayerToMineTokens(SOME_PLAYER, 3);
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.GOLD_SPIKE
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has mined 0 tokens from all mines this week', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.GOLD_SPIKE
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});
			})

			describe('Speed Mine Quest', () => {
				let NOW: Date;
	
				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: NOW });
				});
	
				afterEach(() => {
					jest.useRealTimers();
				});

				it('returns success when player has mined 250 times in a single moment', () => {
					for (let numLoop = 0; numLoop < 250; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SPEED_MINE
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player has mined 250 times in exactly 10 minutes', () => {
					repeatOverDuration(250, { minutes: 10 }, () => {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SPEED_MINE
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has mined 250 times in exactly 10 minutes and 1 second', () => {
					repeatOverDuration(250, { minutes: 10, seconds: 1 }, () => {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SPEED_MINE
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has mined 249 times in exactly 10 minutes', () => {
					repeatOverDuration(249, { minutes: 10 }, () => {
						forcePlayerToMineTokens(SOME_PLAYER, 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SPEED_MINE
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has never mined', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.SPEED_MINE
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mine Haul Quest', () => {
				it('returns success when player has mined 1500 tokens this week', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1500);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_HAUL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player has mined 1500 tokens across multiple mines this week', () => {
					for (let numLoop = 0; numLoop < 10; numLoop++) {
						forcePlayerToMineTokens(SOME_PLAYER, 150);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_HAUL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has only mined 1499 tokens this week', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1499);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_HAUL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has not mined any tokens this week', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MINE_HAUL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Instant Squad Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns success when the player mined at the same moment within 5 seconds as 5 other players', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[0], 1);
					forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[1], 1);
					forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[2], 1);
					forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[3], 1);
					forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[4], 1);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_SQUAD.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player mined exactly 5 seconds before 5 other players', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					repeatOverDuration(5, { seconds: 5 }, (index) => {
						forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[index], 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_SQUAD.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player mined exactly 6 seconds before 5 other players', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					repeatOverDuration(5, { seconds: 6 }, (index) => {
						forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[index], 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_SQUAD.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player mined with only 4 other players within 5 seconds', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);

					repeatOverDuration(4, { seconds: 5 }, (index) => {
						forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[index], 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_SQUAD.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player did not mine any tokens this week', () => {
					repeatOverDuration(5, { seconds: 5 }, (index) => {
						forcePlayerToMineTokens(FIVE_DIFFERENT_PLAYERS[index], 1);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_SQUAD.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Ten Minute Rush Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: NOW });
				});

				afterEach(() => {
					jest.useRealTimers();
				});

				it('returns success when player has mined 400 tokens in exactly 10 minutes', () => {
					repeatOverDuration(40, { minutes: 10 }, () => {
						forcePlayerToMineTokens(SOME_PLAYER, 10);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player has mined 400 tokens in a single moment', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 400);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has only mined 399 tokens within 10 minutes', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 399);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has mined 400 tokens but spread across more than 10 minutes', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 200);
					jest.setSystemTime(addMinutes(new Date(), 10));
					jest.setSystemTime(addSeconds(new Date(), 1));
					forcePlayerToMineTokens(SOME_PLAYER, 200);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has never mined any tokens', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Coalition Quest', () => {
				it('returns success when player mined at least once and everyone collectively mined 3500 tokens this week', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					for (let i = 0; i < 3; i++) {
						forcePlayerToMineTokens(THREE_DIFFERENT_PLAYERS[i], 1200);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COALITION.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player did not mine at all, even if everyone else mined enough', () => {
					for (let i = 0; i < 3; i++) {
						forcePlayerToMineTokens(THREE_DIFFERENT_PLAYERS[i], 1200);
					}
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COALITION.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player mined but total mined is less than 3500', () => {
					forcePlayerToMineTokens(SOME_PLAYER, 1);
					for (let i = 0; i < 3; i++) {
						forcePlayerToMineTokens(THREE_DIFFERENT_PLAYERS[i], 1000);
					}
					
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COALITION.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when nobody mined at all', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COALITION.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Refill Raid Quest', () => {
				it('returns success when player claimed a refill that gave them 500 tokens', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 500);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_RAID.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player claimed a refill that gave them 600 tokens at least once', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 100);
					forcePlayerToClaimRefill(SOME_PLAYER, 250);
					forcePlayerToClaimRefill(SOME_PLAYER, 600);
					forcePlayerToClaimRefill(SOME_PLAYER, 75);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_RAID.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player claimed a refill that gave them 499 tokens', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 499);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_RAID.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player claimed multiple refills but max is only 499 tokens', () => {
					forcePlayerToClaimRefill(SOME_PLAYER, 100);
					forcePlayerToClaimRefill(SOME_PLAYER, 250);
					forcePlayerToClaimRefill(SOME_PLAYER, 499);
					forcePlayerToClaimRefill(SOME_PLAYER, 75);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_RAID.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player did not claim any refills', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.REFILL_RAID.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Mass Refill Quest', () => {
				let NOW: Date;

				beforeEach(() => {
					NOW = new Date();
					jest.useFakeTimers({ now: addHours(NOW, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns success when the player claimed a refill at the same moment as five other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[2]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[3]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[4]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MASS_REFILL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player claimed a refill exactly 60 seconds before five other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addSeconds(new Date(), 60));
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[2]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[3]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[4]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MASS_REFILL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player claimed a refill exactly 61 seconds before five other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addSeconds(new Date(), 61));
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[2]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[3]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[4]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MASS_REFILL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player claimed a refill at the same moment as only four other players', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[2]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[3]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MASS_REFILL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player never claimed a refill', () => {
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[0]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[1]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[2]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[3]);
					forcePlayerToClaimRefill(FIVE_DIFFERENT_PLAYERS[4]);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.MASS_REFILL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Cold Server Quest', () => {
				beforeEach(() => {
					jest.useFakeTimers({ now: addMinutes(START_OF_WEEK, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				});

				it('returns success when no player has claimed a refill for exactly 16 hours this week', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), 16));

					repeatEveryIntervalUntil({ hours: 1 }, RIGHT_BEFORE_END_OF_WEEK,
						() => forcePlayerToClaimRefill(SOME_PLAYER, 1)
					);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COLD_SERVER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when no player has claimed a refill for more than 16 hours this week', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), 20));

					repeatEveryIntervalUntil({ hours: 1 }, RIGHT_BEFORE_END_OF_WEEK,
						() => forcePlayerToClaimRefill(SOME_PLAYER, 1)
					);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COLD_SERVER.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when no player has gone 16 hours without claiming a refill', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addHours(new Date(), 15));

					repeatEveryIntervalUntil({ hours: 1 }, RIGHT_BEFORE_END_OF_WEEK,
						() => forcePlayerToClaimRefill(SOME_PLAYER, 1)
					);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COLD_SERVER.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when max silence is exactly 15 hours and 59 minutes', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);
					jest.setSystemTime(addMinutes(addHours(new Date(), 15), 59));

					repeatEveryIntervalUntil({ hours: 1 }, RIGHT_BEFORE_END_OF_WEEK,
						() => forcePlayerToClaimRefill(SOME_OTHER_PLAYER, 1)
					);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.COLD_SERVER.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Box Binge Quest', () => {
				beforeEach(() => {
					jest.useFakeTimers({ now: addMinutes(START_OF_WEEK, 1) });
				});

				afterAll(() => {
					jest.useRealTimers();
				});

				it('returns success when the player bought 25 mystery boxes this week', () => {
					for (let numLoop = 0; numLoop < 25; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BOX_BINGE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player bought more than 25 mystery boxes this week', () => {
					for (let numLoop = 0; numLoop < 30; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BOX_BINGE.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player bought only 24 mystery boxes this week', () => {
					for (let numLoop = 0; numLoop < 24; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BOX_BINGE.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player did not buy any mystery boxes this week', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BOX_BINGE.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Hyper Boxes Quest', () => {
				beforeEach(() => {
					jest.useFakeTimers({ now: START_OF_WEEK });
				});

				afterAll(() => {
					jest.useRealTimers();
				})

				it('returns success when the player bought 10 mystery boxes in exactly 3 minutes', () => {
					repeatOverDuration(10, { minutes: 3 }, () => {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HYPER_BOXES.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player bought 10 mystery boxes in a single moment', () => {
					repeat(10, () => 
						forcePlayerToBuyMysteryBox(SOME_PLAYER)
					);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HYPER_BOXES.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player bought 10 mystery boxes in exactly 3 minutes and 1 second', () => {
					repeatOverDuration(10, { minutes: 3, seconds: 1 }, () => {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HYPER_BOXES.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player bought only 9 mystery boxes in exactly 3 minutes', () => {
					repeatOverDuration(9, { minutes: 3 }, () => {
						forcePlayerToBuyMysteryBox(SOME_PLAYER);
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HYPER_BOXES.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player did not buy any mystery boxes', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.HYPER_BOXES.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Namesake Box Quest', () => {
				it('returns success when player has bought a mystery box whose name is contained in their published name', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'I love Celestial boxes!');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, { name: 'Celestial' });

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					console.log(result);
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player has bought multiple mystery boxes and one matches their published name', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'My name has Lunar in it');
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, { name: 'Lunar' });
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the match is case-insensitive', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'CELESTIAL is great');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, { name: 'celestial' });

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has not published their name', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has not bought any mystery boxes', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Some published name');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player bought mystery boxes but none match their published name', () => {
					forcePlayerToPublishName(SOME_PLAYER, 'Unique name here');
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);
					forcePlayerToBuyMysteryBox(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.NAMESAKE_BOX.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Rightmost Quest', () => {
				it('returns success when player has received the rightmost character of their name from a mystery box', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'g': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when player has bought multiple mystery boxes and one contains the rightmost character', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'hello');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});
					forcePlayerToChangeName(SOME_PLAYER, 'hello');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'b': 1}
					});
					forcePlayerToChangeName(SOME_PLAYER, 'hello');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'o': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when player has not bought any mystery boxes', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'testname');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has bought mystery boxes but none contain the rightmost character', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});
					forcePlayerToChangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'b': 1}
					});
					forcePlayerToChangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'c': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has not changed their name', () => {
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Buyout Quest', () => {
				it('returns success when the player has bought every available mystery box type this week', () => {
					const allMysteryBoxes = mysteryBoxService.getMysteryBoxes();
					for (const mysteryBox of allMysteryBoxes) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, mysteryBox);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BUYOUT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player has bought all mystery boxes across multiple purchases', () => {
					const allMysteryBoxes = mysteryBoxService.getMysteryBoxes();
					for (const mysteryBox of allMysteryBoxes) {
						repeat(getBetween(1, 5), () => forcePlayerToBuyMysteryBox(SOME_PLAYER, mysteryBox));
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BUYOUT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BUYOUT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has bought only some of the available mystery box types', () => {
					const allMysteryBoxes = mysteryBoxService.getMysteryBoxes();
					const numBoxesToBuy = Math.max(1, allMysteryBoxes.length - 1);
					for (let i = 0; i < numBoxesToBuy; i++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, allMysteryBoxes[i]);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BUYOUT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has bought one mystery box type multiple times but not all types', () => {
					const allMysteryBoxes = mysteryBoxService.getMysteryBoxes();
					for (let i = 0; i < 5; i++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, allMysteryBoxes[0]);
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.BUYOUT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Triple Pull Quest', () => {
				it('returns success when the player received 3 characters from a single mystery box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "abc");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TRIPLE_PULL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player received 5 characters from a single mystery box', () => {					
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "abcde");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TRIPLE_PULL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player only received 2 characters from a mystery box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "ab");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TRIPLE_PULL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player received multiple pulls but max is only 2 characters', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "ab");
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "cd");
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "ef");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TRIPLE_PULL.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TRIPLE_PULL.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Find X Quest', () => {
				it('returns success when the player received the character "x" from a mystery box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "x");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FIND_X.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player received "x" among other characters from a mystery box', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "abxc");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FIND_X.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player received "x" from a mystery box after other pulls', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "abx");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FIND_X.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player never received the character "x"', () => {
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "abc");
					forcePlayerToBuyMysteryBox(SOME_PLAYER, "de");

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FIND_X.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.FIND_X.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Sevens Quest', () => {
				it('returns success when the player received the same character 7 times from mystery boxes', () => {
					for (let numLoop = 0; numLoop < 7; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "a");
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEVENS.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player received the same character 10 times mixed with other characters', () => {
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "ab");
					}
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "ac");
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEVENS.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player only received the same character 6 times', () => {
					for (let numLoop = 0; numLoop < 6; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "a");
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEVENS.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player received multiple characters but max count is 6', () => {
					for (let numLoop = 0; numLoop < 6; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "a");
					}
					for (let numLoop = 0; numLoop < 5; numLoop++) {
						forcePlayerToBuyMysteryBox(SOME_PLAYER, "b");
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEVENS.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.SEVENS.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Priced Right Quest', () => {
				it('returns success when the player bought a mystery box and their name contains the box price', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'My price is 50 tokens');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 50
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player bought a mystery box where the price is exactly the name', () => {
					forcePlayerToChangeName(SOME_PLAYER, '100');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 100
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player bought multiple boxes and one matches their name price', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'Box costs 75 tokens');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 50
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 75
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 100
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player bought a mystery box but the price is not in their name', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'My name has no price');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 50
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player bought boxes but never with a matching name price', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'Price 123');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 50
					});
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						tokenCost: 75
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					forcePlayerToChangeName(SOME_PLAYER, 'Some name');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Crafting Marathon Quest', () => {
				it('returns success when the player crafted using 15 different recipes', () => {
					for (let i = 0; i < 15; i++) {
						forcePlayerToCraftNewRecipe(SOME_PLAYER, {
							inputCharacters: String(i),
							outputCharacters: `output${i}`
						});
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTING_MARATHON.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player crafted using 20 different recipes', () => {
					for (let i = 0; i < 20; i++) {
						forcePlayerToCraftNewRecipe(SOME_PLAYER, {
							inputCharacters: String(i),
							outputCharacters: `output${i}`
						});
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTING_MARATHON.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player crafted using the same 15 recipes multiple times', () => {
					const recipes: Recipe[] = [];
					for (let i = 0; i < 15; i++) {
						recipes.push(addMockRecipe(db, {
							inputCharacters: String(i),
							outputCharacters: `output${i}`
						}));
					}

					for (let i = 0; i < 3; i++) {
						for (const recipe of recipes) {
							forcePlayerToCraftRecipe(SOME_PLAYER, recipe);
						}
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTING_MARATHON.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player crafted using only 14 different recipes', () => {
					for (let i = 0; i < 14; i++) {
						forcePlayerToCraftNewRecipe(SOME_PLAYER, {
							inputCharacters: String(i),
							outputCharacters: `output${i}`
						});
					}

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTING_MARATHON.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not crafted any characters', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.CRAFTING_MARATHON.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});

			describe('Emoji Craft Quest', () => {
				it('returns success when the player crafted 3 recipes with emojis', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: '👾'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'b',
						outputCharacters: '🎮'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'c',
						outputCharacters: '⭐'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player crafted more than 3 emoji recipes', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: '👾'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'b',
						outputCharacters: '🎮'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'c',
						outputCharacters: '⭐'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'd',
						outputCharacters: '🔥'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns success when the player crafted emoji recipes mixed with non-emoji recipes', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: 'abc'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'b',
						outputCharacters: '👾'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'c',
						outputCharacters: '123'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'd',
						outputCharacters: '🎮'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'e',
						outputCharacters: 'def'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'f',
						outputCharacters: '⭐'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player crafted only 2 emoji recipes', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: '👾'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'b',
						outputCharacters: '🎮'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player crafted recipes with no emojis', () => {
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'a',
						outputCharacters: 'abc'
					});
					forcePlayerToCraftNewRecipe(SOME_PLAYER, {
						inputCharacters: 'b',
						outputCharacters: '123'
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					console.log(result);
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not crafted any characters', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.EMOJI_CRAFT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});
		});

		describe('Bulk Recipe Quest', () => {
			it('returns success when the player crafted a recipe with 5 input characters and 1 output character', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: '01234',
					outputCharacters: 'a'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player crafted a recipe with 10 input characters and 1 output character', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: '0123456789',
					outputCharacters: 'a'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player crafted multiple recipes and one has 5 input characters and 1 output character', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'ab',
					outputCharacters: 'cd'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: '01234',
					outputCharacters: 'x'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'efg',
					outputCharacters: 'hij'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the player crafted a recipe with 5 input characters but 2 output characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: '01234',
					outputCharacters: 'ab'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player crafted a recipe with 4 input characters and 1 output character', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: '0123',
					outputCharacters: 'a'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player crafted recipes but only with less than 5 input characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'ab',
					outputCharacters: 'c'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'def',
					outputCharacters: 'g'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'hij',
					outputCharacters: 'k'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player has not crafted any characters', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.BULK_RECIPE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Utility Master Quest', () => {
			it('return success when the player uses a recipe with all utility characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: UTILITY_CHARACTERS.join(''),
				});
				
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
				console.log(result);
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player uses many recipes that include different utility characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: UTILITY_CHARACTERS.join('').slice(0, 3),
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: UTILITY_CHARACTERS.join('').slice(3, 6),
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: UTILITY_CHARACTERS.join('').slice(6),
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns a failure when the player is missing one utility character', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: UTILITY_CHARACTERS.join('').slice(1),
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure when the player never used utility characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
				})
				
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
				console.log(result);
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure when the player never crafted a recipe', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
				console.log(result);
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Tri-Forge Quest', () => {
			it('returns a success if the player crafted the same character using three different recipes', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'ghi',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'jkl',
					outputCharacters: 'def'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.TRI_FORGE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns a failure if the player crafted the same character using two different recipes and similar characters using another recipe', () => {
				const craftResult = forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'ghi',
					outputCharacters: 'def'
				});
				forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed.id);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.TRI_FORGE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure if the player crafted the same character using only two different recipes', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'ghi',
					outputCharacters: 'def'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.TRI_FORGE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure when the player never crafted a recipe', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.TRI_FORGE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Input Remix Quest', () => {
			it('returns a success if the player uses three different recipes that use the same input characters', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'ghi'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'jkl'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.INPUT_REMIX.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns a failure if the player crafted the same character using two different recipes and similar characters using another recipe', () => {
				const craftResult = forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'ghi'
				});
				forcePlayerToCraftRecipe(SOME_PLAYER, craftResult.recipeUsed.id);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.INPUT_REMIX.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure if the player crafted the same character using only two different recipes', () => {
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'def'
				});
				forcePlayerToCraftNewRecipe(SOME_PLAYER, {
					inputCharacters: 'abc',
					outputCharacters: 'ghi'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.INPUT_REMIX.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure when the player never crafted a recipe', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.INPUT_REMIX.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Chaotic Trade Quest', () => {
			it('returns success when player gave 1 character and received 20 characters in a trade', () => {
				forcePlayerToAcceptNewTrade(SOME_OTHER_PLAYER, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '01234567890123456789'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player gave 1 character and received more than 20 characters in a trade', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'x',
					requestedCharacters: 'abcdefghijklmnopqrstuvwxyz'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player was the recipient who gave 1 character and received 20 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: 'a'
				});
				forcePlayerToAcceptTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player had multiple trades and one meets criteria', () => {
				const trade1 = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade1);

				const trade2 = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'x',
					requestedCharacters: '01234567890123456789'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade2);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player gave 1 character but only received 19 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '0123456789012345678'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player gave 2 characters and received 20 characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'ab',
					requestedCharacters: '01234567890123456789'
				});
				forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player gave 1 character and received 20 characters but trade was never accepted', () => {
				addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: '01234567890123456789'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not been involved in any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAOTIC_TRADE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Wide Diplomat Quest', () => {
			it('returns success when 5 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when more than 5 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 7; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SEVEN_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(SEVEN_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when 5 players accepted multiple trades each', () => {
				for (let i = 0; i < 5; i++) {
					for (let j = 0; j < 3; j++) {
						const trade = addMockTrade(db, {
							initiatingPlayer: SOME_PLAYER,
							recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
						});
						forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
					}
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when only 4 different players accepted the player\'s trades', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					});
					forcePlayerToAcceptTrade(FIVE_DIFFERENT_PLAYERS[i], trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the same player accepted multiple trades', () => {
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SOME_PLAYER,
						recipientPlayer: SOME_OTHER_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_OTHER_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player created trades but none were accepted', () => {
				for (let i = 0; i < 5; i++) {
					forcePlayerToInitiateTrade(SOME_PLAYER, {
						recipientPlayer: FIVE_DIFFERENT_PLAYERS[i]
					})
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				console.log(result);
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not created any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.WIDE_DIPLOMAT.id
				});
				console.log(result);
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Chain Five Quest', () => {
			it('returns success when player accepted 5 distinct trades from 5 different players', () => {
				jest.useRealTimers();
				for (let i = 0; i < 5; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player accepted more than 5 distinct trades from different players', () => {
				for (let i = 0; i < 7; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: SEVEN_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player accepted 5 trades but from only 4 different players', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const trade = addMockTrade(db, {
					initiatingPlayer: FIVE_DIFFERENT_PLAYERS[0],
					recipientPlayer: SOME_PLAYER
				});
				forcePlayerToAcceptTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player accepted only 4 distinct trades from 5 different players', () => {
				for (let i = 0; i < 4; i++) {
					const trade = addMockTrade(db, {
						initiatingPlayer: FIVE_DIFFERENT_PLAYERS[i],
						recipientPlayer: SOME_PLAYER
					});
					forcePlayerToAcceptTrade(SOME_PLAYER, trade);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not accepted any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.CHAIN_FIVE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Pity Pass Quest', () => {
			it('returns success when player declined a trade where they would receive 20 more characters than they give', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player declined a trade where they would receive more than 20 more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abcdefghijklmnopqrstuvwxyz',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player was the initiator declining their own trade', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER,
					recipientPlayer: SOME_OTHER_PLAYER,
					offeredCharacters: '',
					requestedCharacters: '01234567890123456789',
					status: TradeStatuses.AWAITING_INITIATOR,
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player declined multiple trades and one meets criteria', () => {
				const trade1 = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade1);

				const trade2 = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '01234567890123456789',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade2);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player declined a trade with only 19 more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: '0123456789012345678',
					requestedCharacters: ''
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player declined a trade with equal characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'abc',
					requestedCharacters: 'def'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player declined a trade where they would give more characters', () => {
				const trade = addMockTrade(db, {
					initiatingPlayer: SOME_OTHER_PLAYER,
					recipientPlayer: SOME_PLAYER,
					offeredCharacters: 'a',
					requestedCharacters: 'abcdefghij'
				});
				forcePlayerToDeclineTrade(SOME_PLAYER, trade);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not declined any trades', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PITY_PASS.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Quest Hoard Quest', () => {
			it('returns success when player completed exactly 20 quests this week', () => {
				for (let i = 0; i < 20; i++) {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_HOARD.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player completed more than 20 quests this week', () => {
				for (let i = 0; i < 25; i++) {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_HOARD.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player completed only 19 quests this week', () => {
				for (let i = 0; i < 19; i++) {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_HOARD.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not completed any quests this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_HOARD.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Quad Combo Quest', () => {

			beforeEach(() => {
				jest.useFakeTimers({ now: START_OF_WEEK });
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			it('returns success when player completed 4 quests in a single moment', () => {
				for (let i = 0; i < 4; i++) {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				}

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player completed 4 quests in exactly 1 minute', () => {
				repeatOverDuration(4, { minutes: 1 }, () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player completed more than 4 quests in 1 minute', () => {
				repeatOverDuration(6, { minutes: 1 }, () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player completed 4 quests in exactly 1 minute and 1 second', () => {
				repeatOverDuration(4, { minutes: 1, seconds: 1 }, () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player completed only 3 quests in exactly 1 minute', () => {
				repeatOverDuration(3, { minutes: 1 }, () => {
					forcePlayerToCompleteNewQuest(SOME_PLAYER);
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player completed 4 quests but spread over more than 1 minute', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER);
				forcePlayerToCompleteNewQuest(SOME_PLAYER);
				jest.setSystemTime(addMinutes(new Date(), 1));
				jest.setSystemTime(addSeconds(new Date(), 1));
				forcePlayerToCompleteNewQuest(SOME_PLAYER);
				forcePlayerToCompleteNewQuest(SOME_PLAYER);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not completed any quests this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUAD_COMBO.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Name Match Quest', () => {
			it('returns success when player completed a quest while their name contained the quest name', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'I love Celestial quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Celestial'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player name exactly matches the quest name', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'Celestial');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Celestial'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success with case-insensitive matching', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'I did CELESTE THE QUEST today');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'cEleste'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player completed multiple quests and one matches', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'doing quests');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);

				forcePlayerToChangeName(SOME_PLAYER, 'Outer Space time');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Space'});

				forcePlayerToChangeName(SOME_PLAYER, 'another name');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player changed name after completing quest but name matched during completion', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'Coalitionists quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Coalitionists'});
				forcePlayerToChangeName(SOME_PLAYER, 'different name now');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player completed quests but name never contained any quest name', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'my unique name');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'another unique name'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player name contains part of quest name but not the full name', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'Gold quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Gold Ticket'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not completed any quests this week', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'Speed Mine');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Quest Bounty Quest', () => {
			it('returns success when the player gained exactly 20 characters from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: '01234567890123456789'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player gained more than 20 characters from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: 'abcdefghijklmnopqrstuvwxyz'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player gained 20 characters across multiple quest completions', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: '0123456789'
				});
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: 'abcdefghij'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the player only gained 19 characters from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: '0123456789012345678'
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player completed quests but received no character rewards', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					charactersReward: '',
					tokensReward: 100
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player has not completed any quests this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_BOUNTY.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Quest Riches Quest', () => {
			it('returns success when the player gained exactly 1500 tokens from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 1500
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player gained more than 1500 tokens from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 2000
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player gained 1500 tokens across multiple quest completions', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 500
				});
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 500
				});
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 500
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the player only gained 1499 tokens from quest rewards this week', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 1499
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player completed quests but lost tokens', () => {
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {
					tokensReward: 0
				});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player has not completed any quests this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.QUEST_RICHES.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Synchronized Quest', () => {

			beforeEach(() => {
				jest.useFakeTimers({ now: START_OF_WEEK });
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('returns success when the player completed a quest at the same moment as 5 other players', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(SOME_PLAYER, quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[0], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[1], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[2], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[3], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[4], quest);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player completed a quest exactly 60 seconds before 5 other players', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(SOME_PLAYER, quest);

				jest.setSystemTime(addSeconds(new Date(), 60));
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[0], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[1], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[2], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[3], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[4], quest);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when more than 6 players completed the same quest within 60 seconds', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(SOME_PLAYER, quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[0], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[1], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[2], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[3], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[4], quest);
				forcePlayerToCompleteQuest(SOME_OTHER_PLAYER, quest);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the player completed a quest exactly 61 seconds before 5 other players', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(SOME_PLAYER, quest);

				repeatOverDuration(5, { seconds: 61 }, (index) => {
					forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[index], quest);
				})

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when only 4 other players completed the same quest within 60 seconds', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(SOME_PLAYER, quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[0], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[1], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[2], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[3], quest);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player has not completed any quests this week', () => {
				const quest = addMockQuest(db);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[0], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[1], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[2], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[3], quest);
				forcePlayerToCompleteQuest(FIVE_DIFFERENT_PLAYERS[4], quest);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SYNCHRONIZED.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('No Perk Quest', () => {
			beforeEach(() => {
				jest.useFakeTimers({ now: START_OF_WEEK });
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('returns success when the player avoided picking perks for exactly 6 consecutive days', () => {
				jest.setSystemTime(addDays(START_OF_WEEK, 6));
				forcePlayerToPickNewPerk(SOME_PLAYER);
				jest.setSystemTime(RIGHT_BEFORE_END_OF_WEEK);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				console.log(result);
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player avoided picking perks for more than 6 consecutive days', () => {
				forcePlayerToPickNewPerk(SOME_PLAYER);
				jest.setSystemTime(RIGHT_BEFORE_END_OF_WEEK);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the player never picked any perks for 6 days since week start', () => {
				jest.setSystemTime(addDays(START_OF_WEEK, 6));

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when there is a 6-day gap between two perk picks', () => {
				forcePlayerToPickNewPerk(SOME_PLAYER);

				jest.setSystemTime(addDays(START_OF_WEEK, 6));
				forcePlayerToPickNewPerk(SOME_PLAYER);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the player picked perks with only 5-day gaps', () => {
				jest.setSystemTime(START_OF_WEEK);
				forcePlayerToPickNewPerk(SOME_PLAYER);

				jest.setSystemTime(addDays(START_OF_WEEK, 5));
				forcePlayerToPickNewPerk(SOME_PLAYER);

				jest.setSystemTime(RIGHT_BEFORE_END_OF_WEEK);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when the player picked perks every day', () => {
				for (let i = 0; i < 6; i++) {
					forcePlayerToPickNewPerk(SOME_PLAYER);
					jest.setSystemTime(addDays(new Date(), 1));
				}

				jest.setSystemTime(RIGHT_BEFORE_END_OF_WEEK);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when only 5 days have passed since week start with no picks', () => {
				jest.setSystemTime(addDays(START_OF_WEEK, 5));

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NO_PERK.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Perk Name Quest', () => {
			it('returns success when player picked a perk while their current name contains the perk name', () => {
				const perk = addMockPerk(db, { name: 'Celestial' });
				forcePlayerToChangeName(SOME_PLAYER, 'I love Celestial perks');
				forcePlayerToPickPerk(SOME_PLAYER, perk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the current name exactly matches the perk name', () => {
				const perk = addMockPerk(db, { name: 'Lunar' });
				forcePlayerToChangeName(SOME_PLAYER, 'Lunar');
				forcePlayerToPickPerk(SOME_PLAYER, perk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player picked multiple perks and one matches their current name', () => {
				const perk1 = addMockPerk(db, { name: 'Alpha' });
				const perk2 = addMockPerk(db, { name: 'Beta' });
				const perk3 = addMockPerk(db, { name: 'Gamma' });

				forcePlayerToChangeName(SOME_PLAYER, 'other name');
				forcePlayerToPickPerk(SOME_PLAYER, perk1);

				forcePlayerToChangeName(SOME_PLAYER, 'I choose Beta now');
				forcePlayerToPickPerk(SOME_PLAYER, perk2);

				forcePlayerToChangeName(SOME_PLAYER, 'different');
				forcePlayerToPickPerk(SOME_PLAYER, perk3);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player picked a perk but their current name does not contain the perk name', () => {
				const perk = addMockPerk(db, { name: 'Celestial' });
				forcePlayerToChangeName(SOME_PLAYER, 'My unique name');
				forcePlayerToPickPerk(SOME_PLAYER, perk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player does not have a current name', () => {
				const perk = addMockPerk(db, { name: 'Celestial' });
				forcePlayerToPickPerk(SOME_PLAYER, perk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not picked any perks this week', () => {
				forcePlayerToPublishName(SOME_PLAYER, 'Celestial');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				console.log(result);
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Unique Perk Quest', () => {
			it('returns success when player picked a perk that no other player has', () => {
				const uniquePerk = addMockPerk(db, { name: 'Unique' });
				forcePlayerToPickPerk(SOME_PLAYER, uniquePerk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UNIQUE_PERK.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player picked multiple perks and one is unique', () => {
				const sharedPerk = addMockPerk(db, { name: 'Shared' });
				const uniquePerk = addMockPerk(db, { name: 'Unique' });

				forcePlayerToPickPerk(SOME_OTHER_PLAYER, sharedPerk);
				forcePlayerToPickPerk(SOME_PLAYER, sharedPerk);
				forcePlayerToPickPerk(SOME_PLAYER, uniquePerk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UNIQUE_PERK.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when all perks the player picked are also selected by other players', () => {
				const sharedPerk1 = addMockPerk(db, { name: 'Shared1' });
				const sharedPerk2 = addMockPerk(db, { name: 'Shared2' });

				forcePlayerToPickPerk(SOME_OTHER_PLAYER, sharedPerk1);
				forcePlayerToPickPerk(THREE_DIFFERENT_PLAYERS[0], sharedPerk2);

				forcePlayerToPickPerk(SOME_PLAYER, sharedPerk1);
				forcePlayerToPickPerk(SOME_PLAYER, sharedPerk2);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UNIQUE_PERK.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not picked any perks this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UNIQUE_PERK.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Fast Fortune Quest', () => {
			it('returns success when player gained exactly 2000 tokens this week', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 2000);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.FAST_FORTUNE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player gained more than 2000 tokens this week', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 2500);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.FAST_FORTUNE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player gained 2000 tokens from multiple sources', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 1000);
				forcePlayerToBuyMysteryBox(SOME_PLAYER);
				forcePlayerToCompleteNewQuest(SOME_PLAYER, { tokensReward: 500 });
				forcePlayerToClaimRefill(SOME_PLAYER, 500);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.FAST_FORTUNE.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player only gained 1999 tokens this week', () => {
				forcePlayerToMineTokens(SOME_PLAYER, 1999);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.FAST_FORTUNE.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not gained any tokens this week', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.FAST_FORTUNE.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Complete Set Quest', () => {
			it('returns success when player has exactly 100 distinct characters in inventory', () => {
				let characters = '';
				for (let i = 0; i < 100; i++) {
					characters += String.fromCharCode(65 + i);
				}
				forcePlayerToHaveInventory(SOME_PLAYER, characters);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.COMPLETE_SET.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player has more than 100 distinct characters in inventory', () => {
				let characters = '';
				for (let i = 0; i < 120; i++) {
					characters += String.fromCharCode(65 + i);
				}
				forcePlayerToHaveInventory(SOME_PLAYER, characters);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.COMPLETE_SET.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player has 100 distinct characters with duplicates', () => {
				let characters = '';
				for (let i = 0; i < 100; i++) {
					characters += String.fromCharCode(65 + i);
					characters += String.fromCharCode(65 + i); // Add duplicate
				}
				forcePlayerToHaveInventory(SOME_PLAYER, characters);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.COMPLETE_SET.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player has only 99 distinct characters in inventory', () => {
				let characters = '';
				for (let i = 0; i < 99; i++) {
					characters += String.fromCharCode(65 + i);
				}
				forcePlayerToHaveInventory(SOME_PLAYER, characters);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.COMPLETE_SET.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has an empty inventory', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.COMPLETE_SET.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});

		describe('Silent Server Quest', () => {
			beforeEach(() => {
				jest.useFakeTimers({ now: addHours(START_OF_WEEK, 1) });
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('returns success when no player changed their name for exactly 8 hours this week', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addHours(new Date(), 8));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when no player changed their name for more than 8 hours this week', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addHours(new Date(), 12));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when there are multiple gaps and one is at least 8 hours', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'First');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Second');
				jest.setSystemTime(addHours(new Date(), 8));

				forcePlayerToChangeName(THREE_DIFFERENT_PLAYERS[0], 'Third');
				jest.setSystemTime(addHours(new Date(), 2));

				forcePlayerToChangeName(THREE_DIFFERENT_PLAYERS[1], 'Fourth');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the gap from last change to now is at least 8 hours', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'First change');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Last change');
				jest.setSystemTime(addHours(new Date(), 8));

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the longest gap is only 7 hours and 59 minutes', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addMinutes(addHours(new Date(), 7), 59));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when players change names frequently with no 8-hour gap', () => {
				forcePlayerToChangeName(SOME_PLAYER, 'Change 1');
				jest.setSystemTime(addHours(new Date(), 3));

				forcePlayerToChangeName(SOME_OTHER_PLAYER, 'Change 2');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToChangeName(THREE_DIFFERENT_PLAYERS[0], 'Change 3');
				jest.setSystemTime(addHours(new Date(), 2));

				forcePlayerToChangeName(THREE_DIFFERENT_PLAYERS[1], 'Change 4');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});
	});
});
