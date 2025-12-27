jest.mock('../utilities/discord-action.utility', () => ({
	closeNamesToVoteOnChannel: jest.fn(),
	openNamesToVoteOnChannel: jest.fn(),
	sendToNamesToVoteOnChannel: jest.fn(),
	sendMessageToTheWinnerChannel: jest.fn(),
	sendToPublishedNamesChannel: jest.fn(),
	closeTheWinnerChannel: jest.fn(),
	openTheWinnerChannel: jest.fn(),
	changeDiscordNameOfPlayer: jest.fn(),
	isNonPlayer: jest.fn((member) => Promise.resolve(
		member.isPlayer === undefined ?
			false :
			!member.isPlayer
	)),
	resetMemberToNewPlayer: jest.fn(),
}));

jest.mock('../utilities/discord-fetch.utility', () => ({
	fetchNamesmithServer: jest.fn(),
	fetchNamesmithGuildMember: jest.fn( (playerID) =>
		Promise.resolve({ id: playerID })
	),
	fetchNamesmithGuildMembers: jest.fn(() =>
		Promise.resolve([])
	),
	fetchNamesToVoteOnChannel: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../interfaces/voting/voting-messages', () => ({
	sendVotingMessages: jest.fn(),
}));

// Mock CronJob
jest.mock('cron', () => ({
	CronJob: jest.fn(() => ({
		start: jest.fn(),
		stop: jest.fn(),
	})),
}));

import { CronJob } from "cron";
import { GameStateRepository } from "../repositories/game-state.repository";
import { GameStateService } from "./game-state.service";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";
import { DAYS_TO_BUILD_NAME, DAYS_TO_VOTE } from "../constants/namesmith.constants";
import { addDays } from "../../../utilities/date-time-utils";
import { GameIsNotActiveError } from "../utilities/error.utility";


describe('GameStateService', () => {
	let gameStateService: GameStateService;

	beforeEach(() => {
		gameStateService = GameStateService.asMock();

		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-07-12T12:00:00.000Z'));
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create a new GameStateService instance', () => {
			expect(gameStateService).toBeInstanceOf(GameStateService);
			expect(gameStateService.playerService).toBeInstanceOf(PlayerService);
			expect(gameStateService.voteService).toBeInstanceOf(VoteService);
			expect(gameStateService.gameStateRepository).toBeInstanceOf(GameStateRepository);
		});
	});

	describe('.startEndGameCronJob()', () => {
		it('should start a cron job to end the game', async () => {
			const now = new Date();
			const expectedEndTime = new Date(now.getTime() + DAYS_TO_BUILD_NAME * 24 * 60 * 60 * 1000);
			await gameStateService.startEndGameCronJob(expectedEndTime);

			expect(CronJob).toHaveBeenCalledTimes(1);
			expect(CronJob).toHaveBeenNthCalledWith(
				1,
				expectedEndTime,
				expect.any(Function)
			);
		});
	});

	describe('.startVoteIsEndingCronJob()', () => {
		it('should start a cron job to end voting', () => {
			const now = new Date();
			const totalDays = DAYS_TO_BUILD_NAME + DAYS_TO_VOTE;
			const expectedEndTime = new Date(now.getTime() +
				totalDays * 24 * 60 * 60 * 1000
			);
			gameStateService.startVoteIsEndingCronJob(expectedEndTime);

			expect(CronJob).toHaveBeenCalledTimes(1);
			expect(CronJob).toHaveBeenNthCalledWith(
				1,
				expectedEndTime,
				expect.any(Function)
			);
		});
	});

	describe('getTimesPickAPerkStarts()', () => {
		it('should return an array of dates representing the start of each week\'s "pick a perk" phase', () => {
			const startDate = new Date('2025-07-12T12:00:00.000Z');
			const expectedDates = [
				new Date('2025-07-15T12:00:00.000Z'),
				new Date('2025-07-18T12:00:00.000Z'),
				new Date('2025-07-22T12:00:00.000Z'),
				new Date('2025-07-25T12:00:00.000Z'),
				new Date('2025-07-29T12:00:00.000Z'),
				new Date('2025-08-01T12:00:00.000Z'),
				new Date('2025-08-05T12:00:00.000Z'),
				new Date('2025-08-08T12:00:00.000Z'),
			];
			expect(gameStateService.computeTimesPickAPerkStarts(
				startDate,
				addDays(startDate, 7*4),
				[3, 6]
			)).toEqual(expectedDates);
		});
	});

	describe('setTimesDayStarts()', () => {
		it('should return an array of dates representing the start of each day', () => {
			const startDate = new Date('2025-07-12T12:00:00.000Z');
			const expectedDates = [
				new Date('2025-07-12T12:00:00.000Z'),
				new Date('2025-07-13T12:00:00.000Z'),
				new Date('2025-07-14T12:00:00.000Z'),
				new Date('2025-07-15T12:00:00.000Z'),
				new Date('2025-07-16T12:00:00.000Z'),
				new Date('2025-07-17T12:00:00.000Z'),
				new Date('2025-07-18T12:00:00.000Z'),
			];
			expect(gameStateService.computeTimesDayStarts(startDate, addDays(startDate, 7))).toEqual(expectedDates);
		});
	});

	describe('getTodaysDayStart()', () => {
		const TIME_GAME_STARTS = new Date('2025-07-12T12:00:00.000Z');

		beforeEach(() => {
			// Setup the game state
			console.log('TIME_GAME_STARTS', TIME_GAME_STARTS);
			gameStateService.setupTimings(TIME_GAME_STARTS);
		})

		it('should return the start of the day if the given date is exactly that date', () => {
			const now = new Date('2025-07-14T12:00:00.000Z');
			const expectedDayStart = new Date('2025-07-14T12:00:00.000Z');
			expect(gameStateService.getStartOfToday(now)).toEqual(expectedDayStart);
		});

		it('should return the start of the day if given the middle of the day', () => {
			const now = new Date('2025-07-14T22:00:00.000Z');
			const expectedDayStart = new Date('2025-07-14T12:00:00.000Z');
			expect(gameStateService.getStartOfToday(now)).toEqual(expectedDayStart);
		});

		it('should return the start of day even if we are right near the end of the day', () => {
			const now = new Date('2025-07-14T11:59:59.999Z');
			const expectedDayStart = new Date('2025-07-13T12:00:00.000Z');
			expect(gameStateService.getStartOfToday(now)).toEqual(expectedDayStart);
		});

		it('should return null if the given date is before the start of the game', () => {
			const now = new Date('2025-07-11T12:00:00.000Z');
			expect(gameStateService.getStartOfToday(now)).toBeNull();
		});

		it('should return null if the given date is after the game is over', () => {
			const now = new Date('2027-07-19T12:00:00.000Z');
			expect(gameStateService.getStartOfToday(now)).toBeNull();
		});
	});

	describe('getDayStartOfTodayOrThrow()', () => {
		const TIME_GAME_STARTS = new Date('2025-07-12T12:00:00.000Z');

		beforeEach(() => {
			// Setup the game state
			gameStateService.setupTimings(TIME_GAME_STARTS);
		})

		it('should throw a GameIsNotActiveError if the given date is before the start of the game', () => {
			const now = new Date('2025-07-11T12:00:00.000Z');
			expect(() => gameStateService.getStartOfTodayOrThrow(now)).toThrow(GameIsNotActiveError);
		});

		it('should throw a GameIsNotActiveError if the given date is after the game is over', () => {
			const now = new Date('2027-07-19T12:00:00.000Z');
			expect(() => gameStateService.getStartOfTodayOrThrow(now)).toThrow(GameIsNotActiveError);
		});
	});
});