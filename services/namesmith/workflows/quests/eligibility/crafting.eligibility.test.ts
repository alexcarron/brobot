import { addMinutes } from "../../../../../utilities/date-time-utils";
import { makeSure } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { UTILITY_CHARACTERS } from "../../../constants/character.constants";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPlayer } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraftRecipe, forcePlayerToCraftNewRecipe } from '../../../mocks/mock-data/mock-recipes';
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
				makeSure(result.isFailure()).isTrue();
			});

			it('returns a failure when the player never crafted a recipe', () => {
				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.UTILITY_MASTER.id
				});
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
	});});