import { CronJob } from "cron";
import { logWarning } from "../../../utilities/logging-utils";
import { GameStateRepository } from "../repositories/game-state.repository";
import { closeNamesToVoteOnChannel, openNamesToVoteOnChannel, sendToNamesToVoteOnChannel, sendMessageToTheWinnerChannel, closeTheWinnerChannel, openTheWinnerChannel } from "../utilities/discord-action.utility";
import { VoteService } from "./vote.service";
import { PlayerService } from "./player.service";
import { InvalidArgumentError } from "../../../utilities/error-utils";

/**
 * Provides methods for interacting with the game state.
 */
export class GameStateService {
	static GAME_DURATION_DAYS = 4;
	static VOTE_DURATION_DAYS = 2;

	/**
	 * Constructs a new GameStateService instance.
	 * @param gameStateRepository - The repository used for accessing the game state.
	 * @param playerService - The service used for accessing players.
	 * @param voteService - The service used for accessing votes.
	 */
	constructor(
		public gameStateRepository: GameStateRepository,
		public playerService: PlayerService,
		public voteService: VoteService
	) {}

	/**
	 * Starts a new game.
	 * Sets the game's start time to the current time and its end time to be GAME_DURATION_IN_DAYS days in the future.
	 */
	async startGame(): Promise<void> {
		const now = new Date();
		this.gameStateRepository.setTimeStarted(now);

		const endDate = new Date(now.getTime());
		endDate.setDate(now.getDate() +
			GameStateService.GAME_DURATION_DAYS
		);
		this.gameStateRepository.setTimeEnding(endDate);
		this.startEndGameCronJob(endDate);

		const voteEndingDate = new Date(endDate.getTime());
		voteEndingDate.setDate(endDate.getDate() +
			GameStateService.VOTE_DURATION_DAYS
		);
		this.gameStateRepository.setTimeVoteIsEnding(voteEndingDate);
		this.startVoteIsEndingCronJob(voteEndingDate);

		await closeNamesToVoteOnChannel();
		await closeTheWinnerChannel();

		this.playerService.reset();
		await this.playerService.addEveryoneInServer();
	}

	/**
	 * Starts a cron job that will end the game at the end time stored in the game state.
	 * If the current time is before the end time, the job will be started.
	 * @param endDate - The end time of the game.
	 */
	startEndGameCronJob(endDate: Date) {
		if (endDate === null || endDate === undefined) {
			logWarning(`The game has not been started yet, so the end game cron job will not be started.`);
			return;
		}

		const now = new Date();
		const gameStateService = this;

		const endGameCronJob = new CronJob(
			endDate,
			async function() {
				await gameStateService.endGame();
			},
		);

		if (now < endDate)
			endGameCronJob.start();
	}

	/**
	 * Ends the current game.
	 * Publishes any names that have not yet been published and finalizes all names.
	 */
	async endGame(): Promise<void> {
		await this.playerService.publishUnpublishedNames();

		await openNamesToVoteOnChannel();

		await sendToNamesToVoteOnChannel(`The game has ended and now it's time to vote on the players' final names!`);
		await sendToNamesToVoteOnChannel(`# Finalized Names`);

		await this.playerService.finalizeAllNames();
		await this.voteService.reset();
	}

	/**
	 * Starts a cron job that will end voting at the vote ending time stored in the game state.
	 * If the current time is before the vote ending time, the job will be started.
	 * @param voteEndingDate - The vote ending time.
	 */
	startVoteIsEndingCronJob(voteEndingDate: Date) {
		if (voteEndingDate === null || voteEndingDate === undefined) {
			logWarning(`The game has not been started yet, so the vote is ending cron job will not be started.`);
			return;
		}

		if (!(voteEndingDate instanceof Date))
			throw new InvalidArgumentError(`The vote ending date is not a Date object: ${voteEndingDate}`);

		const now = new Date();
		const gameStateService = this;

		const voteIsEndingCronJob = new CronJob(
			voteEndingDate,
			async function() {
				await gameStateService.endVoting();
			},
		);

		if (now < voteEndingDate)
			voteIsEndingCronJob.start();
	}

	/**
	 * Ends the voting phase of the game.
	 * Closes the "Names to Vote On" channel to everyone and logs the current vote count for each player.
	 */
	async endVoting(): Promise<void> {
		await closeNamesToVoteOnChannel();
		await openTheWinnerChannel();
		this.voteService.logVoteCountPerPlayer();
		const winningPlayerID = this.voteService.getWinningPlayerID();

		if (winningPlayerID === null) {
			await sendMessageToTheWinnerChannel(`The voting phase has ended and there was a tie!`);
			return;
		}
		
		const name = this.playerService.getPublishedName(winningPlayerID);

		await sendMessageToTheWinnerChannel(`<@${winningPlayerID}>!\nThe voting phase has ended and the winner is **${name}**!`);
	}
}