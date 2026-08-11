import { logInfo, logWarning } from "../../../utilities/logging-utils";
import { GameStateRepository } from "../repositories/game-state.repository";
import { VoteService } from "./vote.service";
import { PlayerService } from "./player.service";
import { RecipeService } from "./recipe.service";
import { addDuration, Duration, subtractDuration, toDurationText } from "../../../utilities/date-time-utils";
import { CronJobScheduler } from "../../../utilities/cron-job-scheduler";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { NamesmithEvents } from "../event-listeners/namesmith-events";
import { GameIsNotActiveError, GameStateInitializationError } from "../utilities/error.utility";
import { BUILD_PHASE_DURATION, DAY_DURATION, TIME_BEFORE_VOTING_TO_SEND_REMINDER, PERK_WINDOW_OFFSETS_FROM_WEEK_START, VOTE_PHASE_DURATION, WEEK_DURATION } from "../constants/game-state.constants";

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
		return addDuration(this.getTimeGameStarts(), BUILD_PHASE_DURATION());
	}

	getTimeVotingEnds(): Date {
		return addDuration(this.getTimeVotingStarts(), VOTE_PHASE_DURATION());
	}

	getTimesPickAPerkStarts(): Date[] {
		return this.computeTimesPickAPerkStarts(
			this.getTimeGameStarts(),
			this.getTimeVotingStarts(),
			PERK_WINDOW_OFFSETS_FROM_WEEK_START()
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
	 * Returns when each reminder to finalize a name is sent, along with how long before voting starts that reminder is.
	 * @returns An entry for each configured reminder, in the order the reminders are configured.
	 */
	getTimesVotingStartRemindersSend(): { time: Date; durationUntilVotingStarts: Duration }[] {
		const timeVotingStarts = this.getTimeVotingStarts();

		return TIME_BEFORE_VOTING_TO_SEND_REMINDER().map(durationUntilVotingStarts => ({
			time: subtractDuration(timeVotingStarts, durationUntilVotingStarts),
			durationUntilVotingStarts,
		}));
	}

	/**
	 * Sets the game's start time to the given date, and its vote start and end times according to the configured constants.
	 * @param startDate - The date to set as the start of the game.
	 */
	setupTimings(startDate: Date) {
		const timeVotingStarts = addDuration(startDate, BUILD_PHASE_DURATION());
		const timeVotingEnds = addDuration(timeVotingStarts, VOTE_PHASE_DURATION());

		this.gameStateRepository.setGameState({
			timeStarted: startDate,
			timeEnding: timeVotingStarts,
			timeVoteIsEnding: timeVotingEnds,
		});
	}

	/**
	 * Returns an array of dates representing the start of each week's "pick a perk" phase.
	 * The dates are calculated based on the given start date and the configured constants for the length of the build name phase and the offsets from the week start.
	 * @param startDate - The start date of the game.
	 * @param endDate - The end date of the game.
	 * @param pickAPerkOffsetsFromWeekStart - The offsets from the week start for each "pick a perk" phase.
	 * @returns An array of dates representing the start of each week's "pick a perk" phase.
	 */
	computeTimesPickAPerkStarts(
		startDate: Date,
		endDate: Date,
		pickAPerkOffsetsFromWeekStart: Duration[]
	): Date[] {
		const pickAPerkTimes: Date[] = [];

		let currentWeekStart = startDate;
		while (currentWeekStart < endDate) {
			for (const offset of pickAPerkOffsetsFromWeekStart) {
				const pickAPerkTime = addDuration(currentWeekStart, offset);

				if (pickAPerkTime >= endDate) {
					return pickAPerkTimes;
				}
				else {
					pickAPerkTimes.push(pickAPerkTime);
				}
			}
			currentWeekStart = addDuration(currentWeekStart, WEEK_DURATION());
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
			currentDayStart = addDuration(currentDayStart, DAY_DURATION());
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
			currentWeekStart = addDuration(currentWeekStart, WEEK_DURATION());
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
			const dayEnd = addDuration(dayStart, DAY_DURATION());

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
			const weekEnd = addDuration(weekStart, WEEK_DURATION());

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

		const pickAPerkTimes = this.getTimesPickAPerkStarts();
		this.gameEventsScheduler.scheduleTaskAtEachDate("pick a perk", pickAPerkTimes,
			() => NamesmithEvents.PickAPerk.triggerEvent({})
		);

		const dayStartTimes = this.getTimesDayStarts();
		this.gameEventsScheduler.scheduleTaskAtEachDate("day start", dayStartTimes,
			() => NamesmithEvents.DayStart.triggerEvent({})
		);

		const weekStartTimes = this.getTimesWeekStarts();
		this.gameEventsScheduler.scheduleTaskAtEachDate("week start", weekStartTimes,
			() => NamesmithEvents.WeekStart.triggerEvent({})
		);

		const votingStartReminders = this.getTimesVotingStartRemindersSend();
		for (const { time, durationUntilVotingStarts } of votingStartReminders) {
			this.gameEventsScheduler.scheduleTaskAt(
				`voting start reminder ${toDurationText(durationUntilVotingStarts)} before`,
				time,
				() => NamesmithEvents.VotingStartReminder.triggerEvent({ durationUntilVotingStarts })
			);
		}

		logInfo(`Game events scheduled: start voting, end voting, ${pickAPerkTimes.length} pick-a-perk, ${dayStartTimes.length} day starts, ${weekStartTimes.length} week starts, ${votingStartReminders.length} voting reminders.`);
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
