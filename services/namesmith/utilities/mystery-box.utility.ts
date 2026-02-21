import { isObject, isStringToNumberRecord } from "../../../utilities/types/type-guards";
import { MysteryBoxes } from "../constants/mystery-boxes.constants";
import { CharacterOdds, MinimalMysteryBox, MysteryBox, MysteryBoxID } from "../types/mystery-box.types";

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

/**
 * Returns an array of all mystery box objects in the game staticly.
 * @returns An array of all mystery box objects.
 */
export function getStaticMysteryBoxes(): MysteryBox[] {
	return [...Object.values(MysteryBoxes)];
}

/**
 * Returns a static mystery box in the game.
 * @param mysteryBoxID - The ID of the mystery box to get the token cost for.
 * @returns The static mystery box with the given ID or null if no such object exists.
 */
export function getStaticMysteryBox(mysteryBoxID: MysteryBoxID | null): MysteryBox | null {
	if (mysteryBoxID === null) return null;

	const mysteryBoxes = getStaticMysteryBoxes();
	const mysteryBox = mysteryBoxes.find(mysteryBox => mysteryBox.id === mysteryBoxID);
	if (mysteryBox === undefined)
		return null;
	
	return mysteryBox;
}