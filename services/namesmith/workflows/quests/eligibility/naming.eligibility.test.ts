import { addDuration, addHours, addMinutes } from "../../../../../utilities/date-time-utils";
import { failTest, makeSure } from "../../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../../utilities/random-utils";
import { Quests } from "../../../constants/quest.constants";
import { FREEBIE_QUEST_NAME } from "../../../constants/testing.constants";
import { DatabaseQuerier } from "../../../database/database-querier";
import { addMockPerk } from "../../../mocks/mock-data/mock-perks";
import { addMockPlayer, forcePlayerToRearrangeName, forcePlayerToPublishName } from '../../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../../mocks/mock-data/mock-recipes';
import { addMockRole } from "../../../mocks/mock-data/mock-roles";
import { setupMockNamesmith } from "../../../mocks/mock-setup";
import { GameStateService } from "../../../services/game-state.service";
import { Perk } from "../../../types/perk.types";
import { Player } from "../../../types/player.types";
import { Recipe } from '../../../types/recipe.types';
import { Role } from "../../../types/role.types";
import { completeQuest } from "../complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;
	let gameStateService: GameStateService;

  let SOME_PLAYER: Player;
	let SOME_OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;
	let RIGHT_BEFORE_END_OF_DAY: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		RIGHT_BEFORE_END_OF_DAY = addDuration(START_OF_WEEK, { days: 1, minutes: -1 });
		
    ({ db, gameStateService } = setupMockNamesmith(START_OF_WEEK));
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

			describe('Echoed Name Quest', () => {
				it('returns success for Echoed Name quest if player has changed their name to a repeated version of itself', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'Echo');
					forcePlayerToRearrangeName(SOME_PLAYER, 'EchoEcho');

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.ECHOED_NAME.id
						}).isFailure()
					).isFalse();
				});

				it('returns failure for Echoed Name quest if player has not changed their name to a repeated version of itself', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'Echo');
					forcePlayerToRearrangeName(SOME_PLAYER, 'Echo Echo');

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
					forcePlayerToRearrangeName(NAMED_PLAYER, "Shared Name");
					forcePlayerToRearrangeName(OTHER_NAMED_PLAYER, "Shared Name");

					jest.setSystemTime(AFTER_TWO_HOUR_INTERVAL);
					forcePlayerToRearrangeName(NAMED_PLAYER, "Player Name");
					forcePlayerToRearrangeName(OTHER_NAMED_PLAYER, "Other Player Name");

					makeSure(
						completeQuest({
							playerResolvable: NAMED_PLAYER.id,
							questResolvable: Quests.IDENTITY_THEFT.id
						}).isFailure()
					).isFalse();
				});

				it('returns a failure when the player and other player has changed their name to the same name without changing it again for 1 hour and 59 minutes hours', () => {
					jest.setSystemTime(BEFORE_TWO_HOUR_INTERVAL);
					forcePlayerToRearrangeName(NAMED_PLAYER, "Shared Name");
					forcePlayerToRearrangeName(OTHER_NAMED_PLAYER, "Shared Name");

					jest.setSystemTime(
						addMinutes(AFTER_TWO_HOUR_INTERVAL, -1)
					);
					forcePlayerToRearrangeName(NAMED_PLAYER, "Player Name");
					forcePlayerToRearrangeName(OTHER_NAMED_PLAYER, "Other Player Name");

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
						forcePlayerToRearrangeName(SOME_PLAYER, `Name ${numLoop}`);
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
						forcePlayerToRearrangeName(SOME_PLAYER, `Name ${numLoop}`);
					}

					makeSure(
						completeQuest({
							playerResolvable: SOME_PLAYER.id,
							questResolvable: Quests.FRAGILE_NAME.id
						}).isFailure()
					).isTrue();
				})
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
					forcePlayerToRearrangeName(PLAYER_WITH_PERKS, PERK1.name);
					const result = completeQuest({
						playerResolvable: PLAYER_WITH_PERKS,
						questResolvable: Quests.PERK_PRIDE
					});
					makeSure(result.isFailure()).isFalse();
				});
				
				it('returns success when the player name contains one of their perk names', () => {
					forcePlayerToRearrangeName(PLAYER_WITH_PERKS, `In between ${PERK1.name} characters`);
					const result = completeQuest({
						playerResolvable: PLAYER_WITH_PERKS,
						questResolvable: Quests.PERK_PRIDE
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player name does not contain any of their perk names', () => {
					forcePlayerToRearrangeName(PLAYER_WITH_PERKS, 'new name');
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
					forcePlayerToRearrangeName(SOME_PLAYER, SOME_ROLE.name);
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.ROLE_CALL
					});
					makeSure(result.isFailure()).isFalse();
				});
				
				it('returns success when the player name contains their role name', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, `In between ${SOME_ROLE.name} characters`);
					const result = completeQuest({
						playerResolvable: SOME_PLAYER,
						questResolvable: Quests.ROLE_CALL
					});
					makeSure(result.isFailure()).isFalse();
				});

				it('returns failure when the player name does not contain their role name', () => {
					forcePlayerToRearrangeName(SOME_PLAYER, 'new name');
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

		describe('Silent Server Quest', () => {
			beforeEach(() => {
				jest.useFakeTimers({ now: addHours(START_OF_WEEK, 1) });
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('returns success when no player changed their name for exactly 8 hours this week', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addHours(new Date(), 8));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when no player changed their name for more than 8 hours this week', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addHours(new Date(), 12));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when there are multiple gaps and one is at least 8 hours', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'First');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Second');
				jest.setSystemTime(addHours(new Date(), 8));

				forcePlayerToRearrangeName(THREE_DIFFERENT_PLAYERS[0], 'Third');
				jest.setSystemTime(addHours(new Date(), 2));

				forcePlayerToRearrangeName(THREE_DIFFERENT_PLAYERS[1], 'Fourth');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns success when the gap from last change to now is at least 8 hours', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'First change');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Last change');
				jest.setSystemTime(addHours(new Date(), 8));

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isFalse();
			});

			it('returns failure when the longest gap is only 7 hours and 59 minutes', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'First change');

				jest.setSystemTime(addMinutes(addHours(new Date(), 7), 59));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Second change');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isTrue();
			});

			it('returns failure when players change names frequently with no 8-hour gap', () => {
				forcePlayerToRearrangeName(SOME_PLAYER, 'Change 1');
				jest.setSystemTime(addHours(new Date(), 3));

				forcePlayerToRearrangeName(SOME_OTHER_PLAYER, 'Change 2');
				jest.setSystemTime(addHours(new Date(), 4));

				forcePlayerToRearrangeName(THREE_DIFFERENT_PLAYERS[0], 'Change 3');
				jest.setSystemTime(addHours(new Date(), 2));

				forcePlayerToRearrangeName(THREE_DIFFERENT_PLAYERS[1], 'Change 4');

				const result = completeQuest({
					playerResolvable: SOME_PLAYER.id,
					questResolvable: Quests.SILENT_SERVER.id
				});
				makeSure(result.isFailure()).isTrue();
			});
		});
	});});