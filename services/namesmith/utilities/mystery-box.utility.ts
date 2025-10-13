import { isObject, isStringToNumberRecord } from "../../../utilities/types/type-guards";
import { CharacterOdds, MinimalMysteryBox, MysteryBox } from "../types/mystery-box.types";

/**
 * Checks if a given value is an object where each key is a character and each value is a number representing the odds of the character being in a mystery box.
 * @param value - The value to check.
 * @returns If the value is an object with character keys and number values.
 */
export const isCharacterOdds = (value: unknown): value is CharacterOdds => (
	isObject(value) &&
	Object.keys(value).length > 0 &&
	isStringToNumberRecord(value)
)

/**
 * Checks if a given value is a mystery box object with the given properties.
 * @param value - The value to check.
 * @returns If the value is a mystery box object with the given properties.
 */
export const isMysteryBox = (value: unknown): value is MinimalMysteryBox => (
	value !== null &&
	typeof value === 'object' &&
	'id' in value &&
	typeof value.id === 'number' &&
	'name' in value &&
	typeof value.name === 'string' &&
	'tokenCost' in value &&
	typeof value.tokenCost === 'number'
);

/**
 * Checks if a given value is a mystery box object with character odds.
 * The value must be an object with properties matching those of a MysteryBox,
 * and it must also contain valid character odds.
 * @param value - The value to check.
 * @returns If the value is a mystery box object with character odds.
 */
export const isMysteryBoxWithOdds = (value: unknown): value is MysteryBox => {
	return (
		isMysteryBox(value) &&
		'characterOdds' in value &&
		isCharacterOdds(value.characterOdds)
	)
};