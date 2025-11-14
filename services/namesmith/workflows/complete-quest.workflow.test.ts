import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_QUEST_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { ActivityLogService } from "../services/activity-log.service";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { completeQuest } from "./complete-quest.workflow";
import { returnIfNotFailure } from "./workflow-result-creator";

describe('completeQuest()', () => {
  let db: DatabaseQuerier;
	let activityLogService: ActivityLogService;

  let SOME_PLAYER: Player;
  let SOME_QUEST: Quest;

  beforeEach(() => {
    ({ db, activityLogService } = setupMockNamesmith());
    SOME_PLAYER = addMockPlayer(db, {});
    SOME_QUEST = addMockQuest(db, {});
  });

  describe('completeQuest()', () => {
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
      makeSure(result.isNonPlayer()).isTrue();
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
      makeSure(result.isPlayerAlreadyCompletedQuest()).isTrue();
    });
  });
});