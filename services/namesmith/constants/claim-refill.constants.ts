import { Duration } from "../../../utilities/date-time-utils";

/**
 * The minimum amount of tokens given to a player when they refill their tokens.
 */
export const MIN_TOKENS_FROM_REFILLING = 50;

/**
 * The average number of tokens a player receives per refill over many refills
 */
export const AVERAGE_TOKENS_FROM_REFILLING = 75;

/**
 * How long players must wait between refills.
 */
export const REFILL_COOLDOWN_DURATION: Duration = { hours: 2 };
