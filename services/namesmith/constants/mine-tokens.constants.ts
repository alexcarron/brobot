import { MysteryBoxes } from "./mystery-boxes.constants";

/**
 * The minimum number of tokens given to a player when they mine tokens.
 */
export const MIN_TOKENS_FOR_MINING = 1;

/**
 * The average amount of tokens a player will receive for their first mine.
 * Also is the base expected value for mining before the layer-based growth is applied.
 */
export const MINING_BASE_EXPECTED_TOKENS = 1.5;

/**
 * The fraction of the tokens collected during a mining session that a player keeps if the mine collapses.
 */
export const FRACTION_OF_TOKENS_KEPT_ON_COLLAPSE = 0.25;

/**
 * The chance of collapse on the first layer of a mining session.
 */
export const FIRST_LAYER_COLLAPSE_CHANCE = 0;

/**
 * The chance of collapse on layer 2 of a mining session.
 * Also is the base chance of collapse before the layer-based growth is applied.
 */
export const BASE_COLLAPSE_CHANCE = 0.05;

/**
 * How much closer the collapse chance moves toward 100% with each layer past layer 2 in a mining session.
 */
export const COLLAPSE_CHANCE_DECAY = 0.85;

/**
 * The factor by which a layer's expected tokens grows for each layer past the first.
 */
export const EXTRA_EXPECTED_TOKENS_PER_LAYER = 0.25;

/**
 * The chance of discovering a character on the first layer of a mining session.
 */
export const FIRST_LAYER_CHARACTER_DISCOVERY_CHANCE = 0;

/**
 * The chance of discovering a character on layer 2 of a mining session.
 * Also is the base chance of discovering a character before the layer-based growth is applied.
 */
export const CHARACTER_DISCOVERY_BASE_CHANCE = 0.03;

/**
 * How much the chance of discovering a character increases with each layer past layer 2.
 */
export const CHARACTER_DISCOVERY_CHANCE_INCREMENT_PER_LAYER = 0.01;

/**
 * The highest possible chance of discovering a character, no matter how deep a mining session goes.
 */
export const MAX_CHARACTER_DISCOVERY_CHANCE = 0.25;

/**
 * The ID of the mystery box whose characters odds are reused to determine which character is discovered while mining.
 */
export const CHARACTER_DISCOVERY_MYSTERY_BOX_ID = MysteryBoxes.ALL_CHARACTERS.id;

/**
 * How many seconds auto-mine waits between each automatic mine.
 */
export const AUTO_MINE_INTERVAL_SECONDS = 3.5;
