import { addMinutes } from "../../../../utilities/date-time-utils";
import { makeSure } from "../../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../../utilities/random-utils";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../../constants/testing.constants";
import { DatabaseQuerier } from "../../database/database-querier";
import { getLatestActivityLog } from "../../mocks/mock-data/mock-activity-logs";
import { addMockPlayer } from '../../mocks/mock-data/mock-players';
import { addMockQuest } from "../../mocks/mock-data/mock-quests";
import { addMockRecipe } from '../../mocks/mock-data/mock-recipes';
import { setupMockNamesmith } from "../../mocks/mock-setup";
import { PlayerService } from "../../services/player.service";
import { ActivityTypes } from "../../types/activity-log.types";
import { Player } from "../../types/player.types";
import { Quest } from "../../types/quest.types";
import { Recipe } from '../../types/recipe.types';
import { throwIfNotFailure, returnIfNotFailure } from "../../utilities/workflow.utility";
import { completeQuest } from "./complete-quest.workflow";

describe('complete-quest.workflow.ts', () => {
  let db: DatabaseQuerier;
	let playerService: PlayerService;

  let SOME_QUEST: Quest;
  let SOME_PLAYER: Player;
	let FIVE_DIFFERENT_RECIPES: Recipe[];
	let THREE_DIFFERENT_PLAYERS: Player[];
	let FIVE_DIFFERENT_PLAYERS: Player[];
	let SEVEN_DIFFERENT_PLAYERS: Player[];

	let START_OF_WEEK: Date;

  beforeEach(() => {
		START_OF_WEEK = addMinutes(new Date(), -1);
		
    ({ db, playerService } = setupMockNamesmith(START_OF_WEEK));
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

		});

	});
});
