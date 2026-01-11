import { makeSure } from "../../../../utilities/jest/jest-utils";
import { DatabaseQuerier } from "../../database/database-querier";
import { ActivityLogService } from "../../services/activity-log.service";
import { Player } from "../../types/player.types";
import { setupMockNamesmith } from "../mock-setup";
import { addMockPlayer } from "./mock-players";
import { forcePlayerToCompleteNewQuest } from "./mock-quests";

describe('mock-quests', () => {
	let activityLogService: ActivityLogService;
	let db: DatabaseQuerier;

	let SOME_PLAYER: Player;

	beforeAll(() => {
		({ db, activityLogService } = setupMockNamesmith());
		SOME_PLAYER = addMockPlayer(db);
	});

	describe('forcePlayerToCompleteNewQuest', () => {
		it('works with no quest definition', () => {
			const result = forcePlayerToCompleteNewQuest(SOME_PLAYER);

			makeSure(result.player.id).is(SOME_PLAYER.id);

			const wasCompleted = activityLogService.hasPlayerAlreadyCompletedQuest(SOME_PLAYER, result.quest);
			makeSure(wasCompleted).isTrue();
		});

		it('works with all quest definition properties', () => {
			const result = forcePlayerToCompleteNewQuest(SOME_PLAYER, {
				name: 'quest name',
				description: 'quest description',
				tokensReward: 10,
				charactersReward: 'quest characters reward',
				wasShown: true,
				isShown: true,
			});

			makeSure(result.player.id).is(SOME_PLAYER.id);
			makeSure(result.quest.name).is('quest name');
			makeSure(result.quest.description).is('quest description');
			makeSure(result.quest.tokensReward).is(10);
			makeSure(result.quest.charactersReward).is('quest characters reward');
			makeSure(result.quest.wasShown).isTrue();
			makeSure(result.quest.isShown).isTrue();

			const wasCompleted = activityLogService.hasPlayerAlreadyCompletedQuest(SOME_PLAYER, result.quest);
			makeSure(wasCompleted).isTrue();
		});
	});
});