import { addDays, addHours, addMilliseconds, addMinutes, getMillisecondsOfDuration, getToday, getYesterday } from "../../../utilities/date-time-utils";
import { makeSure } from "../../../utilities/jest/jest-utils";
import { getBetween } from "../../../utilities/random-utils";
import { INVALID_PLAYER_ID } from "../constants/test.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { addMockActivityLog } from "../mocks/mock-data/mock-activity-logs";
import { addMockMysteryBox, forcePlayerToBuyNewMysteryBox } from "../mocks/mock-data/mock-mystery-boxes";
import { addMockPerk } from "../mocks/mock-data/mock-perks";
import { addMockPlayer, forcePlayerToChangeName, forcePlayerToMineTokens } from '../mocks/mock-data/mock-players';
import { addMockQuest } from "../mocks/mock-data/mock-quests";
import { addMockRecipe, forcePlayerToCraftRecipe } from "../mocks/mock-data/mock-recipes";
import { addMockRole } from "../mocks/mock-data/mock-roles";
import { addMockTrade, forcePlayerToAcceptNewTrade } from "../mocks/mock-data/mock-trades";
import { setupMockNamesmith } from "../mocks/mock-setup";
import { ActivityTypes } from "../types/activity-log.types";
import { MysteryBox } from "../types/mystery-box.types";
import { Perk } from "../types/perk.types";
import { Player } from "../types/player.types";
import { Quest } from "../types/quest.types";
import { Recipe } from "../types/recipe.types";
import { Role } from "../types/role.types";
import { Trade, TradeStatuses } from "../types/trade.types";
import { PlayerNotFoundError } from "../utilities/error.utility";
import { ActivityLogService } from "./activity-log.service";
import { GameStateService } from "./game-state.service";
import { PlayerService } from "./player.service";

