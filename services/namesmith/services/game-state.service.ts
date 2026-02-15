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
import { GameIsNotActiveError, GameStateInitializationError } from "../utilities/error.utility";

/**
 * Provides methods for interacting with the game state.
 */
export class GameStateService {
	private endGameCronJob?: CronJob;
	private voteIsEndingCronJob?: CronJob;
	private pickAPerkCronJobs: CronJob[] = [];
	private dayStartCronJobs: CronJob[] = [];
	private weekStartCronJobs: CronJob[] = [];
	
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

	get timeGameStarts(): Date {
		return this.gameStateRepository.getTimeStarted();
	}

	get timeVotingStarts(): Date {
		return addDays(this.timeGameStarts, DAYS_TO_BUILD_NAME);
	}

	get timeVotingEnds(): Date {
		return addDays(this.timeGameStarts, DAYS_TO_BUILD_NAME + DAYS_TO_VOTE);
	}

	get timesPickAPerkStarts(): Date[] {
		return this.computeTimesPickAPerkStarts(
			this.timeGameStarts,
			this.timeVotingStarts,
			BIWEEKLY_PERK_DAYS_FROM_WEEK_START
		);
	}

	get timesDayStarts(): Date[] {
		return this.computeTimesDayStarts(
			this.timeGameStarts,
			this.timeVotingStarts
		);
	}

	get timesWeekStarts(): Date[] {
		return this.computeTimesWeekStarts(
			this.timeGameStarts,
			this.timeVotingStarts
		);
	}

	/**
	 * Sets the game's start time to the given date, and its vote start and end times according to the configured constants.
	 * @param startDate - The date to set as the start of the game.
	 */
	setupTimings(startDate: Date) {
		this.gameStateRepository.setTimeStarted(startDate);
		this.gameStateRepository.setTimeVoting(this.timeVotingStarts);
		this.gameStateRepository.setTimeVotingEnds(this.timeVotingEnds);

		// logInfo(joinLines(
		// 	`Game timings have been set to:`,
		// 	`Game Start Time: ${toConciseReadableDate(this.timeGameStarts)}`,
		// 	`Voting Start Time: ${toConciseReadableDate(this.timeVotingStarts)}`,
		// 	`Voting End Time: ${toConciseReadableDate(this.timeVotingEnds)}`,
		// 	``,
		// 	`Pick a Perk Start Times: ${toConciseReadableDates(this.timesPickAPerkStarts)}`,
		// 	``,
		// 	`Day Start Times: ${toConciseReadableDates(this.timesDayStarts)}`,
		// 	``,
		// 	`Week Start Times: ${toConciseReadableDates(this.timesWeekStarts)}`,
		// ));
	}

	/**
	 * Throws a GameStateInitializationError if the game state is not defined.
	 * @throws {GameStateInitializationError} - If the game state is not defined.
	 */
	throwIfNotDefined() {
		const startTime = this.timeGameStarts;
		const votingStartTime = this.timeVotingStarts;
		const votingEndTime = this.timeVotingEnds;
		const pickAPerkTime = this.timesPickAPerkStarts;
		const dayStartTimes = this.timesDayStarts;

		if (
			!startTime ||
			!votingStartTime ||
			!votingEndTime ||
			pickAPerkTime.length === 0 ||
			dayStartTimes.length === 0
		) {
			throw new GameStateInitializationError();
		}
	}

