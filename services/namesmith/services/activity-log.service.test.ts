import { getToday, getTomorrow, getYesterday } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_RECIPE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { ActivityTypes } from "../types/activity-log.types";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { PlayerNotFoundError, QuestNotFoundError, RecipeNotFoundError } from "../utilities/error.utility";
import { ActivityLogService } from "./activity-log.service";

describe('ActivityLogService', () => {
	let activityLogService: ActivityLogService;
	let db: DatabaseQuerier;

	let SOME_PLAYER: Player;
	let SOME_RECIPE: Recipe;
	let SOME_QUEST: Quest;

	let YESTERDAY: Date;
	let TODAY: Date;
	let TOMORROW: Date;

	beforeEach(() => {
		activityLogService = ActivityLogService.asMock();
		db = activityLogService.activityLogRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		SOME_RECIPE = addMockRecipe(db);
		SOME_QUEST = addMockQuest(db);

		YESTERDAY = getYesterday();
		TODAY = getToday();
		TOMORROW = getTomorrow();
	});

	describe('logCraftCharacter()', () => {
		it('creates a new activity log for crafting characters', () => {
			const activityLog = activityLogService.logCraftCharacters({
				playerCrafting: SOME_PLAYER.id,
				recipeUsed: SOME_RECIPE.id
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CRAFT_CHARACTERS,
				tokensDifference: 0,
				involvedRecipe: SOME_RECIPE,
				involvedPlayer: null,
			});

			const resolvedActivityLog = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolvedActivityLog).is(activityLog);
		});

		it('throws a PlayerNotFoundError if the given player resolvable is invalid', () => {
			makeSure(() =>
				activityLogService.logCraftCharacters({
					playerCrafting: INVALID_PLAYER_ID,
					recipeUsed: SOME_RECIPE.id
				})
			).throws(PlayerNotFoundError);
		});

		it('throws a RecipeNotFoundError if the given recipe resolvable is invalid', () => {
			makeSure(() =>
				activityLogService.logCraftCharacters({
					playerCrafting: SOME_PLAYER.id,
					recipeUsed: INVALID_RECIPE_ID
				})
			).throws(RecipeNotFoundError);
		});
	});

	describe('logAcceptTrade()', () => {
		it('creates a new activity log for accepting a trade', () => {
			const OTHER_PLAYER = addMockPlayer(db);

			const activityLog = activityLogService.logAcceptTrade({
				playerAcceptingTrade: SOME_PLAYER.id,
				playerAwaitingAcceptance: OTHER_PLAYER.id
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.ACCEPT_TRADE,
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if accepting player is invalid', () => {
			const OTHER_PLAYER = addMockPlayer(db);

			makeSure(() =>
				activityLogService.logAcceptTrade({
					playerAcceptingTrade: INVALID_PLAYER_ID,
					playerAwaitingAcceptance: OTHER_PLAYER.id
				})
			).throws(PlayerNotFoundError);
		});

		it('throws PlayerNotFoundError if awaiting-acceptance player is invalid', () => {
			makeSure(() =>
				activityLogService.logAcceptTrade({
					playerAcceptingTrade: SOME_PLAYER.id,
					playerAwaitingAcceptance: INVALID_PLAYER_ID
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logBuyMysteryBox()', () => {
		it('creates a new activity log for buying a mystery box with negative tokensDifference', () => {
			const activityLog = activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				tokensSpent: 150
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -150,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if the buying player is invalid', () => {
			makeSure(() =>
				activityLogService.logBuyMysteryBox({
					playerBuyingBox: INVALID_PLAYER_ID,
					tokensSpent: 50
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logMineTokens()', () => {
		it('creates a new activity log for mining tokens with positive tokensDifference', () => {
			const activityLog = activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 75
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 75,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if the mining player is invalid', () => {
			makeSure(() =>
				activityLogService.logMineTokens({
					playerMining: INVALID_PLAYER_ID,
					tokensEarned: 10
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logClaimRefill()', () => {
		it('creates a new activity log for claiming a refill', () => {
			const activityLog = activityLogService.logClaimRefill({
				playerRefilling: SOME_PLAYER.id,
				tokensEarned: 20
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 20,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if the refilling player is invalid', () => {
			makeSure(() =>
				activityLogService.logClaimRefill({
					playerRefilling: INVALID_PLAYER_ID,
					tokensEarned: 5
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logCompleteQuest()', () => {
		it('creates a new activity log for completing a quest', () => {
			const activityLog = activityLogService.logCompleteQuest({
				playerCompletingQuest: SOME_PLAYER.id,
				questCompleted: SOME_QUEST.id
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.COMPLETE_QUEST,
				tokensDifference: 0,
				involvedQuest: SOME_QUEST,
				involvedPlayer: null,
				involvedRecipe: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if completing player is invalid', () => {
			makeSure(() =>
				activityLogService.logCompleteQuest({
					playerCompletingQuest: INVALID_PLAYER_ID,
					questCompleted: SOME_QUEST.id
				})
			).throws(PlayerNotFoundError);
		});

		it('throws QuestNotFoundError if the quest is invalid', () => {
			makeSure(() =>
				activityLogService.logCompleteQuest({
					playerCompletingQuest: SOME_PLAYER.id,
					questCompleted: INVALID_QUEST_ID
				})
			).throws(QuestNotFoundError);
		});
	});

	describe('logPickPerk()', () => {
		it('creates a new activity log for picking a perk with tokensEarned provided', () => {
			const activityLog = activityLogService.logPickPerk({
				playerPickingPerk: SOME_PLAYER.id,
				tokensEarned: 12
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.PICK_PERK,
				tokensDifference: 12,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('creates a new activity log for picking a perk without tokensEarned (defaults to 0)', () => {
			const activityLog = activityLogService.logPickPerk({
				playerPickingPerk: SOME_PLAYER.id
				// tokensEarned omitted
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.PICK_PERK,
				tokensDifference: 0,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if picking player is invalid', () => {
			makeSure(() =>
				activityLogService.logPickPerk({
					playerPickingPerk: INVALID_PLAYER_ID,
					tokensEarned: 1
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('hasPlayerCompletedQuest()', () => {
		it('returns true if the player has completed the quest', () => {
			activityLogService.logCompleteQuest({
				playerCompletingQuest: SOME_PLAYER.id,
				questCompleted: SOME_QUEST.id
			});

			makeSure(
				activityLogService.hasPlayerAlreadyCompletedQuest(SOME_PLAYER.id, SOME_QUEST.id)
			).isTrue();
		});

		it('returns false if the player has completed a different quest', () => {
			const OTHER_QUEST = addMockQuest(db);

			activityLogService.logCompleteQuest({
				playerCompletingQuest: SOME_PLAYER.id,
				questCompleted: OTHER_QUEST.id
			});
		});

		it('returns false if a different player has completed the quest', () => {
			const OTHER_PLAYER = addMockPlayer(db);

			activityLogService.logCompleteQuest({
				playerCompletingQuest: OTHER_PLAYER.id,
				questCompleted: SOME_QUEST.id
			});
		});

		it('returns false if the player has not completed the quest', () => {
			makeSure(
				activityLogService.hasPlayerAlreadyCompletedQuest(SOME_PLAYER.id, SOME_QUEST.id)
			).isFalse();
		});
	});

	describe('getNumMinesSince()', () => {
		it('returns one when the player has mined since the last time the player completed a quest', () => {
			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 10
			});

			makeSure(activityLogService.getTimesPlayerMinedSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(1);
		});

		it('returns zero when the player has not mined', () => {
			makeSure(activityLogService.getTimesPlayerMinedSince(
				SOME_PLAYER.id, getYesterday()
			)).is(0);
		});

		it('returns zero when the player mined before the given time', () => {
			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 10
			});

			makeSure(activityLogService.getTimesPlayerMinedSince(
				SOME_PLAYER.id, TOMORROW
			)).is(0);
		});

		it('returns one when player mined once after time and once before time', () => {
			addMockActivityLog(db, {
				timeOccured: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.MINE_TOKENS,
			});
			addMockActivityLog(db, {
				timeOccured: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.MINE_TOKENS,
			});
			makeSure(activityLogService.getTimesPlayerMinedSince(
				SOME_PLAYER.id, TODAY
			)).is(1);
		});
	});

	describe('getTokensPlayerSpentSince()', () => {
		it('returns zero when the player has not spent tokens', () => {
			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, TODAY
			)).is(0);
		});

		it('returns the tokens a player spent on a mystery box', () => {
			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				tokensSpent: 10
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(10);
		});

		it('returns the sum of only tokens spent but not earned by a player', () => {
			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				tokensSpent: 10
			});

			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 5
			});

			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				tokensSpent: 15
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(25);
		});

		it('returns the sum of spent tokens only after the given date', () => {
			addMockActivityLog(db, {
				timeOccured: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -10
			});
			addMockActivityLog(db, {
				timeOccured: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -15
			});
			addMockActivityLog(db, {
				timeOccured: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -25
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(25);
		});
	});
});