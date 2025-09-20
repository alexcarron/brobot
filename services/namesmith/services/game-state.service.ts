import { CronJob } from "cron";
import { logWarning } from "../../../utilities/logging-utils";
import { GameStateRepository } from "../repositories/game-state.repository";
import { VoteService } from "./vote.service";
import { PlayerService } from "./player.service";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { RecipeService } from "./recipe.service";
import { DAYS_TO_BUILD_NAME, DAYS_TO_VOTE } from "../constants/namesmith.constants";
import { addDays } from "../../../utilities/date-time-utils";
import { startVoting } from "../event-listeners/on-voting-start";
import { getNamesmithServices } from "./get-namesmith-services";
import { onVotingEnd } from "../event-listeners/on-voting-end";

/**
 * Provides methods for interacting with the game state.
 */
export class GameStateService {
	private endGameCronJob?: CronJob;
	private voteIsEndingCronJob?: CronJob;

	/**
	 * Constructs a new GameStateService instance.
	 * @param gameStateRepository - The repository used for accessing the game state.
	 * @param playerService - The service used for accessing players.
	 * @param voteService - The service used for accessing votes.
	 * @param recipeService - The service used for accessing recipes.
	 */
	constructor(
		public gameStateRepository: GameStateRepository,
		public playerService: PlayerService,
		public voteService: VoteService,
		public recipeService: RecipeService,
	) {}

	/**
	 * Sets the game's start time to the given date, and its vote start and end times according to the configured constants.
	 * @param startDate - The date to set as the start of the game.
	 */
	setupTimings(startDate: Date) {
		this.gameStateRepository.setTimeStarted(startDate);

		const votingDate = addDays(startDate, DAYS_TO_BUILD_NAME);
		this.gameStateRepository.setTimeVoting(votingDate);

		const votingEndDate = addDays(votingDate, DAYS_TO_VOTE);
		this.gameStateRepository.setTimeVotingEnds(votingEndDate);
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

		if (this.endGameCronJob !== undefined) {
			logWarning(`The end game cron job has already been started, so it will not be started again.`);
			return;
		}

		const now = new Date();

		const endGameCronJob = new CronJob(
			endDate,
			async () => {
				await startVoting({...getNamesmithServices()});
			},
		);

		if (now < endDate && !this.endGameCronJob) endGameCronJob.start();
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

		if (this.voteIsEndingCronJob !== undefined) {
			logWarning(`The vote is ending cron job has already been started, so it will not be started again.`);
			return;
		}

		const now = new Date();

		const voteIsEndingCronJob = new CronJob(
			voteEndingDate,
			async () => {
				await onVotingEnd({...getNamesmithServices()});
			},
		);

		if (now < voteEndingDate && !this.voteIsEndingCronJob)
			voteIsEndingCronJob.start();
	}

	/**
	 * Starts the cron jobs to end the game and end voting at the times stored in the game state.
	 * If the current time is before the stored times, the jobs will be started.
	 */
	scheduleGameEvents(): void {
		this.voteIsEndingCronJob?.stop();
		this.endGameCronJob?.stop();
		this.startEndGameCronJob(this.gameStateRepository.getTimeEnding());
		this.startVoteIsEndingCronJob(this.gameStateRepository.getTimeVoteIsEnding());
	}

	/**
	 * Determines if the game has started.
	 * @returns Whether the game has started.
	 */
	hasStarted(): boolean {
		const now = new Date();
		try {
			const startTime = this.gameStateRepository.getTimeStarted();
			return now > startTime;
		}
		catch {
			return false;
		}
	}
}