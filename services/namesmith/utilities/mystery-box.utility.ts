import { MysteryBoxes } from "../constants/mystery-box.constants";
import { CharacterOdds, MysteryBox, MysteryBoxID } from "../types/mystery-box.types";

/**
 * Returns an array of all mystery box objects in the game staticly.
 * @returns An array of all mystery box objects.
 */
export function getStaticMysteryBoxes(): MysteryBox[] {
	return [...Object.values(MysteryBoxes)];
}

const PREVIEW_TRUNCATION_INDICATOR = '…';

/**
 * Builds a packed preview of the characters a mystery box can award, ordered most likely first (by odds descending), packing in as many whole characters as fit within the given length and appending a trailing ellipsis when any are dropped.
 * Only whole characters are ever appended, so a multi-code-unit character (emoji, combining sequence) is never split at the cut.
 * @param characterOdds - The character odds of the mystery box to preview.
 * @param maxLength - The maximum length the returned preview string may be.
 * @returns The packed preview string, ending in an ellipsis if it was truncated.
 */
export function getMysteryBoxCharacterPreview(characterOdds: CharacterOdds, maxLength: number): string {
	const charactersByDescendingOdds = Object.entries(characterOdds)
		.sort(([, characterOdds1], [, characterOdds2]) => characterOdds2 - characterOdds1)
		.map(([character]) => character);

	let mysteryBoxCharactersPreview = '';
	let wasTruncated = false;

	for (let index = 0; index < charactersByDescendingOdds.length; index++) {
		const character = charactersByDescendingOdds[index];
		const isLastCharacter = index === charactersByDescendingOdds.length - 1;
		const truncationIndicatorLength = isLastCharacter ? 0 : PREVIEW_TRUNCATION_INDICATOR.length;

		if (mysteryBoxCharactersPreview.length + character.length + truncationIndicatorLength <= maxLength) {
			mysteryBoxCharactersPreview += character;
		}
		else {
			wasTruncated = true;
			break;
		}
	}

	if (wasTruncated) {
		mysteryBoxCharactersPreview += PREVIEW_TRUNCATION_INDICATOR;
	}

	return mysteryBoxCharactersPreview;
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