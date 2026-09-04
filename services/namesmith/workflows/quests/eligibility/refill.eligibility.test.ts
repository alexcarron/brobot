import { addDuration, addHours, addMinutes, addSeconds } from "../../../../../utilities/date-time-utils";
import { makeSure, repeatEveryIntervalUntil } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { REFILL_COOLDOWN_DURATION } from "../../../constants/claim-refill.constants";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPlayer, forcePlayerToClaimRefill } from '../../../mocks/mock-data/mock-players';
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
	let RIGHT_BEFORE_END_OF_WEEK: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		RIGHT_BEFORE_END_OF_WEEK = addDuration(START_OF_WEEK, { days: 7, minutes: -1 });
		
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

					jest.setSystemTime(addDuration(new Date(), REFILL_COOLDOWN_DURATION));
					forcePlayerToClaimRefill(SOME_PLAYER);

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.INSTANT_REFILL.id
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns a success if the player claimed a refill 60 seconds after the cooldown expired', () => {
					forcePlayerToClaimRefill(SOME_PLAYER);

					jest.setSystemTime(addDuration(new Date(), REFILL_COOLDOWN_DURATION));
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

					jest.setSystemTime(addDuration(new Date(), REFILL_COOLDOWN_DURATION));
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
					makeSure(result.isFailure()).isTrue();
				});
			});
	});});