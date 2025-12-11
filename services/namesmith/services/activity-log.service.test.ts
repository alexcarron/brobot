import { getToday, getTomorrow, getYesterday } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { INVALID_PLAYER_ID, INVALID_QUEST_ID, INVALID_RECIPE_ID, INVALID_TRADE_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { addMockMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";
import { addMockPerk } from "../mocks/mock-data/mock-perks";
import { addMockPlayer } from "../mocks/mock-data/mock-players";
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { addMockRecipe } from "../mocks/mock-data/mock-recipes";
import { addMockRole } from "../mocks/mock-data/mock-roles";
import { addMockTrade } from "../mocks/mock-data/mock-trades";
import { ActivityTypes } from "../types/activity-log.types";
import { MysteryBox } from "../types/mystery-box.types";
import { Perk } from "../types/perk.types";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { Role } from "../types/role.types";
import { Trade } from "../types/trade.types";
import { PlayerNotFoundError, QuestNotFoundError, RecipeNotFoundError, TradeNotFoundError } from "../utilities/error.utility";
import { ActivityLogService } from "./activity-log.service";

describe('ActivityLogService', () => {
	let activityLogService: ActivityLogService;
	let db: DatabaseQuerier;

	let SOME_PLAYER: Player;
	let OTHER_PLAYER: Player;
	let SOME_RECIPE: Recipe;
	let SOME_QUEST: Quest;
	let SOME_TRADE: Trade;
	let SOME_PERK: Perk;
	let SOME_ROLE: Role;
	let SOME_MYSTERY_BOX: MysteryBox;

	let YESTERDAY: Date;
	let TODAY: Date;
	let TOMORROW: Date;

	beforeEach(() => {
		activityLogService = ActivityLogService.asMock();
		db = activityLogService.activityLogRepository.db;

		SOME_PLAYER = addMockPlayer(db);
		OTHER_PLAYER = addMockPlayer(db);
		SOME_RECIPE = addMockRecipe(db);
		SOME_QUEST = addMockQuest(db);
		SOME_TRADE = addMockTrade(db);
		SOME_PERK = addMockPerk(db);
		SOME_ROLE = addMockRole(db);
		SOME_MYSTERY_BOX = addMockMysteryBox(db);

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

	describe('logInitiateTrade()', () => {
		it('creates a new activity log for initiating a trade', () => {
			const activityLog = activityLogService.logInitiateTrade({
				playerInitiatingTrade: SOME_PLAYER.id,
				recipientPlayer: OTHER_PLAYER.id,
				trade: SOME_TRADE,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.INITIATE_TRADE,
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
				involvedTrade: SOME_TRADE,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});
	});

	describe('logAcceptTrade()', () => {
		it('creates a new activity log for accepting a trade', () => {
			const activityLog = activityLogService.logAcceptTrade({
				playerAcceptingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: OTHER_PLAYER.id,
				trade: SOME_TRADE,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.ACCEPT_TRADE,
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
				involvedTrade: SOME_TRADE,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if accepting player is invalid', () => {
			const OTHER_PLAYER = addMockPlayer(db);

			makeSure(() =>
				activityLogService.logAcceptTrade({
					playerAcceptingTrade: INVALID_PLAYER_ID,
					playerAwaitingResponse: OTHER_PLAYER.id,
				trade: SOME_TRADE,
				})
			).throws(PlayerNotFoundError);
		});

		it('throws PlayerNotFoundError if awaiting-acceptance player is invalid', () => {
			makeSure(() =>
				activityLogService.logAcceptTrade({
					playerAcceptingTrade: SOME_PLAYER.id,
					playerAwaitingResponse: INVALID_PLAYER_ID,
					trade: SOME_TRADE,
				})
			).throws(PlayerNotFoundError);
		});

		it('throws TradeNotFoundError if trade is invalid', () => {
			makeSure(() =>
				activityLogService.logAcceptTrade({
					playerAcceptingTrade: SOME_PLAYER.id,
					playerAwaitingResponse: OTHER_PLAYER.id,
					trade: INVALID_TRADE_ID,
				})
			).throws(TradeNotFoundError);
		});
	});

	describe('logDeclineTrade()', () => {
		it('creates a new activity log for declining a trade', () => {
			const activityLog = activityLogService.logDeclineTrade({
				playerDecliningTrade: SOME_PLAYER.id,
				playerAwaitingResponse: OTHER_PLAYER.id,
				trade: SOME_TRADE,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.DECLINE_TRADE,
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
				involvedTrade: SOME_TRADE,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});
	});

	describe('logModifyTrade()', () => {
		it('creates a new activity log for modifying a trade', () => {
			const activityLog = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: OTHER_PLAYER.id,
				trade: SOME_TRADE,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.MODIFY_TRADE,
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
				involvedTrade: SOME_TRADE,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});
	});

	describe('logBuyMysteryBox()', () => {
		it('creates a new activity log for buying a mystery box with negative tokensDifference', () => {
			const activityLog = activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				mysteryBox: SOME_MYSTERY_BOX.id,
				tokensSpent: 150
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -150,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedMysteryBox: SOME_MYSTERY_BOX,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if the buying player is invalid', () => {
			makeSure(() =>
				activityLogService.logBuyMysteryBox({
					playerBuyingBox: INVALID_PLAYER_ID,
					mysteryBox: SOME_MYSTERY_BOX.id,
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
				player: SOME_PLAYER.id,
				perk: SOME_PERK,
				tokensEarned: 12,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.PICK_PERK,
				tokensDifference: 12,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedPerk: SOME_PERK,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('creates a new activity log for picking a perk without tokensEarned (defaults to 0)', () => {
			const activityLog = activityLogService.logPickPerk({
				player: SOME_PLAYER.id,
				perk: SOME_PERK,
				// tokensEarned omitted
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.PICK_PERK,
				tokensDifference: 0,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedPerk: SOME_PERK,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('throws PlayerNotFoundError if picking player is invalid', () => {
			makeSure(() =>
				activityLogService.logPickPerk({
					player: INVALID_PLAYER_ID,
					perk: SOME_PERK,
					tokensEarned: 1
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logChooseRole()', () => {
		it('creates a new activity log for choosing a role', () => {
			const activityLog = activityLogService.logChooseRole({
				player: SOME_PLAYER.id,
				role: SOME_ROLE,
				tokensEarned: 12,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CHOOSE_ROLE,
				tokensDifference: 12,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedRole: SOME_ROLE,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
		});

		it('sets tokensDifference to 0 if tokensEarned is omitted', () => {
			const activityLog = activityLogService.logChooseRole({
				player: SOME_PLAYER.id,
				role: SOME_ROLE,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CHOOSE_ROLE,
				tokensDifference: 0,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedRole: SOME_ROLE,
			});
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
				mysteryBox: SOME_MYSTERY_BOX.id,
				tokensSpent: 10
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(10);
		});

		it('returns the sum of only tokens spent but not earned by a player', () => {
			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				mysteryBox: SOME_MYSTERY_BOX.id,
				tokensSpent: 10
			});

			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 5
			});

			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				mysteryBox: SOME_MYSTERY_BOX.id,
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