describe('ActivityLogService', () => {
	let activityLogService: ActivityLogService;
	let gameStateService: GameStateService;
	let playerService: PlayerService;
	let db: DatabaseQuerier;

	let SOME_PLAYER: Player;
	let OTHER_PLAYER: Player;
	let FIVE_DIFFERENT_PLAYERS: Player[];
	
	let SOME_RECIPE: Recipe;
	let SOME_QUEST: Quest;
	let SOME_TRADE: Trade;
	let SOME_PERK: Perk;
	let SOME_ROLE: Role;
	let SOME_MYSTERY_BOX: MysteryBox;

	let LAST_WEEK: Date;
	let START_OF_WEEK: Date;
	let YESTERDAY: Date;
	let TODAY: Date;
	let TOMORROW: Date;

	beforeEach(() => {
		TODAY = getToday();
		YESTERDAY = addDays(TODAY, -1);
		TOMORROW = addDays(TODAY, 1);
		LAST_WEEK = addDays(TODAY, -7);
		START_OF_WEEK = addDays(TODAY, -3);

		({ db, activityLogService, gameStateService, playerService } = setupMockNamesmith(START_OF_WEEK));

		SOME_PLAYER = addMockPlayer(db);
		OTHER_PLAYER = addMockPlayer(db);

		FIVE_DIFFERENT_PLAYERS = [];
		for (let i = 0; i < 5; i++) {
			FIVE_DIFFERENT_PLAYERS[i] = addMockPlayer(db);
		}
		
		SOME_RECIPE = addMockRecipe(db);
		SOME_QUEST = addMockQuest(db);
		SOME_TRADE = addMockTrade(db);
		SOME_PERK = addMockPerk(db);
		SOME_ROLE = addMockRole(db);
		SOME_MYSTERY_BOX = addMockMysteryBox(db);
	});

	describe('logChangeName()', () => {
		it('creates a new activity log for changing names', () => {
			const activityLog = activityLogService.logChangeName({ playerChangingName: SOME_PLAYER.id, nameBefore: 'SOME_NAME' });

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				nameChangedFrom: 'SOME_NAME',
				currentName: SOME_PLAYER.currentName,
			});

			const resolvedActivityLog = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolvedActivityLog).is(activityLog);
		});
	});

	describe('logPublishName()', () => {
		it('creates a new activity log for publishing names', () => {
			const activityLog = activityLogService.logPublishName({ playerPublishingName: SOME_PLAYER.id });

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.PUBLISH_NAME,
				currentName: SOME_PLAYER.currentName,
			});

			const resolvedActivityLog = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolvedActivityLog).is(activityLog);
		});
	});

	describe('logCraftCharacter()', () => {
		it('creates a new activity log for crafting characters', () => {
			const activityLog = activityLogService.logCraftCharacters({
				playerCrafting: SOME_PLAYER.id,
				recipeUsed: SOME_RECIPE,
				nameBefore: 'SOME_NAME',
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CRAFT_CHARACTERS,
				nameChangedFrom: 'SOME_NAME',
				currentName: SOME_PLAYER.currentName,
				charactersGained: SOME_RECIPE.outputCharacters,
				charactersLost: SOME_RECIPE.inputCharacters,
				tokensDifference: 0,
				involvedRecipe: SOME_RECIPE,
				involvedPlayer: null,
			});

			const resolvedActivityLog = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolvedActivityLog).is(activityLog);
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
			const trade = addMockTrade(db, {
				initiatingPlayer: OTHER_PLAYER.id,
				recipientPlayer: SOME_PLAYER.id,
				offeredCharacters: 'abc',
				requestedCharacters: 'xyz',
			})
			const activityLog = activityLogService.logAcceptTrade({
				playerAccepting: SOME_PLAYER.id,
				playerAwaitingResponse: OTHER_PLAYER.id,
				trade: trade,
				nameBefore: 'SOME_NAME',
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.ACCEPT_TRADE,
				nameChangedFrom: 'SOME_NAME',
				currentName: SOME_PLAYER.currentName,
				charactersGained: 'abc',
				charactersLost: 'xyz',
				tokensDifference: 0,
				involvedPlayer: OTHER_PLAYER,
				involvedRecipe: null,
				involvedQuest: null,
				involvedTrade: trade,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
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
				tokensSpent: 150,
				nameBefore: 'SOME_NAME',
				receivedCharacters: 'SOME_CHARACTERS',
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				nameChangedFrom: 'SOME_NAME',
				currentName: SOME_PLAYER.currentName,
				charactersGained: 'SOME_CHARACTERS',
				charactersLost: null,
				tokensDifference: -150,
				involvedPlayer: null,
				involvedRecipe: null,
				involvedQuest: null,
				involvedMysteryBox: SOME_MYSTERY_BOX,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
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
				tokensEarned: 20,
				timeCooldownExpired: TODAY,
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 20,
				timeCooldownExpired: TODAY,
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
					tokensEarned: 5,
					timeCooldownExpired: TODAY,
				})
			).throws(PlayerNotFoundError);
		});
	});

	describe('logCompleteQuest()', () => {
		it('creates a new activity log for completing a quest', () => {
			const activityLog = activityLogService.logCompleteQuest({
				playerCompletingQuest: SOME_PLAYER.id,
				questCompleted: SOME_QUEST.id,
				tokensRewarded: 100,
				nameBefore: 'SOME_NAME',
				charactersRewarded: 'SOME_CHARACTERS',
			});

			makeSure(activityLog).hasProperties({
				player: SOME_PLAYER,
				type: ActivityTypes.COMPLETE_QUEST,
				nameChangedFrom: 'SOME_NAME',
				currentName: SOME_PLAYER.currentName,
				charactersGained: 'SOME_CHARACTERS',
				charactersLost: null,
				tokensDifference: 100,
				involvedQuest: SOME_QUEST,
				involvedPlayer: null,
				involvedRecipe: null,
			});

			const resolved = activityLogService.activityLogRepository.getActivityLogOrThrow(activityLog.id);
			makeSure(resolved).is(activityLog);
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
				questCompleted: SOME_QUEST.id,
				nameBefore: 'SOME_NAME',
			});

			makeSure(
				activityLogService.hasPlayerAlreadyCompletedQuest(SOME_PLAYER.id, SOME_QUEST.id)
			).isTrue();
		});

		it('returns false if the player has completed a different quest', () => {
			const OTHER_QUEST = addMockQuest(db);

			activityLogService.logCompleteQuest({
				playerCompletingQuest: SOME_PLAYER.id,
				questCompleted: OTHER_QUEST.id,
				nameBefore: 'SOME_NAME',
			});
		});

		it('returns false if a different player has completed the quest', () => {
			const OTHER_PLAYER = addMockPlayer(db);

			activityLogService.logCompleteQuest({
				playerCompletingQuest: OTHER_PLAYER.id,
				questCompleted: SOME_QUEST.id,
				nameBefore: 'SOME_NAME',
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
				timeOccurred: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.MINE_TOKENS,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
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
				tokensSpent: 10,
				nameBefore: 'SOME_NAME',
				receivedCharacters: 'SOME_CHARACTERS',
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(10);
		});

		it('returns the sum of only tokens spent but not earned by a player', () => {
			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				mysteryBox: SOME_MYSTERY_BOX.id,
				tokensSpent: 10,
				nameBefore: 'SOME_NAME',
				receivedCharacters: 'SOME_CHARACTERS',
			});

			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER.id,
				tokensEarned: 5
			});

			activityLogService.logBuyMysteryBox({
				playerBuyingBox: SOME_PLAYER.id,
				mysteryBox: SOME_MYSTERY_BOX.id,
				tokensSpent: 15,
				nameBefore: 'SOME_NAME',
				receivedCharacters: 'SOME_CHARACTERS',
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, YESTERDAY
			)).is(25);
		});

		it('returns the sum of spent tokens only after the given date', () => {
			addMockActivityLog(db, {
				timeOccurred: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -10
			});
			addMockActivityLog(db, {
				timeOccurred: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -15
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.BUY_MYSTERY_BOX,
				tokensDifference: -25
			});

			makeSure(activityLogService.getTokensPlayerSpentSince(
				SOME_PLAYER.id, TOMORROW
			)).is(25);
		});
	});

	describe('getChangeNameLogsForPlayerToday()', () => {
		it('returns an empty array when the player has not changed names', () => {
			makeSure(activityLogService.getChangeNameLogsTodayByPlayer(SOME_PLAYER.id)).isEmpty();
		});

		it('returns the change name logs for a player', () => {
			addMockActivityLog(db, {
				timeOccurred: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});

			makeSure(activityLogService.getChangeNameLogsTodayByPlayer(SOME_PLAYER.id)).hasLengthOf(2);
		});
	});

	describe('getLogsForOtherPlayersToday()', () => {
		it('returns an empty array when there are no logs for other players', () => {
			makeSure(activityLogService.getLogsTodayByPlayersOtherThan(SOME_PLAYER.id)).isEmpty();
		});

		it('returns the logs for other players', () => {
			const IGNORED_LOG = addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: OTHER_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: OTHER_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});

			const returnedLogs = activityLogService.getLogsTodayByPlayersOtherThan(SOME_PLAYER.id);
			makeSure(returnedLogs).hasLengthOf(2);
			makeSure(returnedLogs).hasNoItemWhere(log => log.id === IGNORED_LOG.id);
		});

		it('ignores logs done before the given time and done by the given player', () => {
			addMockActivityLog(db, {
				timeOccurred: YESTERDAY,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: YESTERDAY,
				player: OTHER_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: SOME_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});
			const EXPECTED_ACTIVITY_LOG = addMockActivityLog(db, {
				timeOccurred: TOMORROW,
				player: OTHER_PLAYER.id,
				type: ActivityTypes.CHANGE_NAME,
			});

			const returnedLogs = activityLogService.getLogsTodayByPlayersOtherThan(SOME_PLAYER.id);
			makeSure(returnedLogs).hasLengthOf(1);
			makeSure(returnedLogs[0].id).is(EXPECTED_ACTIVITY_LOG.id);
		});
	});

	describe('getNameIntervalsOfPlayerToday()', () => {
		let START_OF_TODAY: Date;
		let END_OF_TODAY: Date;
		let NOW: Date;
		let IN_BETWEEN_TIMES: [Date, Date, Date, Date, Date] ;

		beforeEach(() => {
			NOW = new Date();
			START_OF_TODAY = gameStateService.getStartOfTodayOrThrow(NOW);
			END_OF_TODAY = addDays(START_OF_TODAY, 1);

			IN_BETWEEN_TIMES = [NOW, NOW, NOW, NOW, NOW];
			for (let index = 0; index < 5; index++) {
				const time = addHours(START_OF_TODAY, 2);
				IN_BETWEEN_TIMES[index] = time;
			}

			jest.useFakeTimers({ now: NOW });
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('returns an single interval of the entire day when the player has not changed names', () => {
			const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(SOME_PLAYER.id);
			makeSure(nameIntervals).hasLengthOf(1);
			makeSure(nameIntervals[0]).is({
				startTime: START_OF_TODAY,
				endTime: END_OF_TODAY,
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
		});

		it('returns two intervals when the player changed their name once explcitly', () => {
			jest.setSystemTime(IN_BETWEEN_TIMES[0]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name');

			const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(SOME_PLAYER.id);
			makeSure(nameIntervals).hasLengthOf(2);
			makeSure(nameIntervals[0]).is({
				startTime: START_OF_TODAY,
				endTime: IN_BETWEEN_TIMES[0],
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[1]).is({
				startTime: IN_BETWEEN_TIMES[0],
				endTime: END_OF_TODAY,
				name: 'new name',
				playerID: SOME_PLAYER.id,
			});
		});

		it('returns three intervals when the player changed their name twice explcitly', () => {
			jest.setSystemTime(IN_BETWEEN_TIMES[0]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name');

			jest.setSystemTime(IN_BETWEEN_TIMES[1]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name 2');

			const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(SOME_PLAYER.id);
			makeSure(nameIntervals).hasLengthOf(3);
			makeSure(nameIntervals[0]).is({
				startTime: START_OF_TODAY,
				endTime: IN_BETWEEN_TIMES[0],
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[1]).is({
				startTime: IN_BETWEEN_TIMES[0],
				endTime: IN_BETWEEN_TIMES[1],
				name: 'new name',
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[2]).is({
				startTime: IN_BETWEEN_TIMES[1],
				endTime: END_OF_TODAY,
				name: 'new name 2',
				playerID: SOME_PLAYER.id,
			});
		});

		it('returns four intervals when the player changes their name through implicit means', () => {
			jest.setSystemTime(IN_BETWEEN_TIMES[0]);
			forcePlayerToBuyNewMysteryBox(SOME_PLAYER, {
				characterOdds: {'a': 1}
			});

			jest.setSystemTime(IN_BETWEEN_TIMES[1]);
			const recipe = addMockRecipe(db, {
				inputCharacters: 'a',
				outputCharacters: 'b',
			})
			forcePlayerToCraftRecipe(SOME_PLAYER, recipe)

			jest.setSystemTime(IN_BETWEEN_TIMES[2]);
			forcePlayerToAcceptNewTrade(SOME_PLAYER, {
				recipientPlayer: SOME_PLAYER,
				offeredCharacters: 'a',
				requestedCharacters: 'b',
			})

			jest.setSystemTime(IN_BETWEEN_TIMES[3]);
			forcePlayerToMineTokens(SOME_PLAYER, 100);

			const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(SOME_PLAYER.id);
			makeSure(nameIntervals).hasLengthOf(4);
			makeSure(nameIntervals[0]).is({
				startTime: START_OF_TODAY,
				endTime: IN_BETWEEN_TIMES[0],
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[1]).is({
				startTime: IN_BETWEEN_TIMES[0],
				endTime: IN_BETWEEN_TIMES[1],
				name: SOME_PLAYER.currentName + "a",
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[2]).is({
				startTime: IN_BETWEEN_TIMES[1],
				endTime: IN_BETWEEN_TIMES[2],
				name: SOME_PLAYER.currentName + "b",
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[3]).is({
				startTime: IN_BETWEEN_TIMES[2],
				endTime: END_OF_TODAY,
				name: SOME_PLAYER.currentName + "a",
				playerID: SOME_PLAYER.id,
			});
		});

		it('combined intervals where the player changed their name to the same name', () => {
			jest.setSystemTime(IN_BETWEEN_TIMES[0]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name');

			jest.setSystemTime(IN_BETWEEN_TIMES[1]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name');

			const nameIntervals = activityLogService.getNameIntervalsOfPlayerToday(SOME_PLAYER.id);
			makeSure(nameIntervals).hasLengthOf(2);
			makeSure(nameIntervals[0]).is({
				startTime: START_OF_TODAY,
				endTime: IN_BETWEEN_TIMES[0],
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
			makeSure(nameIntervals[1]).is({
				startTime: IN_BETWEEN_TIMES[0],
				endTime: END_OF_TODAY,
				name: 'new name',
				playerID: SOME_PLAYER.id,
			});
		});
	});

	describe('getNameToNameIntervalsToday()', () => {
		let START_OF_TODAY: Date;
		let END_OF_TODAY: Date;
		let NOW: Date;
		let IN_BETWEEN_TIMES: [Date, Date, Date, Date, Date];

		beforeEach(() => {
			NOW = new Date();
			START_OF_TODAY = gameStateService.getStartOfTodayOrThrow(NOW);
			END_OF_TODAY = addDays(START_OF_TODAY, 1);

			IN_BETWEEN_TIMES = [NOW, NOW, NOW, NOW, NOW];
			for (let index = 0; index < 5; index++) {
				const time = addHours(START_OF_TODAY, 2);
				IN_BETWEEN_TIMES[index] = time;
			}

			jest.useFakeTimers({ now: NOW });

			playerService.reset();
			SOME_PLAYER = addMockPlayer(db);
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('returns a single key-value pair when there is only one player', () => {
			const nameToNameIntervals = activityLogService.getNameToNameIntervalsToday();
			makeSure(nameToNameIntervals).hasLengthOf(1);
			const nameIntervals = nameToNameIntervals.get(SOME_PLAYER.currentName);
			makeSure(nameIntervals).hasLengthOf(1);
			makeSure(nameIntervals![0]).is({
				startTime: START_OF_TODAY,
				endTime: END_OF_TODAY,
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});
		});

		it('returns three key-value pairs when there are three players with different names', () => {
			const player2 = addMockPlayer(db, {currentName: 'player2'});
			const player3 = addMockPlayer(db, {currentName: 'player3'});

			const nameToNameIntervals = activityLogService.getNameToNameIntervalsToday();
			makeSure(nameToNameIntervals).hasLengthOf(3);
			makeSure(Array.from(nameToNameIntervals.keys())).containsOnly(
				SOME_PLAYER.currentName,
				player2.currentName,
				player3.currentName
			);


			for (const player of [SOME_PLAYER, player2, player3]) {
				const nameIntervals = nameToNameIntervals.get(player.currentName);
				makeSure(nameIntervals).hasLengthOf(1);
				makeSure(nameIntervals![0]).is({
					startTime: START_OF_TODAY,
					endTime: END_OF_TODAY,
					name: player.currentName,
					playerID: player.id,
				});
			}
		});

		it('returns three key-value pairs with one name interval when the player changes their name twice', () => {
			jest.setSystemTime(IN_BETWEEN_TIMES[0]);
			forcePlayerToChangeName(SOME_PLAYER.id, 'new name');

			jest.setSystemTime(IN_BETWEEN_TIMES[1]);
			forcePlayerToBuyNewMysteryBox(SOME_PLAYER.id, {
				characterOdds: { a: 1 },
			});

			jest.setSystemTime(IN_BETWEEN_TIMES[2]);
			forcePlayerToMineTokens(SOME_PLAYER, 100);

			const nameToNameIntervals = activityLogService.getNameToNameIntervalsToday();
			makeSure(nameToNameIntervals).hasLengthOf(3);

			let nameIntervals = nameToNameIntervals.get(SOME_PLAYER.currentName);
			makeSure(nameIntervals).hasLengthOf(1);
			makeSure(nameIntervals![0]).is({
				startTime: START_OF_TODAY,
				endTime: IN_BETWEEN_TIMES[0],
				name: SOME_PLAYER.currentName,
				playerID: SOME_PLAYER.id,
			});

			nameIntervals = nameToNameIntervals.get('new name');
			makeSure(nameIntervals).hasLengthOf(1);
			makeSure(nameIntervals![0]).is({
				startTime: IN_BETWEEN_TIMES[0],
				endTime: IN_BETWEEN_TIMES[1],
				name: 'new name',
				playerID: SOME_PLAYER.id,
			});

			nameIntervals = nameToNameIntervals.get('new namea');
			makeSure(nameIntervals).hasLengthOf(1);
			makeSure(nameIntervals![0]).is({
				startTime: IN_BETWEEN_TIMES[1],
				endTime: END_OF_TODAY,
				name: 'new namea',
				playerID: SOME_PLAYER.id,
			});
		});

		it('return one key-value pair with three name intervals when there are three players with the same name', () => {
			const player2 = addMockPlayer(db, {currentName: SOME_PLAYER.currentName});
			const player3 = addMockPlayer(db, {currentName: SOME_PLAYER.currentName});

			const nameToNameIntervals = activityLogService.getNameToNameIntervalsToday();
			makeSure(nameToNameIntervals).hasLengthOf(1);
			const nameIntervals = nameToNameIntervals.get(SOME_PLAYER.currentName);
			makeSure(nameIntervals).hasLengthOf(3);
			makeSure(nameIntervals).haveProperties({
				startTime: START_OF_TODAY,
				endTime: END_OF_TODAY,
				name: SOME_PLAYER.currentName,
			});

			makeSure(nameIntervals).hasAnItemWhere(interval =>
				interval.playerID === SOME_PLAYER.id
			);
			makeSure(nameIntervals).hasAnItemWhere(interval =>
				interval.playerID === player2.id
			);
			makeSure(nameIntervals).hasAnItemWhere(interval =>
				interval.playerID === player3.id
			);
		});
	});

	describe('getNamesOfPlayerToday()', () => {
		it('returns the player\'s current name is they never changed it', () => {
			const names = activityLogService.getNamesOfPlayerToday(SOME_PLAYER);

			makeSure(names).hasLengthOf(1);
			makeSure(names[0]).is(SOME_PLAYER.currentName);
		});

		it('returns all the player\'s pervious names and current name if they changed it twice explicitly', () => {
			const NAMED_PLAYER = addMockPlayer(db, {currentName: 'Name'});
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name2');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');

			const names = activityLogService.getNamesOfPlayerToday(NAMED_PLAYER);

			makeSure(names).hasLengthOf(3);
			makeSure(names).containsOnly('Name', 'Name2', 'Name3');
		});

		it('ignores logs where the player doesnt change name and includes names the player got from implicit name changes', () => {
			const NAMED_PLAYER = addMockPlayer(db, {currentName: 'Name'});
			forcePlayerToBuyNewMysteryBox(NAMED_PLAYER.id,
				{ characterOdds: { "2": 1 } }
			);
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');
			forcePlayerToMineTokens(NAMED_PLAYER, 100);

			const names = activityLogService.getNamesOfPlayerToday(NAMED_PLAYER);

			makeSure(names).hasLengthOf(3);
			makeSure(names).containsOnly('Name', 'Name2', 'Name3');
		})

		it('does not return duplicates if the player changed their name back and forth to the same one', () => {
			const NAMED_PLAYER = addMockPlayer(db, {currentName: 'Name'});
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name2');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name2');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name');

			const names = activityLogService.getNamesOfPlayerToday(NAMED_PLAYER);

			makeSure(names).hasLengthOf(3);
			makeSure(names).containsOnly('Name', 'Name2', 'Name3');
		});

		it('ignores name changes from yesterday', () => {
			jest.useFakeTimers({ now: new Date() });
			jest.setSystemTime(addDays(new Date(), -2));

			const NAMED_PLAYER = addMockPlayer(db, {currentName: 'Name'});
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name2');
			forcePlayerToChangeName(NAMED_PLAYER.id, 'Name3');

			jest.setSystemTime(addDays(new Date(), 2));
			const names = activityLogService.getNamesOfPlayerToday(NAMED_PLAYER);

			makeSure(names).hasLengthOf(1);
			makeSure(names).containsOnly('Name3');
			jest.useRealTimers();
		});
	});

	describe('getNameIntervalsToday()', () => {
		it('returns two name intervals by two different players if two exist', () => {
			playerService.reset();
			const player1 = addMockPlayer(db, {currentName: 'player1'});
			const player2 = addMockPlayer(db, {currentName: 'player2'});
			const nameIntervals = activityLogService.getNameIntervalsToday();

			makeSure(nameIntervals).hasLengthOf(2);
			makeSure(nameIntervals).hasAnItemWhere(interval =>
				interval.playerID === player1.id
			);
			makeSure(nameIntervals).hasAnItemWhere(interval =>
				interval.playerID === player2.id
			);
		});

		it('returns name intervals by different players in order', () => {
			const START_TIME = new Date();
			jest.useFakeTimers({ now: START_TIME });
			playerService.reset();
			const player1 = addMockPlayer(db, {currentName: 'player1'});
			const player2 = addMockPlayer(db, {currentName: 'player2'});

			for (let numHours = 10; numHours >= 1; numHours--) {
				jest.setSystemTime(addHours(START_TIME, numHours));
				forcePlayerToChangeName(player1.id, `player1${numHours}`);
				jest.setSystemTime(
					addMinutes(START_TIME, getBetween(1, 59))
				);
				forcePlayerToChangeName(player2.id, `player2${numHours}`);
			}

			const nameIntervals = activityLogService.getNameIntervalsToday();

			let previousStartTime = null;
			for (const nameInterval of nameIntervals) {
				const startTime = nameInterval.startTime;
				if (previousStartTime !== null) {
					makeSure(startTime.getTime()).isGreaterThanOrEqualTo(previousStartTime.getTime());
				}
				previousStartTime = startTime;
			}

			jest.useRealTimers();
		})
	});

	describe('getAcceptTradeLogsInvolvingPlayer()', () => {
		it('returns only logs that involve the player', () => {
			const player1 = addMockPlayer(db, {currentName: 'player1'});
			const player2 = addMockPlayer(db, {currentName: 'player2'});
			const trade1 = addMockTrade(db, {
				initiatingPlayer: player1.id,
				recipientPlayer: player2.id,
				status: TradeStatuses.ACCEPTED,
			});
			const trade2 = addMockTrade(db, {
				initiatingPlayer: player2.id,
				recipientPlayer: player1.id,
				status: TradeStatuses.ACCEPTED,
			});
			const trade3 = addMockTrade(db, {
				initiatingPlayer: player2.id,
				recipientPlayer: player2.id,
				status: TradeStatuses.ACCEPTED,
			});

			const expectedLog1 = activityLogService.logAcceptTrade({
				playerAccepting: player2,
				playerAwaitingResponse: player1,
				trade: trade1,
				nameBefore: 'SOME_NAME',
			});

			const expectedLog2 = activityLogService.logAcceptTrade({
				playerAccepting: player1,
				playerAwaitingResponse: player2,
				trade: trade2,
				nameBefore: 'SOME_NAME',
			});

			activityLogService.logAcceptTrade({
				playerAccepting: player2,
				playerAwaitingResponse: player2,
				trade: trade3,
				nameBefore: 'SOME_NAME',
			});

			const logs = activityLogService.getAcceptTradeLogsTodayInvolvingPlayer(player1);

			makeSure(logs).containsOnly(expectedLog1, expectedLog2);
		});
	});

	describe('getModifyTradeLogsTodayByPlayer()', () => {
		it('returns an empty array when the player has not modified any trades today', () => {
			makeSure(activityLogService.getModifyTradeLogsTodayByPlayer(SOME_PLAYER.id)).isEmpty();
		});

		it('returns modify trade logs for the player when they have modified trades today', () => {
			const otherPlayer = addMockPlayer(db, {currentName: 'otherPlayer'});
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: otherPlayer.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const expectedLog = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade,
			});

			const logs = activityLogService.getModifyTradeLogsTodayByPlayer(SOME_PLAYER.id);

			makeSure(logs).containsOnly(expectedLog);
		});

		it('returns only modify trade logs for the specific player', () => {
			const otherPlayer = addMockPlayer(db, {currentName: 'otherPlayer'});
			const thirdPlayer = addMockPlayer(db, {currentName: 'thirdPlayer'});
			const trade1 = addMockTrade(db, {
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: otherPlayer.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			const trade2 = addMockTrade(db, {
				initiatingPlayer: thirdPlayer.id,
				recipientPlayer: otherPlayer.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			const expectedLog = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade1,
			});

			activityLogService.logModifyTrade({
				playerModifyingTrade: thirdPlayer.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade2,
			});

			const logs = activityLogService.getModifyTradeLogsTodayByPlayer(SOME_PLAYER.id);

			makeSure(logs).containsOnly(expectedLog);
		});

		it('returns modify trade logs only from today', () => {
			const NOW = new Date();
			jest.useFakeTimers({ now: NOW });

			const otherPlayer = addMockPlayer(db, {currentName: 'otherPlayer'});
			const trade = addMockTrade(db, {
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: otherPlayer.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});

			// Create a modify trade log from yesterday
			const YESTERDAY = addDays(NOW, -1);
			jest.setSystemTime(YESTERDAY);

			const yesterdayLog = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade,
			});

			// Create a modify trade log from today
			jest.setSystemTime(NOW);
			const expectedLog = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: addMockTrade(db, {
					initiatingPlayer: SOME_PLAYER.id,
					recipientPlayer: otherPlayer.id,
					status: TradeStatuses.AWAITING_RECIPIENT,
				}),
			});

			const logs = activityLogService.getModifyTradeLogsTodayByPlayer(SOME_PLAYER.id);

			makeSure(logs).containsOnly(expectedLog);
			makeSure(logs).doesNotContain(yesterdayLog);

			jest.useRealTimers();
		});

		it('returns multiple modify trade logs when player has modified multiple trades today', () => {
			const otherPlayer = addMockPlayer(db, {currentName: 'otherPlayer'});
			const trade1 = addMockTrade(db, {
				initiatingPlayer: SOME_PLAYER.id,
				recipientPlayer: otherPlayer.id,
				status: TradeStatuses.AWAITING_RECIPIENT,
			});
			const trade2 = addMockTrade(db, {
				initiatingPlayer: otherPlayer.id,
				recipientPlayer: SOME_PLAYER.id,
				status: TradeStatuses.AWAITING_INITIATOR,
			});

			const expectedLog1 = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade1,
			});

			const expectedLog2 = activityLogService.logModifyTrade({
				playerModifyingTrade: SOME_PLAYER.id,
				playerAwaitingResponse: otherPlayer.id,
				trade: trade2,
			});

			const logs = activityLogService.getModifyTradeLogsTodayByPlayer(SOME_PLAYER.id);

			makeSure(logs).containsOnly(expectedLog1, expectedLog2);
		});
	});

	describe('getLogsWithTokenDifferenceTodayByPlayer()', () => {
		it('returns only activity logs where the token difference is non-zero', () => {
			const EXPECTED_ACTVITY_LOG1 = addMockActivityLog(db, {
				player: SOME_PLAYER,
				tokensDifference: 1
			});

			const EXPECTED_ACTVITY_LOG2 = addMockActivityLog(db, {
				player: SOME_PLAYER,
				tokensDifference: -1
			});

			const UNEXPECTED_ACTVITY_LOG = addMockActivityLog(db, {
				player: SOME_PLAYER,
				tokensDifference: 0
			});


			const activityLogs = activityLogService.getLogsWithTokenDifferenceTodayByPlayer(SOME_PLAYER.id);
			makeSure(activityLogs).containsOnly(EXPECTED_ACTVITY_LOG1, EXPECTED_ACTVITY_LOG2);
			makeSure(activityLogs).doesNotContain(UNEXPECTED_ACTVITY_LOG);
		});
	});

	describe('getMaxTokensEarnedFromLogThisWeek()', () => {
		it('returns negative infinity when there are no logs for the player and activity type', () => {
			makeSure(activityLogService.getMaxTokensEarnedFromLogThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(null);
		});

		it('returns the maximum amount of tokens a player has earned from a singular log of a given activity type this week', () => {
			const EXPECTED_MAX_TOKENS_EARNED = 10;
			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER,
				tokensEarned: EXPECTED_MAX_TOKENS_EARNED - 8
			});

			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER,
				tokensEarned: EXPECTED_MAX_TOKENS_EARNED
			});

			activityLogService.logMineTokens({
				playerMining: SOME_PLAYER,
				tokensEarned: EXPECTED_MAX_TOKENS_EARNED - 5
			});

			activityLogService.logClaimRefill({
				playerRefilling: SOME_PLAYER,
				tokensEarned: EXPECTED_MAX_TOKENS_EARNED + 100,
				timeCooldownExpired: new Date()
			});

			makeSure(activityLogService.getMaxTokensEarnedFromLogThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS
			})).is(EXPECTED_MAX_TOKENS_EARNED);
		});

		it('ignores any logs from last week', () => {
			jest.useFakeTimers({ now: LAST_WEEK });

			try {
				activityLogService.logMineTokens({
					playerMining: SOME_PLAYER,
					tokensEarned: 25
				});
	
				jest.useFakeTimers({ now: TODAY });
	
				activityLogService.logMineTokens({
					playerMining: SOME_PLAYER,
					tokensEarned: 3
				});
				activityLogService.logMineTokens({
					playerMining: SOME_PLAYER,
					tokensEarned: 8
				});
				activityLogService.logMineTokens({
					playerMining: SOME_PLAYER,
					tokensEarned: 5
				});
	
				makeSure(activityLogService.getMaxTokensEarnedFromLogThisWeek({
					byPlayer: SOME_PLAYER.id,
					ofType: ActivityTypes.MINE_TOKENS
				})).is(8);
			}
			finally {
				jest.useRealTimers();
			}
		});
	});

	describe('getNumLogsDoneThisWeek()', () => {
		it('returns zero when there are no logs for the player and activity type', () => {
			makeSure(activityLogService.getNumLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(0);
		});

		it('returns one when there is one log for the player and activity type', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME
			});

			makeSure(activityLogService.getNumLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(1);
		});

		it('returns five when the player has five logs for the player and activity type and three for a different type, and three for a different player', () => {
			for (let i = 0; i < 5; i++) {
				addMockActivityLog(db, {
					player: SOME_PLAYER,
					type: ActivityTypes.CHANGE_NAME
				});
			}

			for (let i = 0; i < 3; i++) {
				addMockActivityLog(db, {
					player: SOME_PLAYER,
					type: ActivityTypes.MINE_TOKENS
				});
			}

			for (let i = 0; i < 3; i++) {
				addMockActivityLog(db, {
					player: OTHER_PLAYER,
					type: ActivityTypes.CHANGE_NAME
				});
			}

			makeSure(activityLogService.getNumLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(5);
		});
	});

	describe('didPlayerDoLogOfTypeThisWeek()', () => {
		it('returns false when the player has not done a log of the given activity type this week', () => {
			makeSure(activityLogService.didPlayerDoLogOfTypeThisWeek(SOME_PLAYER.id, ActivityTypes.CHANGE_NAME)).is(false);
		});

		it('returns true when the player has done a log of the given activity type this week', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME
			});

			makeSure(activityLogService.didPlayerDoLogOfTypeThisWeek(SOME_PLAYER.id, ActivityTypes.CHANGE_NAME)).is(true);
		});
	});

	describe('getMaxLogsDoneThisWeek()', () => {
		it('returns zero when there are no logs for the player and activity type', () => {
			makeSure(activityLogService.getMaxLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {days: 2},
			})).is(0);
		});

		it('returns one when there is one log for the player and activity type', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME
			});

			makeSure(activityLogService.getMaxLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {days: 7},
			})).is(1);
		});

		it('returns one if logs are always farther apart than time span', () => {			
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 1)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 2)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 4)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 5)
			});

			makeSure(activityLogService.getMaxLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {hours: 20},
			})).is(1);
		});

		it('returns the largest number of activity logs of a given type a player has done in the given time span', () => {
			const SOME_TIME_SPAN = {days: 2};
			const SOME_ACTIVITY_TYPE = ActivityTypes.CHANGE_NAME;

			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: SOME_ACTIVITY_TYPE,
				timeOccurred: addDays(START_OF_WEEK, 1)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: SOME_ACTIVITY_TYPE,
				timeOccurred: addDays(START_OF_WEEK, 2)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: SOME_ACTIVITY_TYPE,
				timeOccurred: addDays(START_OF_WEEK, 4)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: SOME_ACTIVITY_TYPE,
				timeOccurred: addDays(START_OF_WEEK, 5)
			});

			makeSure(activityLogService.getMaxLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: SOME_ACTIVITY_TYPE,
				inTimeSpan: SOME_TIME_SPAN
			})).is(2);
		});

		it('ignores logs not done by player and not of given type', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addHours(START_OF_WEEK, 1)
			});
			addMockActivityLog(db, {
				player: OTHER_PLAYER, // Different player
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addHours(START_OF_WEEK, 2)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addHours(START_OF_WEEK, 3)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addHours(START_OF_WEEK, 12)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.BUY_MYSTERY_BOX, // Different type
				timeOccurred: addHours(START_OF_WEEK, 13)
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addHours(START_OF_WEEK, 14)
			});
			
			makeSure(activityLogService.getMaxLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {hours: 4}
			})).is(2);
		});
	});

	describe('getMinTimeOfNumLogsDoneThisWeek()', () => {
		it('returns null if player has not any activity logs', () => {
			makeSure(activityLogService.getMinTimeOfNumLogsDoneThisWeek(2, {
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isNull();
		});

		it('returns null if player has done one less than given number of activity logs', () => {
			for (let i = 0; i < 5; i++) {
				addMockActivityLog(db, {
					player: SOME_PLAYER,
					type: ActivityTypes.CHANGE_NAME
				});
			}

			makeSure(activityLogService.getMinTimeOfNumLogsDoneThisWeek(6, {
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isNull();
		});

		it('returns time between first and last log if player has done given number of activity logs', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});

			makeSure(activityLogService.getMinTimeOfNumLogsDoneThisWeek(3, {
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(10);
		});

		it('returns the smallest number of milliseconds between logs if given number is two', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 100),
			});

			makeSure(activityLogService.getMinTimeOfNumLogsDoneThisWeek(2, {
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(1);
		});

		it('returns the smallest number of milliseconds between two logs if given number is three', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 100),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 101),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1101),
			});

			makeSure(activityLogService.getMinTimeOfNumLogsDoneThisWeek(3, {
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).is(91);
		});
	});

	describe('getMaxTokensEarnedFromLogsThisWeek()', () => {
		it('returns null if player has not any activity logs', () => {
			makeSure(activityLogService.getMaxTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS,
				inTimeSpan: {days: 2},
			})).isNull();
		});

		it('returns zero if player earned zero tokens from one log', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 0,
			});

			makeSure(activityLogService.getMaxTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS,
				inTimeSpan: {days: 2},
			})).is(0);
		});

		it('returns total tokens earned from logs if all logs done in time span', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 1,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 2,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 3,
			});

			makeSure(activityLogService.getMaxTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS,
				inTimeSpan: {days: 2},
			})).is(6);
		});

		it('returns largest sum of tokens if multiple groups of logs were done in the time span', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 1,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 2,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 3,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 5,
				timeOccurred: addMilliseconds(START_OF_WEEK, 30),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 1,
				timeOccurred: addMilliseconds(START_OF_WEEK, 40),
			});

			makeSure(activityLogService.getMaxTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS,
				inTimeSpan: {milliseconds: 20},
			})).is(10);
		});
	});

	describe('getMaxPlayersDoingLogsThisWeek()', () => {
		it('returns null if player has not any activity logs', () => {
			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {days: 2},
			})).isEmpty();
		});

		it('returns the only players doing logs if they did it in the given time span', () => {
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[2],
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[3],
				type: ActivityTypes.CHANGE_NAME,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[4],
				type: ActivityTypes.CHANGE_NAME,
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {days: 2},
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[0],
				FIVE_DIFFERENT_PLAYERS[1],
				FIVE_DIFFERENT_PLAYERS[2],
				FIVE_DIFFERENT_PLAYERS[3],
				FIVE_DIFFERENT_PLAYERS[4],
			);
		});

		it('returns the two different players that have done a given activity type in the given time span', () => {
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[2],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[3],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 35),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[4],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 45),
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 20},
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[0],
				FIVE_DIFFERENT_PLAYERS[1],
				FIVE_DIFFERENT_PLAYERS[2],
			)
		});

		it('does not include duplicate players if the same player did multiple logs in the time span', () => {
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[2],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 30),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 30),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[3],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1000),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[4],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 2000),
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 30},
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[0],
				FIVE_DIFFERENT_PLAYERS[1],
				FIVE_DIFFERENT_PLAYERS[2],
			);
		});

		it('only considers windows that include the required includingPlayer', () => {
			// many players produce a larger max window earlier
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[2],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[3],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 30),
			});

			// required player logs much later alone
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[4],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1000),
			});

			// overall max window (without requirement) would be players 0-3,
			// but when requiring player 4 we must only consider windows that include them.
			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 30},
				withPlayer: FIVE_DIFFERENT_PLAYERS[4],
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[4],
			);
		});

		it('requires all players in includingPlayers to be present in the chosen window', () => {
			// big group earlier
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[2],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});

			// the required pair close together later (this is the only window that contains both)
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[3],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1000),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[4],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 1010),
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 50},
				withPlayers: [FIVE_DIFFERENT_PLAYERS[3], FIVE_DIFFERENT_PLAYERS[4]],
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[3],
				FIVE_DIFFERENT_PLAYERS[4],
			);
		});

		it('returns empty if the required includingPlayer did not do any activity logs', () => {
			// some logs but not from the required player
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 50},
				withPlayer: FIVE_DIFFERENT_PLAYERS[4],
			})).isEmpty();
		});

		it('keeps a player in the window if they have multiple logs when the window start advances', () => {
			// player 0 has two logs inside the window; when the start advances past their first log
			// they should remain counted because of the second log
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: START_OF_WEEK,
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[1],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 10),
			});
			addMockActivityLog(db, {
				player: FIVE_DIFFERENT_PLAYERS[0],
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addMilliseconds(START_OF_WEEK, 20),
			});

			makeSure(activityLogService.getMaxPlayersDoingLogsThisWeek({
				ofType: ActivityTypes.CHANGE_NAME,
				inTimeSpan: {milliseconds: 20},
			})).containsOnly(
				FIVE_DIFFERENT_PLAYERS[0],
				FIVE_DIFFERENT_PLAYERS[1],
			);
		});
	});

	describe('getTokensEarnedFromLogsThisWeek()', () => {
		it('returns null if no player did logs', () => {
			makeSure(activityLogService.getTokensEarnedFromLogsThisWeek({
				ofType: ActivityTypes.MINE_TOKENS
			})).is(0);
		});

		it('returns null if given player did no logs', () => {
			addMockActivityLog(db, {
				player: OTHER_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
			})
			
			makeSure(activityLogService.getTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS
			})).is(0);
		});

		it('returns 0 if the given player earned no tokens', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
			})
			
			makeSure(activityLogService.getTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS
			})).isEqualTo(0);
		});

		it('returns 100 if the given player got 50 twice and a different player got 50 once', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: OTHER_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 50,
			});

			makeSure(activityLogService.getTokensEarnedFromLogsThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.MINE_TOKENS
			})).isEqualTo(100);
		});

		it('returns 150 if one player got 50 twice and a different player got 50 once', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: OTHER_PLAYER,
				type: ActivityTypes.MINE_TOKENS,
				tokensDifference: 50,
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CLAIM_REFILL,
				tokensDifference: 50,
			});

			makeSure(activityLogService.getTokensEarnedFromLogsThisWeek({
				ofType: ActivityTypes.MINE_TOKENS
			})).isEqualTo(150);
		});
	});

	describe('getMaxTimeOfNoLogsDoneThisWeek()', () => {
		it('returns 7 days if player has no activity logs', () => {
			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 7}));
		});

		it('returns time from log to start of week if player has one activity log late', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 5),
			});

			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 5}));
		});

		it('returns time from log to end of week if player has one activity log early', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 1),
			});

			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 6}));
		});

		it('returns time from log to start of week if it ends up being the longest time', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 5),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 6),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 6),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 7),
			});

			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 5}));
		});

		it('returns time from log to end of week if it ends up being the longest time', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 1),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 2),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 3),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 4),
			});

			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 3}));
		});

		it('returns time between farthest apart logs', () => {
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 1),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 2),
			});
			addMockActivityLog(db, {
				player: SOME_PLAYER,
				type: ActivityTypes.CHANGE_NAME,
				timeOccurred: addDays(START_OF_WEEK, 5),
			});

			makeSure(activityLogService.getMaxTimeOfNoLogsDoneThisWeek({
				byPlayer: SOME_PLAYER.id,
				ofType: ActivityTypes.CHANGE_NAME
			})).isEqualTo(getMillisecondsOfDuration({days: 3}));
		});
	});
});