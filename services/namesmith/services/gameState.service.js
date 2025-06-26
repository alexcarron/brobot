const { CronJob } = require("cron");
const { logInfo, logWarning } = require("../../../utilities/logging-utils");
const GameStateRepository = require("../repositories/gameState.repository");
const { closeNamesToVoteOnChannel, openNamesToVoteOnChannel } = require("../utilities/discord-action.utility");

const GAME_DURATION_IN_DAYS = 28;

/**
 * Provides methods for interacting with the game state.
 */
class GameStateService {
/**
 * Constructs a new GameStateService instance.
 * @param {GameStateRepository} gameStateRepository - The repository used for accessing the game state.
 * @param {PlayerService} playerService - The service used for accessing players.
 */
	constructor(gameStateRepository, playerService) {
		this.gameStateRepository = gameStateRepository;
		this.playerService = playerService;
	}

	/**
	 * Starts a new game.
	 * Sets the game's start time to the current time and its end time to be GAME_DURATION_IN_DAYS days in the future.
	 * @returns {Promise<void>} A promise that resolves once the game has been started.
	 */
	async startGame() {
		const now = new Date();
		await this.gameStateRepository.setTimeStarted(now);

		const endDate = new Date();
		endDate.setDate(now.getDate() + GAME_DURATION_IN_DAYS);
		await this.gameStateRepository.setTimeEnding(endDate);
		this.startEndGameCronJob();

		await closeNamesToVoteOnChannel();
	}

	/**
	 * Starts a cron job that will end the game at the end time stored in the game state.
	 * If the current time is before the end time, the job will be started.
	 * @returns {Promise<void>} A promise that resolves once the job has been started.
	 */
	async startEndGameCronJob() {
		const endDate = await this.gameStateRepository.getTimeEnding();

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
		await this.playerService.finalizeAllNames();
	}
}

module.exports = GameStateService;