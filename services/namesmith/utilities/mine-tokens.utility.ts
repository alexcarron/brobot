import { getAnticipatedRandomNum, getRandomBoolean } from "../../../utilities/random-utils";
import {
	CHARACTER_DISCOVERY_BASE_CHANCE,
	MAX_CHARACTER_DISCOVERY_CHANCE,
	CHARACTER_DISCOVERY_CHANCE_INCREMENT_PER_LAYER,
	BASE_COLLAPSE_CHANCE,
	COLLAPSE_CHANCE_DECAY,
	FRACTION_OF_TOKENS_KEPT_ON_COLLAPSE,
	MIN_TOKENS_FOR_MINING,
	MINING_BASE_EXPECTED_TOKENS,
	EXTRA_EXPECTED_TOKENS_PER_LAYER,
	FIRST_LAYER_COLLAPSE_CHANCE,
	FIRST_LAYER_CHARACTER_DISCOVERY_CHANCE,
} from "../constants/mine-tokens.constants";

/**
 * Gets the chance the mine collapses if a player digs deeper from the given layer.
 * @param layerNumber The layer the player is currently on.
 * @returns The chance of collapse, from 0 to 1.
 */
export function getCollapseChanceAtLayer(layerNumber: number): number {
	if (layerNumber <= 1) return FIRST_LAYER_COLLAPSE_CHANCE;

	const baseNonCollapseChance = 1 - BASE_COLLAPSE_CHANCE;

	return 1 - (baseNonCollapseChance * Math.pow(COLLAPSE_CHANCE_DECAY, layerNumber - 2));
}

/**
 * Determines whether the mine collapses when digging deeper from the given layer.
 * @param layerNumber The layer the player is currently on.
 * @returns Whether the mine collapsed.
 */
export function doesMineCollapseAtLayer(layerNumber: number): boolean {
	return getRandomBoolean(getCollapseChanceAtLayer(layerNumber));
}

/**
 * Gets the expected number of tokens a dig on the given layer will give.
 * @param layerNumber The layer being dug.
 * @returns The expected tokens for that layer.
 */
export function getExpectedTokensAtLayer(layerNumber: number): number {
	return MINING_BASE_EXPECTED_TOKENS * (1 + EXTRA_EXPECTED_TOKENS_PER_LAYER * (layerNumber - 1));
}

/**
 * Determines the number of tokens earned from a mine on the given layer.
 * @param layerNumber The layer being mined in.
 * @returns The number of tokens earned, rounded to the nearest whole token.
 */
export function getRandomTokensGivenForMine(layerNumber: number): number {
	return Math.round(getAnticipatedRandomNum({
		expectedValue: getExpectedTokensAtLayer(layerNumber),
		minimumValue: MIN_TOKENS_FOR_MINING,
	}));
}

/**
 * Gets the chance of discovering a character from a mine on the given layer.
 * @param layerNumber The layer being mined in.
 * @returns The chance of discovering a character, from 0 to 1.
 */
export function getCharacterDiscoveryChanceAtLayer(layerNumber: number): number {
	if (layerNumber <= 1) return FIRST_LAYER_CHARACTER_DISCOVERY_CHANCE;

	const chanceOfDiscoveringCharacter = 
		CHARACTER_DISCOVERY_BASE_CHANCE + CHARACTER_DISCOVERY_CHANCE_INCREMENT_PER_LAYER * (layerNumber - 2);

	return Math.min(chanceOfDiscoveringCharacter, MAX_CHARACTER_DISCOVERY_CHANCE);
}

/**
 * Determines whether a mine on the given layer discovers a character.
 * @param layerNumber The layer being mined in.
 * @returns Whether a character was discovered.
 */
export function isCharacterDiscoveredAtLayer(layerNumber: number): boolean {
	return getRandomBoolean(getCharacterDiscoveryChanceAtLayer(layerNumber));
}

/**
 * Gets the number of tokens kept after a mine collapse.
 * @param tokensCollected The number of tokens collected during the run before the collapse.
 * @returns The number of tokens kept, rounded down.
 */
export function getTokensKeptAfterCollapse(tokensCollected: number): number {
	return Math.floor(tokensCollected * FRACTION_OF_TOKENS_KEPT_ON_COLLAPSE);
}
