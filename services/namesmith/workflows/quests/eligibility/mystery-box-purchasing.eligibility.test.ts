import { addHours, addMinutes, addSeconds } from "../../../../../utilities/date-time-utils";
import { makeSure, repeatOverDuration } from "../../../../../utilities/jest/jest-utils";
import { repeat } from "../../../../../utilities/loop-utils";
import { getBetween, getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { forcePlayerToBuyMysteryBox, forcePlayerToBuyNewMysteryBox } from "../../../mocks/mock-data/mock-mystery-boxes";
import { addMockPlayer, forcePlayerToRearrangeName, forcePlayerToClaimRefill, forcePlayerToMineTokens, forcePlayerToPublishName } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../../mocks/mock-data/mock-recipes';
import { setupMockNamesmith } from "../../../mocks/mock-setup";
import { MysteryBoxService } from "../../../services/mystery-box.service";
import { PlayerService } from "../../../services/player.service";
import { Player } from "../../../types/player.types";
import { Recipe } from '../../../types/recipe.types';
import { completeQuest } from "../complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;
	let playerService: PlayerService;
	let mysteryBoxService: MysteryBoxService;

  let SOME_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		
    ({ db, playerService, mysteryBoxService } = setupMockNamesmith(START_OF_WEEK));
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

			describe('Priced Right Quest', () => {
				it('returns success when the player bought a mystery box and their name contains the box price', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'My price is 50 tokens');
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
					forcePlayerToRearrangeName(SOME_PLAYER, '100');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'Box costs 75 tokens');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'My name has no price');
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
					forcePlayerToRearrangeName(SOME_PLAYER, 'Price 123');
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
					makeSure(result.isFailure()).isTrue();
				});

				it('returns failure when the player has not bought any mystery boxes', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'Some name');

					const result = completeQuest({
						playerResolvable: SOME_PLAYER.id,
						questResolvable: Quests.PRICED_RIGHT.id
					});
					makeSure(result.isFailure()).isTrue();
				});
			});
	});});