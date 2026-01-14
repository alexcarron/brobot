/**
 * The largest amount of characters allowed in a current name of a player.
 */
export const MAX_NAME_LENGTH = 32;

/**
 * The name displayed for a player with no current name.
 */
export const DISCORD_NICKNAME_FOR_NO_NAME = "˙";

/**
 * The number of days players will have to create and publish their names before voting begins.
 */
export const DAYS_TO_BUILD_NAME = 7 * 2; // 2 Weeks

/**
 * The day offsets from the start of the week when perk events occur.
 * Each event reveals three new perks for players to choose.
 * The start of the week depends on the day the player begins the game.
 */
export const BIWEEKLY_PERK_DAYS_FROM_WEEK_START = [3, 6];

/**
 * The number of days players will have to vote on their favorite name before the game ends.
 */
export const DAYS_TO_VOTE = 3; // 3 Days

/**
 * The number of tokens given to a player when they mine tokens.
 */
export const MIN_TOKENS_FOR_MINING = 1;

/**
 * The average amount of tokens a player will receive over many mine operations.
 */
export const MINING_EXPECTED_VALUE = 1.5;

/**
 * The minimum amount of tokens given to a player when they refill their tokens.
 */
export const MIN_TOKENS_FROM_REFILLING = 50;

/**
 * The average number of tokens a player receives per refill over many refills
 */
export const AVERAGE_TOKENS_FROM_REFILLING = 75;

/**
 * The number of hours players must wait between refills.
 */
export const REFILL_COOLDOWN_HOURS = 2;

export const HIDDEN_QUEST_TOKEN_MULTIPLIER = 1.5;