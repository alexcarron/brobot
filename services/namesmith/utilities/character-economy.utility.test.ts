import { makeSure } from "../../../utilities/jest/jest-utils";
import { characters } from "../database/static-data/characters";
import { mysteryBoxes } from "../database/static-data/mystery-boxes";
import {
	getCheapestBoxCostForCharacter,
	getCheapestCostForCharacter,
	getExpectedCharactersDiscoveredPerMiningSession,
	getExpectedTokensPerCharacterFromMining,
	getExpectedTokensPerMiningSession,
	getMiningSessionSurvivalProbabilityAtLayer,
	getMinimumSellValue,
	getSellValueForCharacter,
	getTotalWeightOfBox,
	getUnitCostOfCharacterInBox,
} from "./character-economy.utility";

describe('character-economy.utility', () => {
	describe('getMiningSessionSurvivalProbabilityAtLayer()', () => {
		it('should be 1 on layer 1', () => {
			makeSure(getMiningSessionSurvivalProbabilityAtLayer(1)).is(1);
		});

		it('should be monotonically non-increasing as layer increases', () => {
			let previousProbability = getMiningSessionSurvivalProbabilityAtLayer(1);

			for (let layer = 2; layer <= 30; layer++) {
				const probability = getMiningSessionSurvivalProbabilityAtLayer(layer);
				makeSure(probability).isLessThanOrEqualTo(previousProbability);
				previousProbability = probability;
			}
		});
	});

	describe('getExpectedTokensPerMiningSession() and getExpectedCharactersDiscoveredPerMiningSession()', () => {
		it('should both be positive', () => {
			makeSure(getExpectedTokensPerMiningSession()).isGreaterThan(0);
			makeSure(getExpectedCharactersDiscoveredPerMiningSession()).isGreaterThan(0);
		});
	});

	describe('getExpectedTokensPerCharacterFromMining()', () => {
		it('should be positive', () => {
			makeSure(getExpectedTokensPerCharacterFromMining()).isGreaterThan(0);
		});
	});

	describe('getTotalWeightOfBox()', () => {
		it('should sum every weight in the box', () => {
			const mysteryBox = {
				id: 1, name: 'Test', tokenCost: 10,
				characterOdds: { a: 1, b: 2, c: 3 },
			};

			makeSure(getTotalWeightOfBox(mysteryBox)).is(6);
		});
	});

	describe('getUnitCostOfCharacterInBox()', () => {
		it('should be cheaper for more common characters', () => {
			const mysteryBox = {
				id: 1, name: 'Test', tokenCost: 100,
				characterOdds: { common: 90, rare: 10 },
			};

			const commonCost = getUnitCostOfCharacterInBox({
				character: { id: 1, value: 'common', rarity: 1 },
				mysteryBox,
			});
			const rareCost = getUnitCostOfCharacterInBox({
				character: { id: 2, value: 'rare', rarity: 1 },
				mysteryBox,
			});

			makeSure(commonCost).isLessThan(rareCost!);
		});

		it('should return null if the character is not in the box', () => {
			const mysteryBox = { id: 1, name: 'Test', tokenCost: 100, characterOdds: { a: 1 } };
			const cost = getUnitCostOfCharacterInBox({
				character: { id: 99, value: 'z', rarity: 1 },
				mysteryBox,
			});

			makeSure(cost).is(null);
		});
	});

	describe('getCheapestBoxCostForCharacter()', () => {
		it('should pick the cheapest of multiple boxes offering the same character', () => {
			const expensiveBox = { id: 1, name: 'Expensive', tokenCost: 1000, characterOdds: { a: 1 } };
			const cheapBox = { id: 2, name: 'Cheap', tokenCost: 10, characterOdds: { a: 1 } };

			const cost = getCheapestBoxCostForCharacter({
				character: { id: 1, value: 'a', rarity: 1 },
				mysteryBoxes: [expensiveBox, cheapBox],
			});

			makeSure(cost).is(10);
		});
	});

	describe('getMinimumSellValue()', () => {
		it('should be 10% of the cheapest box cost, floored', () => {
			const boxes = [
				{ id: 1, name: 'A', tokenCost: 25, characterOdds: {} },
				{ id: 2, name: 'B', tokenCost: 50, characterOdds: {} },
			];

			makeSure(getMinimumSellValue(boxes)).is(2);
		});
	});

	describe('getCheapestCostForCharacter() and getSellValueForCharacter() on real static data', () => {
		it('should compute a real cheapest cost for every character present in a mystery box', () => {
			for (const character of characters) {
				const cheapestCost = getCheapestCostForCharacter({ character, mysteryBoxes: [...mysteryBoxes] });
				const isInAnyBox = mysteryBoxes.some(box => character.value in box.characterOdds);

				if (isInAnyBox)
					makeSure(cheapestCost).isGreaterThan(0);
			}
		});

		it('should never let a character sell for at or above its cheapest real cost', () => {
			for (const character of characters) {
				const cheapestCost = getCheapestCostForCharacter({ character, mysteryBoxes: [...mysteryBoxes] });
				const sellValue = getSellValueForCharacter({ character, mysteryBoxes: [...mysteryBoxes] });

				if (cheapestCost !== null)
					makeSure(sellValue).isLessThan(cheapestCost);
			}
		});

		it('should never sell a character below the minimum sell value', () => {
			const minimumSellValue = getMinimumSellValue([...mysteryBoxes]);

			for (const character of characters) {
				const sellValue = getSellValueForCharacter({ character, mysteryBoxes: [...mysteryBoxes] });
				makeSure(sellValue).isGreaterThanOrEqualTo(minimumSellValue);
			}
		});
	});
});
