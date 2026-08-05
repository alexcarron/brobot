import { DAYS_IN_WEEK } from "../../../utilities/date-time-utils";

/**
 * The number of days players will have to create and publish their names before voting begins.
 */
export const DAYS_TO_BUILD_NAME = DAYS_IN_WEEK * 1;

/**
 * The number of days players will have to vote on their favorite name before the game ends.
 */
export const DAYS_TO_VOTE = 3;

/**
 * The day offsets from the start of the week when perk events occur.
 * Each event reveals three new perks for players to choose.
 * The start of the week depends on the day the player begins the game.
 */
export const BIWEEKLY_PERK_DAYS_FROM_WEEK_START = [3, 6];

/**
 * The number of hours before voting starts at which players are reminded to finalize their name.
 * One reminder is sent for each value, and the smallest value is treated as the final reminder.
 */
export const HOURS_BEFORE_VOTING_TO_SEND_REMINDER = [48, 6];