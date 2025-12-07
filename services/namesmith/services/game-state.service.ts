import { CronJob } from "cron";
import { logWarning } from "../../../utilities/logging-utils";
import { GameStateRepository } from "../repositories/game-state.repository";
import { VoteService } from "./vote.service";
import { PlayerService } from "./player.service";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { RecipeService } from "./recipe.service";
import { BIWEEKLY_PERK_DAYS_FROM_WEEK_START, DAYS_TO_BUILD_NAME, DAYS_TO_VOTE } from "../constants/namesmith.constants";
import { addDays } from "../../../utilities/date-time-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { NamesmithEvents } from "../event-listeners/namesmith-events";

/**
 * Provides methods for interacting with the game state.
 */
export class GameStateService {
	private endGameCronJob?: CronJob;
	private voteIsEndingCronJob?: CronJob;
	private pickAPerkCronJobs: CronJob[] = [];
	private dayStartCronJobs: CronJob[] = [];

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

	static fromDB(db: DatabaseQuerier) {
		return new GameStateService(
			GameStateRepository.fromDB(db),
			PlayerService.fromDB(db),
			VoteService.fromDB(db),
			RecipeService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return GameStateService.fromDB(db);
	}

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
	 * Returns an array of dates representing the start of each week's "pick a perk" phase.
	 * The dates are calculated based on the given start date and the configured constants for the length of the build name phase and the days offset from the week start.
	 * @param startDate - The start date of the game.
	 * @param endDate - The end date of the game.
	 * @param pickAPerkDaysFromWeekStart - The days offset from the week start for each "pick a perk" phase.
	 * @returns An array of dates representing the start of each week's "pick a perk" phase.
	 */
	getTimesPickAPerkStarts(
		startDate: Date,
		endDate: Date,
		pickAPerkDaysFromWeekStart: number[]
	): Date[] {
		const pickAPerkTimes: Date[] = [];

		let currentWeekStart = startDate;
		while (currentWeekStart < endDate) {
			for (const daysOffset of pickAPerkDaysFromWeekStart) {
				const pickAPerkTime = addDays(currentWeekStart, daysOffset);

				if (pickAPerkTime >= endDate) {
					return pickAPerkTimes;
				}
				else {
					pickAPerkTimes.push(pickAPerkTime);
				}
			}
			currentWeekStart = addDays(currentWeekStart, 7);
		}

		return pickAPerkTimes;
	}

	/**
	 * Returns an array of dates representing the start of each day from the given start date to the given end date.
	 * @param startDate - The start date of the game.
	 * @param endDate - The end date of the game.
	 * @returns An array of dates representing the start of each day from the given start date to the given end date.
	 */
	getTimesDayStarts(
		startDate: Date,
		endDate: Date,
	): Date[] {
		const times: Date[] = [];
		let currentDayStart = startDate;
		while (currentDayStart < endDate) {
			times.push(currentDayStart);
			currentDayStart = addDays(currentDayStart, 1);
		}
		return times;
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
			() => {
				NamesmithEvents.StartVoting.triggerEvent({});
			},
		);

		if (now < endDate && !this.endGameCronJob) {
			endGameCronJob.start();
			this.endGameCronJob = endGameCronJob;
		}
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
			() => {
				NamesmithEvents.EndVoting.triggerEvent({});
			},
		);

		if (now < voteEndingDate && !this.voteIsEndingCronJob) {
			voteIsEndingCronJob.start();
			this.voteIsEndingCronJob = voteIsEndingCronJob;
		}
	}

	/**
	 * Starts a cron job for each of the given pick a perk times, which will trigger the NamesmithEvents.PickAPerk event when the time is reached.
	 * If the current time is before the pick a perk time, the job will be started.
	 * If the pick a perk cron job has already been started, a warning will be logged and the job will not be started again.
	 * @param pickAPerkTimes - The times at which to trigger the NamesmithEvents.PickAPerk event.
	 */
	startPickAPerkCronJobs(pickAPerkTimes: Date[]) {
		if (this.pickAPerkCronJobs.length > 0) {
			logWarning(`The pick a perk cron job has already been started, so it will not be started again.`);
			return;
		}

		const now = new Date();
		for (const pickAPerkTime of pickAPerkTimes) {
			const pickAPerkCronJob = new CronJob(
				pickAPerkTime,
				() => {
					NamesmithEvents.PickAPerk.triggerEvent({});
				},
			);

			if (now < pickAPerkTime) {
				pickAPerkCronJob.start();
				this.pickAPerkCronJobs.push(pickAPerkCronJob);
			}
		}
	}

	/**
	 * Starts a cron job for each of the given day start times, which will trigger the NamesmithEvents.DayStart event when the time is reached.
	 * If the current time is before the day start time, the job will be started.
	 * If the day start cron job has already been started, a warning will be logged and the job will not be started again.
	 * @param dayStartTimes - The times at which to trigger the NamesmithEvents.DayStart event.
	 */
	startDayStartCronJobs(dayStartTimes: Date[]) {
		for (const dayStartTime of dayStartTimes) {
			const dayStartCronJob = new CronJob(
				dayStartTime,
				() => {
					NamesmithEvents.DayStart.triggerEvent({});
				},
			);

			if (!this.dayStartCronJobs.includes(dayStartCronJob)) {
				dayStartCronJob.start();
				this.dayStartCronJobs.push(dayStartCronJob);
			}
		}
	}

	/**
	 * Starts the cron jobs to end the game and end voting at the times stored in the game state.
	 * If the current time is before the stored times, the jobs will be started.
	 */
	scheduleGameEvents(): void {
		this.voteIsEndingCronJob?.stop();
		this.endGameCronJob?.stop();
		for (const pickAPerkCronJob of this.pickAPerkCronJobs) {
			pickAPerkCronJob.stop();
		}

		const startTime = this.gameStateRepository.getTimeStarted();
		const endTime = this.gameStateRepository.getTimeEnding();

		this.startEndGameCronJob(this.gameStateRepository.getTimeEnding());
		this.startVoteIsEndingCronJob(this.gameStateRepository.getTimeVoteIsEnding());

		const pickAPerkTimes = this.getTimesPickAPerkStarts(
			startTime, endTime, BIWEEKLY_PERK_DAYS_FROM_WEEK_START,
		);
		this.startPickAPerkCronJobs(pickAPerkTimes);
		this.startDayStartCronJobs(pickAPerkTimes);
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