	/**
	 * Returns an array of dates representing the start of each week's "pick a perk" phase.
	 * The dates are calculated based on the given start date and the configured constants for the length of the build name phase and the days offset from the week start.
	 * @param startDate - The start date of the game.
	 * @param endDate - The end date of the game.
	 * @param pickAPerkDaysFromWeekStart - The days offset from the week start for each "pick a perk" phase.
	 * @returns An array of dates representing the start of each week's "pick a perk" phase.
	 */
	computeTimesPickAPerkStarts(
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
	computeTimesDayStarts(
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
	 * Returns an array of dates representing the start of each week from the given start date to the given end date.
	 * @param startDate - The start date of the game.
	 * @param endDate - The end date of the game.
	 * @returns An array of dates representing the start of each week from the given start date to the given end date.
	 */
	computeTimesWeekStarts(
		startDate: Date,
		endDate: Date
	): Date[] {
		const times: Date[] = [];
		let currentWeekStart = startDate;
		while (currentWeekStart < endDate) {
			times.push(currentWeekStart);
			currentWeekStart = addDays(currentWeekStart, 7);
		}

		return times;
	}

	/**
	 * Returns the start of the day that the given date falls in.
	 * @param now - The date to check.
	 * @returns The start of the day that the given date falls in, or null if the given date is before the start of the game.
	 */
	getStartOfToday(now: Date): Date | null {
		this.throwIfNotDefined();

		const dayStarts = this.timesDayStarts;
		if (dayStarts.length === 0)
			throw new GameStateInitializationError();

		for (const dayStart of dayStarts) {
			const dayEnd = addDays(dayStart, 1);

			if (now >= dayStart && now < dayEnd) {
				return dayStart;
			}
		}

		return null;
	}

	/**
	 * Returns the start of the week that the given date falls in.
	 * @param now - The date to check.
	 * @returns The start of the week that the given date falls in, or null if the given date is before the start of the game.
	 */
	getStartOfWeek(now: Date): Date | null {
		this.throwIfNotDefined();

		const weekStarts = this.timesWeekStarts;
		if (weekStarts.length === 0)
			throw new GameStateInitializationError();

		for (const weekStart of weekStarts) {
			const weekEnd = addDays(weekStart, 7);

			if (now >= weekStart && now < weekEnd) {
				return weekStart;
			}
		}

		return null;
	}

	/**
	 * Returns the start of the day that the given date falls in, or throws a GameIsNotActiveError if the given date is before the start of the game.
	 * @param now - The date to check.
	 * @throws {GameStateInitializationError} - If the game state is not defined.
	 * @throws {GameIsNotActiveError} - If the given date is before the start of the game.
	 * @returns The start of the day that the given date falls in.
	 */
	getStartOfTodayOrThrow(now: Date) {
		const dayStart = this.getStartOfToday(now);

		if (dayStart === null) {
			throw new GameIsNotActiveError(now, this.timeGameStarts!, this.timeVotingStarts!);
		}

		return dayStart;
	}

	/**
	 * Returns the start of the week that the given date falls in, or throws a GameIsNotActiveError if the given date is before the start of the game.
	 * @param now - The date to check.
	 * @throws {GameStateInitializationError} - If the game state is not defined.
	 * @throws {GameIsNotActiveError} - If the given date is before the start of the game.
	 * @returns The start of the week that the given date falls in.
	 */
	getStartOfWeekOrThrow(now: Date) {
		const weekStart = this.getStartOfWeek(now);

		if (weekStart === null) {
			throw new GameIsNotActiveError(now, this.timeGameStarts!, this.timeVotingStarts!);
		}

		return weekStart;
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

			const now = new Date();
			if (now < dayStartTime) {
				dayStartCronJob.start();
				this.dayStartCronJobs.push(dayStartCronJob);
			}
		}
	}

	startWeekStartCronJobs(weekStartTimes: Date[]) {
		for (const weekStartTime of weekStartTimes) {
			const weekStartCronJob = new CronJob(
				weekStartTime,
				() => {
					NamesmithEvents.WeekStart.triggerEvent({});
				},
			);

			const now = new Date();
			if (now < weekStartTime) {
				weekStartCronJob.start();
				this.weekStartCronJobs.push(weekStartCronJob);
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
		for (const dayStartCronJob of this.dayStartCronJobs) {
			dayStartCronJob.stop();
		}
		for (const weekStartCronJob of this.weekStartCronJobs) {
			weekStartCronJob.stop();
		}

		this.startEndGameCronJob(this.gameStateRepository.getTimeEnding());
		this.startVoteIsEndingCronJob(this.gameStateRepository.getTimeVoteIsEnding());

		const pickAPerkTimes = this.timesPickAPerkStarts;
		this.startPickAPerkCronJobs(pickAPerkTimes);

		const dayStartTimes = this.timesDayStarts;
		this.startDayStartCronJobs(dayStartTimes);

		const weekStartTimes = this.timesWeekStarts;
		this.startWeekStartCronJobs(weekStartTimes);
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