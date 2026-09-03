import { Character } from "../types/character.types";
import { MysteryBox } from "../types/mystery-box.types";
import { CHARACTER_DISCOVERY_MYSTERY_BOX_ID } from "../constants/mine-tokens.constants";
import {
	MIN_SELL_VALUE_FRACTION_OF_CHEAPEST_BOX,
	SELL_VALUE_FRACTION_OF_CHEAPEST_COST,
} from "../constants/sell-characters.constants";
import {
	getCharacterDiscoveryChanceAtLayer,
	getCollapseChanceAtLayer,
	getExpectedTokensAtLayer,
} from "./mine-tokens.utility";

const MAX_MINING_LAYER_TO_SIMULATE = 500;

export function getMiningSessionSurvivalProbabilityAtLayer(layerNumber: number): number {
	if (layerNumber <= 1) return 1;

	let survivalProbability = 1;
	for (let layer = 2; layer <= layerNumber; layer++)
		survivalProbability *= 1 - getCollapseChanceAtLayer(layer);

	return survivalProbability;
}

export function getExpectedTokensPerMiningSession(): number {
	let expectedTokens = 0;
	let survivalProbability = 1;

	for (let layer = 1; layer <= MAX_MINING_LAYER_TO_SIMULATE; layer++) {
		if (layer > 1)
			survivalProbability *= 1 - getCollapseChanceAtLayer(layer);

		expectedTokens += survivalProbability * getExpectedTokensAtLayer(layer);
	}

	return expectedTokens;
}

export function getExpectedCharactersDiscoveredPerMiningSession(): number {
	let expectedCharacters = 0;
	let survivalProbability = 1;

	for (let layer = 1; layer <= MAX_MINING_LAYER_TO_SIMULATE; layer++) {
		if (layer > 1)
			survivalProbability *= 1 - getCollapseChanceAtLayer(layer);

		expectedCharacters += survivalProbability * getCharacterDiscoveryChanceAtLayer(layer);
	}

	return expectedCharacters;
}

export function getExpectedTokensPerCharacterFromMining(): number {
	return getExpectedTokensPerMiningSession() / getExpectedCharactersDiscoveredPerMiningSession();
}

export function getTotalWeightOfBox(mysteryBox: MysteryBox): number {
	return Object.values(mysteryBox.characterOdds)
		.reduce((totalWeight, weight) => totalWeight + weight, 0);
}

export function getUnitCostOfCharacterInBox(
	{ character, mysteryBox }: { character: Character, mysteryBox: MysteryBox }
): number | null {
	const weight = mysteryBox.characterOdds[character.value];
	if (weight === undefined || weight <= 0) return null;

	const totalWeight = getTotalWeightOfBox(mysteryBox);
	return mysteryBox.tokenCost * totalWeight / weight;
}

export function getCheapestBoxCostForCharacter(
	{ character, mysteryBoxes }: { character: Character, mysteryBoxes: MysteryBox[] }
): number | null {
	const unitCosts = mysteryBoxes
		.map(mysteryBox => getUnitCostOfCharacterInBox({ character, mysteryBox }))
		.filter((unitCost): unitCost is number => unitCost !== null);

	if (unitCosts.length === 0) return null;

	return Math.min(...unitCosts);
}

export function getMiningCostForCharacter(
	{ character, mysteryBoxes }: { character: Character, mysteryBoxes: MysteryBox[] }
): number | null {
	const characterDiscoveryBox = mysteryBoxes.find(
		mysteryBox => mysteryBox.id === CHARACTER_DISCOVERY_MYSTERY_BOX_ID
	);
	if (characterDiscoveryBox === undefined) return null;

	const weight = characterDiscoveryBox.characterOdds[character.value];
	if (weight === undefined || weight <= 0) return null;

	const totalWeight = getTotalWeightOfBox(characterDiscoveryBox);
	const expectedTokensPerCharacter = getExpectedTokensPerCharacterFromMining();

	return expectedTokensPerCharacter * totalWeight / weight;
}

export function getCheapestCostForCharacter(
	{ character, mysteryBoxes }: { character: Character, mysteryBoxes: MysteryBox[] }
): number | null {
	const costs = [
		getCheapestBoxCostForCharacter({ character, mysteryBoxes }),
		getMiningCostForCharacter({ character, mysteryBoxes }),
	].filter((cost): cost is number => cost !== null);

	if (costs.length === 0) return null;

	return Math.min(...costs);
}

export function getMinimumSellValue(mysteryBoxes: MysteryBox[]): number {
	const cheapestMysteryBoxCost = Math.min(...mysteryBoxes.map(mysteryBox => mysteryBox.tokenCost));
	return Math.floor(MIN_SELL_VALUE_FRACTION_OF_CHEAPEST_BOX * cheapestMysteryBoxCost);
}

export function getSellValueForCharacter(
	{ character, mysteryBoxes }: { character: Character, mysteryBoxes: MysteryBox[] }
): number {
	const minimumSellValue = getMinimumSellValue(mysteryBoxes);

	const cheapestCost = getCheapestCostForCharacter({ character, mysteryBoxes });
	if (cheapestCost === null) return minimumSellValue;

	const sellValue = Math.floor(SELL_VALUE_FRACTION_OF_CHEAPEST_COST * cheapestCost);
	return Math.max(sellValue, minimumSellValue);
}
