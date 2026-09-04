import { addDuration, addHours, addMinutes, addSeconds } from "../../../../../utilities/date-time-utils";
import { makeSure, repeatOverDuration } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPlayer, forcePlayerToRearrangeName } from '../../../mocks/mock-data/mock-players';
import { addMockQuest, forcePlayerToCompleteNewQuest, forcePlayerToCompleteQuest } from "../../../mocks/mock-data/mock-quests";
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
				forcePlayerToRearrangeName(SOME_PLAYER, 'I love Celestial quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Celestial'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player name exactly matches the quest name', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'Celestial');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Celestial'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success with case-insensitive matching', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'I did CELESTE THE QUEST today');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'cEleste'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player completed multiple quests and one matches', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'doing quests');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);

				forcePlayerToRearrangeName(SOME_PLAYER, 'Outer Space time');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Space'});

				forcePlayerToRearrangeName(SOME_PLAYER, 'another name');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when player changed name after completing quest but name matched during completion', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'Coalitionists quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Coalitionists'});
				forcePlayerToRearrangeName(SOME_PLAYER, 'different name now');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when player completed quests but name never contained any quest name', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'my unique name');
				forcePlayerToCompleteNewQuest(SOME_PLAYER);
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'another unique name'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player name contains part of quest name but not the full name', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'Gold quest');
				forcePlayerToCompleteNewQuest(SOME_PLAYER, {name: 'Gold Ticket'});

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.NAME_MATCH.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when player has not completed any quests this week', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'Speed Mine');

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
	});});