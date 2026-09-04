import { addDays, addDuration, addMinutes } from "../../../../../utilities/date-time-utils";
import { makeSure } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPerk, forcePlayerToPickNewPerk, forcePlayerToPickPerk } from "../../../mocks/mock-data/mock-perks";
import { addMockPlayer, forcePlayerToRearrangeName, forcePlayerToPublishName } from '../../../mocks/mock-data/mock-players';
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
				forcePlayerToRearrangeName(SOME_PLAYER, 'I love Celestial perks');
				forcePlayerToPickPerk(SOME_PLAYER, perk);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the current name exactly matches the perk name', () => {
				const perk = addMockPerk(db, { name: 'Lunar' });
				forcePlayerToRearrangeName(SOME_PLAYER, 'Lunar');
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

				forcePlayerToRearrangeName(SOME_PLAYER, 'other name');
				forcePlayerToPickPerk(SOME_PLAYER, perk1);

				forcePlayerToRearrangeName(SOME_PLAYER, 'I choose Beta now');
				forcePlayerToPickPerk(SOME_PLAYER, perk2);

				forcePlayerToRearrangeName(SOME_PLAYER, 'different');
				forcePlayerToPickPerk(SOME_PLAYER, perk3);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.PERK_NAME.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player picked a perk but their current name does not contain the perk name', () => {
				const perk = addMockPerk(db, { name: 'Celestial' });
				forcePlayerToRearrangeName(SOME_PLAYER, 'My unique name');
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
	});});