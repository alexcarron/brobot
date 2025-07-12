const { CronJob } = require("cron");
const { logWarning } = require("../../../utilities/logging-utils");
const GameStateRepository = require("../repositories/gameState.repository");
const { closeNamesToVoteOnChannel, openNamesToVoteOnChannel, sendToNamesToVoteOnChannel, sendMessageToTheWinnerChannel, closeTheWinnerChannel, openTheWinnerChannel } = require("../utilities/discord-action.utility");
const VoteService = require("./vote.service");
const PlayerService = require("./player.service");

/**
 * Provides methods for interacting with the game state.
 */
class GameStateService {
	static GAME_DURATION_DAYS = 4;
	static VOTE_DURATION_DAYS = 2;

	/**
	 * Constructs a new GameStateService instance.
	 * @param {GameStateRepository} gameStateRepository - The repository used for accessing the game state.
	 * @param {PlayerService} playerService - The service used for accessing players.
	 * @param {VoteService} voteService - The service used for accessing votes.
	 */
	constructor(gameStateRepository, playerService, voteService) {
		this.gameStateRepository = gameStateRepository;
		this.playerService = playerService;
		this.voteService = voteService;
	}

	/**
	 * Starts a new game.
	 * Sets the game's start time to the current time and its end time to be GAME_DURATION_IN_DAYS days in the future.
	 * @returns {Promise<void>} A promise that resolves once the game has been started.
	 */
	async startGame() {
		const now = new Date();
		await this.gameStateRepository.setTimeStarted(now);

		const endDate = new Date(now.getTime());
		endDate.setDate(now.getDate() +
			GameStateService.GAME_DURATION_DAYS
		);
		await this.gameStateRepository.setTimeEnding(endDate);
		this.startEndGameCronJob(endDate);

		const voteEndingDate = new Date(endDate.getTime());
		voteEndingDate.setDate(endDate.getDate() +
			GameStateService.VOTE_DURATION_DAYS
		);
		await this.gameStateRepository.setTimeVoteIsEnding(voteEndingDate);
		this.startVoteIsEndingCronJob(voteEndingDate);

		await closeNamesToVoteOnChannel();
		await closeTheWinnerChannel();

		await this.playerService.reset();
		await this.playerService.addEveryoneInServer();
	}

	/**
	 * Starts a cron job that will end the game at the end time stored in the game state.
	 * If the current time is before the end time, the job will be started.
	 * @param {Date} endDate - The end time of the game.
	 */
	startEndGameCronJob(endDate) {
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
	 * @returns {Promise<void>} A promise that resolves once the game has been ended.
	 */
	async endGame() {
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
	 * @param {Date} voteEndingDate - The vote ending time.
	 */
	startVoteIsEndingCronJob(voteEndingDate) {
		if (voteEndingDate === null || voteEndingDate === undefined) {
			logWarning(`The game has not been started yet, so the vote is ending cron job will not be started.`);
			return;
		}

		if (!(voteEndingDate instanceof Date))
			throw new Error(`The vote ending date is not a Date object: ${voteEndingDate}`);

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
	 * @returns {Promise<void>} A promise that resolves once the voting phase has been ended.
	 */
	async endVoting() {
		await closeNamesToVoteOnChannel();
		await openTheWinnerChannel();
		await this.voteService.logVoteCountPerPlayer();
		const winningPlayerID = await this.voteService.getWinningPlayerID();
		const name = await this.playerService.getPublishedName(winningPlayerID);

		await sendMessageToTheWinnerChannel(`<@${winningPlayerID}>!\nThe voting phase has ended and the winner is **${name}**!`);
	}
}

module.exports = GameStateService;