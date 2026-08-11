import { DAYS_IN_WEEK, Duration, scaleDuration } from "../../../utilities/date-time-utils";
import { chooseByEnv } from "../../../utilities/environment-utils";

/**
 * The duration of one in-game day.
 * @returns The duration of one in-game day.
 */
export function DAY_DURATION(): Duration {
	return chooseByEnv({
		development: { seconds: 20 },
		production: { days: 1 },
	});
}

/**
 * The duration of one in-game week.
 * @returns The duration of one in-game week.
 */
export function WEEK_DURATION(): Duration {
	return scaleDuration(DAY_DURATION(), DAYS_IN_WEEK);
}

/**
 * How long players have to create and publish their names before voting begins.
 * @returns The duration of the build phase.
 */
export function BUILD_PHASE_DURATION(): Duration {
	return chooseByEnv({
		development: { minutes: 14 },
		production: { days: DAYS_IN_WEEK * 2 },
	});
}

/**
 * How long players have to vote on their favorite name before the game ends.
 * @returns The duration of the vote phase.
 */
export function VOTE_PHASE_DURATION(): Duration {
	return chooseByEnv({
		development: { minutes: 6 },
		production: { days: 4 },
	});
}

/**
 * The offsets from the start of each week at which a "pick a perk" window opens.
 * The start of the week depends on the day the player begins the game.
 * @returns The offsets from the start of each week at which a "pick a perk" window opens.
 */
export function PERK_WINDOW_OFFSETS_FROM_WEEK_START(): Duration[] {
	return chooseByEnv({
		development: [{ seconds: 60 }, { seconds: 120 }],
		production: [{ days: 3 }, { days: 6 }],
	});
}

/**
 * How long before voting starts that each reminder to finalize a name is sent.
 * One reminder is sent for each value, and the smallest value is treated as the final reminder.
 * @returns The time before voting starts each reminder is sent.
 */
export function TIME_BEFORE_VOTING_TO_SEND_REMINDER(): Duration[] {
	return chooseByEnv({
		development: [{ minutes: 6 }, { seconds: 72 }],
		production: [{ hours: 48 }, { hours: 6 }],
	});
}
