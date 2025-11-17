import { makeSure } from "../../../utilities/jest/jest-utils";
import { getRandomUUID } from "../../../utilities/random-utils";
import { Quests } from "../constants/quests.constants";
import { FREEBIE_QUEST_NAME, INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { ActivityLogService } from "../services/activity-log.service";
import { PlayerService } from "../services/player.service";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { assertNotFailure, returnIfNotFailure } from "../utilities/workflow.utility";
import { completeQuest } from "./complete-quest.workflow";

describe('completeQuest()', () => {
  let db: DatabaseQuerier;
	let activityLogService: ActivityLogService;
	let playerService: PlayerService;

  let SOME_PLAYER: Player;
  let SOME_QUEST: Quest;

  beforeEach(() => {
    ({ db, activityLogService, playerService } = setupMockNamesmith());
    SOME_PLAYER = addMockPlayer(db, {});
    SOME_QUEST = addMockQuest(db, {
			name: FREEBIE_QUEST_NAME + getRandomUUID()
		});
  });

  describe('completeQuest()', () => {
		it('should give the rewards of the quest to the player', () => {
			const questWithRewards = addMockQuest(db, {
				name: FREEBIE_QUEST_NAME + getRandomUUID(),
				tokensReward: 28,
				charactersReward: 'Abc34#🔥',
			});

			assertNotFailure(
				completeQuest({
					player: SOME_PLAYER,
					quest: questWithRewards
				})
			);

			const resolvedPlayer = playerService.resolvePlayer(SOME_PLAYER.id);

			makeSure(resolvedPlayer.tokens).is(SOME_PLAYER.tokens + 28);
			makeSure(resolvedPlayer.inventory).is(SOME_PLAYER.inventory + 'Abc34#🔥');
		});

    it('should log the quest as completed in the activity log', () => {
      const activityLogSpy = jest.spyOn(activityLogService, 'logCompleteQuest');

      completeQuest({ player: SOME_PLAYER, quest: SOME_QUEST });

      makeSure(activityLogSpy).toHaveBeenCalledWith({
        playerCompletingQuest: SOME_PLAYER,
        questCompleted: SOME_QUEST,
      });
    });

    it('should return a success result if the player successfully completes the quest', () => {
      const result = returnIfNotFailure(
				completeQuest({ player: SOME_PLAYER, quest: SOME_QUEST })
			);

      makeSure(result.isFailure()).isFalse();
    });

    it('should return nonPlayer failure if the player does not exist', () => {
      const result = completeQuest({
				player: INVALID_PLAYER_ID,
				quest: SOME_QUEST
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isNotAPlayer()).isTrue();
    });

    it('should return questDoesNotExist failure if the quest does not exist', () => {
      const result = completeQuest({
				player: SOME_PLAYER,
				quest: INVALID_QUEST_ID
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isQuestDoesNotExist()).isTrue();
    });

    it('should return playerAlreadyCompletedQuest failure if the player has already completed the quest', () => {
			// First complete the quest once
			completeQuest({ player: SOME_PLAYER, quest: SOME_QUEST });

			// Try to complete the same quest again
      const result = completeQuest({
				player: SOME_PLAYER,
				quest: SOME_QUEST
			});

      makeSure(result.isFailure()).isTrue();
      makeSure(result.isAlreadyCompletedQuest()).isTrue();
    });

		it('should return notEligibleToCompleteQuest failure if the player has not gained 1000 tokens while trying to claim the Get Rich Quick quest', () => {
			const result = completeQuest({
				player: SOME_PLAYER,
				quest: Quests.GET_RICH_QUICK
			});

			makeSure(result.isFailure()).isTrue();
			makeSure(result.isNotEligibleToCompleteQuest()).isTrue();
		});
  });
});