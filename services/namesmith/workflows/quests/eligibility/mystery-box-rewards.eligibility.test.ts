import { addMinutes } from "../../../../../utilities/date-time-utils";
import { makeSure } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { forcePlayerToBuyMysteryBox, forcePlayerToBuyNewMysteryBox } from "../../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToRearrangeName } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../../mocks/mock-data/mock-recipes';
import { setupMockNamesmith } from "../../../mocks/mock-setup";
import { Player } from "../../../types/player.types";
import { Recipe } from '../../../types/recipe.types';
import { completeQuest } from "../complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;

  let SOME_PLAYER: Player;
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

  });

  describe('completeQuest()', () => {
			describe('Familiar Face Quest', () => {
				it('returns a success if the player got a character from a mystery box already in their name', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'abcdefghijklmnopqrstuvwxyz');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'bcdefghijklmnopqrstuvwxyz');
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

			describe('Rightmost Quest', () => {
				it('returns success when player has received the rightmost character of their name from a mystery box', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'abcdefg');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'hello');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});
					forcePlayerToRearrangeName(SOME_PLAYER, 'hello');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'b': 1}
					});
					forcePlayerToRearrangeName(SOME_PLAYER, 'hello');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'testname');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when player has bought mystery boxes but none contain the rightmost character', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'a': 1}
					});
					forcePlayerToRearrangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'b': 1}
					});
					forcePlayerToRearrangeName(SOME_PLAYER, 'abcdefg');
					forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
						characterOdds: {'c': 1}
					});

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.RIGHTMOST.id
					});
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
	});});