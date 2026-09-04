import { Character } from "../types/character.types";
import { MysteryBox } from "../types/mystery-box.types";
import { CHARACTER_DISCOVERY_MYSTERY_BOX_ID } from "../constants/mine-tokens.constants";
import {
	MINIMUM_SELL_VALUE,
	SELL_VALUE_FRACTION_OF_CHEAPEST_BOX,
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

export function getSellValueFromRarityScale(
	{ characters, cheapestMysteryBox }: { characters: Character[], cheapestMysteryBox: MysteryBox }
): number {
	const rarityByCharacterValue = new Map(
		characters.map(character => [character.value, character.rarity])
	);

	let totalWeight = 0;
	let weightTimesRaritySum = 0;
	for (const [characterValue, weight] of Object.entries(cheapestMysteryBox.characterOdds)) {
		const rarity = rarityByCharacterValue.get(characterValue);
		if (rarity === undefined) continue;
		totalWeight += weight;
		weightTimesRaritySum += weight * rarity;
	}
	if (weightTimesRaritySum === 0) return 0;

	return SELL_VALUE_FRACTION_OF_CHEAPEST_BOX * cheapestMysteryBox.tokenCost * totalWeight / weightTimesRaritySum;
}

export function getSellValueFromRarity(
	{ rarity, sellValueScale }: { rarity: number, sellValueScale: number }
): number {
	return Math.max(MINIMUM_SELL_VALUE, Math.floor(sellValueScale * rarity));
}
