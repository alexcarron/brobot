import { logWarning } from "../../../utilities/logging-utils";
import { GameStateRepository } from "../repositories/game-state.repository";
import { VoteService } from "./vote.service";
import { PlayerService } from "./player.service";
import { RecipeService } from "./recipe.service";
import { addDays, addHours } from "../../../utilities/date-time-utils";
import { CronJobScheduler } from "../../../utilities/cron-job-scheduler";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { GameIsNotActiveError, GameStateInitializationError } from "../utilities/error.utility";
import { BIWEEKLY_PERK_DAYS_FROM_WEEK_START, DAYS_TO_BUILD_NAME, DAYS_TO_VOTE, HOURS_BEFORE_VOTING_TO_SEND_REMINDER } from "../constants/game-state.constants";

/**
 * Provides methods for interacting with the game state.
 */
export class GameStateService {
	private gameEventsScheduler = new CronJobScheduler("Namesmith game events");

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
	 * Retrieves the current game state, without requiring it to be fully defined.
	 * @returns The current game state, with any unset fields as null.
	 */
	getGameState() {
		return this.gameStateRepository.getGameState();
	}

	/**
	 * Retrieves the current game state.
	 * @throws {GameStateInitializationError} - If the game state is not defined.
	 * @returns The current game state, with all fields defined.
	 */
	getDefinedGameState() {
		return this.gameStateRepository.getDefinedGameState();
	}

	throwIfNotDefined(): void {
		this.gameStateRepository.getDefinedGameState();
	}

	getTimeGameStarts(): Date {
		return this.gameStateRepository.getDefinedGameState().timeStarted;
	}

	getTimeVotingStarts(): Date {
		return addDays(this.getTimeGameStarts(), DAYS_TO_BUILD_NAME);
	}

	getTimeVotingEnds(): Date {
		return addDays(this.getTimeGameStarts(), DAYS_TO_BUILD_NAME + DAYS_TO_VOTE);
	}

	getTimesPickAPerkStarts(): Date[] {
		return this.computeTimesPickAPerkStarts(
			this.getTimeGameStarts(),
			this.getTimeVotingStarts(),
			BIWEEKLY_PERK_DAYS_FROM_WEEK_START
		);
	}

	getTimesDayStarts(): Date[] {
		return this.computeTimesDayStarts(
			this.getTimeGameStarts(),
			this.getTimeVotingStarts()
		);
	}

	getTimesWeekStarts(): Date[] {
		return this.computeTimesWeekStarts(
			this.getTimeGameStarts(),
			this.getTimeVotingStarts()
		);
	}

	/**
	 * Returns when each reminder to finalize a name is sent, along with how many hours before voting starts that reminder is.
	 * @returns An entry for each configured reminder, in the order the reminders are configured.
	 */
	getTimesVotingStartRemindersSend(): { time: Date; hoursUntilVotingStarts: number }[] {
		const timeVotingStarts = this.getTimeVotingStarts();

		return HOURS_BEFORE_VOTING_TO_SEND_REMINDER.map(hoursUntilVotingStarts => ({
			time: addHours(timeVotingStarts, -hoursUntilVotingStarts),
			hoursUntilVotingStarts,
		}));
	}

	/**
	 * Sets the game's start time to the given date, and its vote start and end times according to the configured constants.
	 * @param startDate - The date to set as the start of the game.
	 */
	setupTimings(startDate: Date) {
		const timeVotingStarts = addDays(startDate, DAYS_TO_BUILD_NAME);
		const timeVotingEnds = addDays(startDate, DAYS_TO_BUILD_NAME + DAYS_TO_VOTE);

		this.gameStateRepository.setGameState({
			timeStarted: startDate,
			timeEnding: timeVotingStarts,
			timeVoteIsEnding: timeVotingEnds,
		});
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

		const dayStarts = this.getTimesDayStarts();
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

		const weekStarts = this.getTimesWeekStarts();
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
			throw new GameIsNotActiveError(now, this.getTimeGameStarts(), this.getTimeVotingStarts());
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
			throw new GameIsNotActiveError(now, this.getTimeGameStarts(), this.getTimeVotingStarts());
		}

		return weekStart;
	}

	/**
	 * Schedules every timed game event, cancelling any previously scheduled ones first so this is safe to call again after a bot restart.
	 * Events whose time has already passed are skipped rather than fired immediately.
	 */
	scheduleGameEvents(): void {
		this.gameEventsScheduler.cancelAll();

		const { timeEnding, timeVoteIsEnding } = this.gameStateRepository.getGameState();

		this.gameEventsScheduler.scheduleTaskAt("start voting", timeEnding,
			() => NamesmithEvents.StartVoting.triggerEvent({})
		);

		this.gameEventsScheduler.scheduleTaskAt("end voting", timeVoteIsEnding,
			() => NamesmithEvents.EndVoting.triggerEvent({})
		);

		this.gameEventsScheduler.scheduleTaskAtEachDate("pick a perk", this.getTimesPickAPerkStarts(),
			() => NamesmithEvents.PickAPerk.triggerEvent({})
		);

		this.gameEventsScheduler.scheduleTaskAtEachDate("day start", this.getTimesDayStarts(),
			() => NamesmithEvents.DayStart.triggerEvent({})
		);

		this.gameEventsScheduler.scheduleTaskAtEachDate("week start", this.getTimesWeekStarts(),
			() => NamesmithEvents.WeekStart.triggerEvent({})
		);

		for (const { time, hoursUntilVotingStarts } of this.getTimesVotingStartRemindersSend()) {
			this.gameEventsScheduler.scheduleTaskAt(
				`voting start reminder ${hoursUntilVotingStarts} hours before`,
				time,
				() => NamesmithEvents.VotingStartReminder.triggerEvent({ hoursUntilVotingStarts })
			);
		}
	}

	/**
	 * Determines if the game has started.
	 * @returns Whether the game has started.
	 */
	hasStarted(): boolean {
		const { timeStarted } = this.gameStateRepository.getGameState();
		if (timeStarted === null) return false;

		const now = new Date();
		return now > timeStarted;
	}

	isVotingOpen(): boolean {
		const { timeVoteIsEnding } = this.gameStateRepository.getGameState();
		if (timeVoteIsEnding === null) {
			logWarning(`Could not determine if voting is closed because the game state is not fully initialized.`);
			return false;
		}

		const now = new Date();
		return now.getTime() < timeVoteIsEnding.getTime();
	}

	/**
	 * Sets the theme of the game.
	 * @param {string} theme - The theme of the game.
	 */
	setTheme(theme: string): void {
		this.gameStateRepository.setGameState({ theme });
	}

	/**
	 * Retrieves the theme of the game from the game state.
	 * @returns The theme of the game, or null if no theme is set.
	 */
	getTheme(): string | null {
		return this.gameStateRepository.getGameState().theme;
	}

	/**
	 * Retrieves the theme for the current game from the game state, throwing if it hasn't been set.
	 * @throws {GameStateInitializationError} - If no theme is set.
	 * @returns The theme for the current game.
	 */
	getThemeOrThrow(): string {
		const theme = this.getTheme();
		if (theme === null) throw new GameStateInitializationError();
		return theme;
	}

	reset(): void {
		this.gameEventsScheduler.cancelAll();
		this.gameStateRepository.reset();
	}
}