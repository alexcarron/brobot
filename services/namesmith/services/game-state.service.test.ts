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
		Promise.resolve(mockPlayers.slice(0, 2).map((player) => ({ id: player.id })))
	),
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
import { mockPlayers } from "../repositories/mock-repositories";
import { sendToNamesToVoteOnChannel, openNamesToVoteOnChannel, sendMessageToTheWinnerChannel, closeNamesToVoteOnChannel, openTheWinnerChannel, closeTheWinnerChannel } from "../utilities/discord-action.utility";
import { GameStateService } from "./game-state.service";
import { createMockServices } from "./mock-services";
import { PlayerService } from "./player.service";
import { VoteService } from "./vote.service";


describe('GameStateService', () => {
	let gameStateService: GameStateService;
	let playerService: PlayerService;
	let voteService: VoteService;


	beforeEach(() => {
		const services = createMockServices();

		playerService = services.playerService;
		voteService = services.voteService;
		gameStateService = services.gameStateService;

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

	describe('.startGame()', () => {
		it('should set the start time to the current time', async () => {
			const now = new Date();
			await gameStateService.startGame();

			const timeStarted = await gameStateService.gameStateRepository.getTimeStarted();
			expect(timeStarted).toEqual(now);
		});

		it('should set the end time to the current time plus the default game duration', async () => {
			const now = new Date();
			const expectedEndTime = new Date(now.getTime() + GameStateService.GAME_DURATION_DAYS * 24 * 60 * 60 * 1000);
			await gameStateService.startGame();

			const timeEnding = await gameStateService.gameStateRepository.getTimeEnding();
			expect(timeEnding).toEqual(expectedEndTime);
		});

		it('should set the voting end time to the current time plus the default game duration and default voting duration', async () => {
			const now = new Date();
			const totalDays = GameStateService.GAME_DURATION_DAYS + GameStateService.VOTE_DURATION_DAYS;
			const expectedEndTime = new Date(now.getTime() +
				totalDays * 24 * 60 * 60 * 1000
			);
			await gameStateService.startGame();

			const timeVoteIsEnding = await gameStateService.gameStateRepository.getTimeVoteIsEnding();
			expect(timeVoteIsEnding).toEqual(expectedEndTime);
		});

		it('should start cron jobs for end game and voting', async () => {
			const now = new Date();
			const expectedEndTime = new Date(now.getTime() + GameStateService.GAME_DURATION_DAYS * 24 * 60 * 60 * 1000);
			const totalDays = GameStateService.GAME_DURATION_DAYS + GameStateService.VOTE_DURATION_DAYS;
			const expectedVoteEndTime = new Date(now.getTime() +
				totalDays * 24 * 60 * 60 * 1000
			);

			await gameStateService.startGame();

			expect(CronJob).toHaveBeenCalledTimes(2);
			expect(CronJob).toHaveBeenNthCalledWith(
				1,
				expectedEndTime,
				expect.any(Function)
			);

			expect(CronJob).toHaveBeenNthCalledWith(
				2,
				expectedVoteEndTime,
				expect.any(Function)
			);
		});

		it('should close name voting and winner channels', async () => {
			await gameStateService.startGame();

			expect(closeNamesToVoteOnChannel).toHaveBeenCalledTimes(1);
			expect(closeTheWinnerChannel).toHaveBeenCalledTimes(1);
		});

		it('should replace players with players in server', async () => {
			await gameStateService.startGame();

			const players = await playerService.playerRepository.getPlayers();
			expect(players.length).toBe(2);
		});
	});

	describe('.startEndGameCronJob()', () => {
		it('should start a cron job to end the game', async () => {
			const now = new Date();
			const expectedEndTime = new Date(now.getTime() + GameStateService.GAME_DURATION_DAYS * 24 * 60 * 60 * 1000);
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
			const totalDays = GameStateService.GAME_DURATION_DAYS + GameStateService.VOTE_DURATION_DAYS;
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
	})

	describe('endGame', () => {
		it('should publish all unpublished names', async () => {
			await gameStateService.endGame();

			const playersToCheck = mockPlayers.filter(player => !player.publishedName);

			for (const player of playersToCheck) {
				const publishedName = await playerService.getPublishedName(player.id);
				expect(publishedName).toEqual(player.currentName);
			}
		});

		it('should open names to vote on channel and send messages', async () => {
			await gameStateService.endGame();

			expect(openNamesToVoteOnChannel).toHaveBeenCalledTimes(1);
			expect(sendToNamesToVoteOnChannel).toHaveBeenCalledTimes(
				2 + mockPlayers.length
			);
		});

		it('should finalize all names', async () => {
			await gameStateService.endGame();

			for (const player of mockPlayers) {
				const currentName = await playerService.getCurrentName(player.id);
				const publishedName = await playerService.getPublishedName(player.id);
				expect(currentName).toEqual(publishedName);
			}
		});

		it('should reset votes', async () => {
			await gameStateService.endGame();

			const votes = await voteService.voteRepository.getVotes();
			expect(votes.length).toBe(0);
		});
	});

	describe('endVoting', () => {
		it('should close voting channel and open winner channel', async () => {
			await gameStateService.endVoting();

			expect(closeNamesToVoteOnChannel).toHaveBeenCalledTimes(1);
			expect(openTheWinnerChannel).toHaveBeenCalledTimes(1);
		});

		it('should send the winner\'s published name to the winner channel', async () => {
			await gameStateService.endVoting();

			expect(sendMessageToTheWinnerChannel).toHaveBeenCalledWith(
				`<@${mockPlayers[1].id}>!\nThe voting phase has ended and the winner is **${mockPlayers[1].publishedName}**!`
			);
		});
	});
});