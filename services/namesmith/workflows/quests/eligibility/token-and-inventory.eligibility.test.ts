import { addMinutes } from "../../../../../utilities/date-time-utils";
import { makeSure } from "../../../../../utilities/jest/jest-utils";
import { getBetween, getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { forcePlayerToBuyMysteryBox, forcePlayerToBuyNewMysteryBox } from "../../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToClaimRefill, forcePlayerToHaveInventory, forcePlayerToMineTokens } from '../../../mocks/mock-data/mock-players';
import { addMockQuest, forcePlayerToCompleteNewQuest } from "../../../mocks/mock-data/mock-quests";
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
	});});