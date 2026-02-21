import { toEnumFromObjects } from "../../../utilities/enum-utilts";
import { perks } from "../database/static-data/perks";

export const Perks = toEnumFromObjects(perks, "name");

/**
 * The percentage of tokens the player currently has that will be rewarded to them at the start of each day with the Investment perk.
 */
export const INVESTMENT_PERCENTAGE = 0.02; // 2%

/**
 * The amount of tokens rewarded at the start of each day when a player with the Idle Interest perk does not spend any tokens
 */
export const IDLE_INTEREST_TOKEN_REWARD = 150;