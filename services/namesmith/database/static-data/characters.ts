import { CharacterDefintion } from "../../types/character.types";
import { getCharacters } from "../../../../utilities/string-checks-utils";
import { mysteryBoxes } from "./mystery-boxes";
import { recipes } from "./recipes";

// This file must not import from utilities/character.utility.ts: that module (transitively, via
// constants/character.constants.ts) imports the `characters` export below, so importing it here would
// create a circular dependency. A character's ID is just its first code point, computed inline instead.
function getIDfromFirstCodePoint(value: string): number {
	return value.codePointAt(0)!;
}

const RARITY_PER_MYSTERY_BOX_WEIGHT = 10;
const RARITY_OF_RECIPE_ONLY_CHARACTERS = 1;

function getCharacterValueToLowestBoxWeight(): Map<string, number> {
	const valueToLowestWeight = new Map<string, number>();

	for (const mysteryBox of mysteryBoxes) {
		for (const [value, weight] of Object.entries(mysteryBox.characterOdds)) {
			const lowestWeightSoFar = valueToLowestWeight.get(value);
			if (lowestWeightSoFar === undefined || weight < lowestWeightSoFar)
				valueToLowestWeight.set(value, weight);
		}
	}

	return valueToLowestWeight;
}

function getCharacterValuesReferencedByRecipes(): Set<string> {
	const characterValues = new Set<string>();

	for (const recipe of recipes) {
		for (const characterValue of getCharacters(recipe.inputCharacters))
			characterValues.add(characterValue);

		for (const characterValue of getCharacters(recipe.outputCharacters))
			characterValues.add(characterValue);
	}

	return characterValues;
}

const characterValueToLowestBoxWeight = getCharacterValueToLowestBoxWeight();
const characterValuesReferencedByRecipes = getCharacterValuesReferencedByRecipes();

// A character's ID is its FIRST code point (getIDfromCharacterValue), so two different multi-codepoint
// values (e.g. "‼" and "‼️") can collide on ID. Box-sourced values are listed first and win any collision,
// since they're the ones actually reachable through gameplay (mining/box odds).
const idToCharacterValue = new Map<number, string>();
for (const value of [...characterValueToLowestBoxWeight.keys(), ...characterValuesReferencedByRecipes]) {
	const id = getIDfromFirstCodePoint(value);
	if (!idToCharacterValue.has(id))
		idToCharacterValue.set(id, value);
}

export const characters: CharacterDefintion[] = Array.from(idToCharacterValue.values()).map(value => {
	const lowestBoxWeight = characterValueToLowestBoxWeight.get(value);

	const rarity = lowestBoxWeight === undefined
		? RARITY_OF_RECIPE_ONLY_CHARACTERS
		: Math.max(1, Math.round(lowestBoxWeight * RARITY_PER_MYSTERY_BOX_WEIGHT));

	return { value, rarity };
});
