import { addHours, addMinutes, addSeconds } from "../../../../../utilities/date-time-utils";
import { makeSure, repeatOverDuration } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPlayer, forcePlayerToMineTokens } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../../mocks/mock-data/mock-recipes';
import { setupMockNamesmith } from "../../../mocks/mock-setup";
import { Player } from "../../../types/player.types";
import { Recipe } from '../../../types/recipe.types';
import { completeQuest } from "../complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;

  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		
    ({ db } = setupMockNamesmith(START_OF_WEEK));
    SOME_PLAYER = addMockPlayer(db, {});
    addMockQuest(db, {
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
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has mined 0 tokens from all mines this week', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.GOLD_SPIKE
					});
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
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has never mined any tokens', () => {
					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.TEN_MINUTE_RUSH.id
					});
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
	});});