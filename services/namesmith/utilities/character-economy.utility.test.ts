import { makeSure } from "../../../utilities/jest/jest-utils";
import { characters } from "../database/static-data/characters";
import { mysteryBoxes } from "../database/static-data/mystery-boxes";
import { MysteryBoxes } from "../constants/mystery-box.constants";
import { MINIMUM_SELL_VALUE } from "../constants/sell-characters.constants";
import {
	getCheapestBoxCostForCharacter,
	getCheapestCostForCharacter,
	getExpectedCharactersDiscoveredPerMiningSession,
	getExpectedTokensPerCharacterFromMining,
	getExpectedTokensPerMiningSession,
	getMiningSessionSurvivalProbabilityAtLayer,
	getSellValueFromRarity,
	getSellValueFromRarityScale,
	getTotalWeightOfBox,
	getUnitCostOfCharacterInBox,
} from "./character-economy.utility";

const referenceBox = mysteryBoxes.find(
	mysteryBox => mysteryBox.id === MysteryBoxes.ALL_CHARACTERS.id
)!;
const sellValueScale = getSellValueFromRarityScale({ characters, cheapestMysteryBox: referenceBox });
const rarityByCharacterValue = new Map(
	characters.map(character => [character.value, character.rarity])
);
const getSellValueOfCharacterValue = (characterValue: string) =>
	getSellValueFromRarity({
		rarity: rarityByCharacterValue.get(characterValue)!,
		sellValueScale,
	});

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

	describe('getCheapestCostForCharacter() on real static data', () => {
		it('should compute a real cheapest cost for every character present in a mystery box', () => {
			for (const character of characters) {
				const cheapestCost = getCheapestCostForCharacter({ character, mysteryBoxes: [...mysteryBoxes] });
				const isInAnyBox = mysteryBoxes.some(box => character.value in box.characterOdds);

				if (isInAnyBox)
					makeSure(cheapestCost).isGreaterThan(0);
			}
		});
	});

	describe('getSellValueFromRarity() on real static data', () => {
		it('should never sell a character below the minimum sell value', () => {
			for (const character of characters) {
				const sellValue = getSellValueFromRarity({ rarity: character.rarity, sellValueScale });
				makeSure(sellValue).isGreaterThanOrEqualTo(MINIMUM_SELL_VALUE);
			}
		});

		it('should never sell a rarer character for less than a more common one', () => {
			const raritiesLowToHigh = characters
				.map(character => character.rarity)
				.sort((a, b) => a - b);

			let previousSellValue = -Infinity;
			for (const rarity of raritiesLowToHigh) {
				const sellValue = getSellValueFromRarity({ rarity, sellValueScale });
				makeSure(sellValue).isGreaterThanOrEqualTo(previousSellValue);
				previousSellValue = sellValue;
			}
		});

		it('should keep every box a net loss to buy and resell, so buying boxes to sell the results can never profit', () => {
			for (const mysteryBox of mysteryBoxes) {
				const totalWeight = getTotalWeightOfBox(mysteryBox);

				let expectedSellValuePerDraw = 0;
				for (const [characterValue, weight] of Object.entries(mysteryBox.characterOdds))
					expectedSellValuePerDraw += (weight / totalWeight) * getSellValueOfCharacterValue(characterValue);

				makeSure(expectedSellValuePerDraw).isLessThan(mysteryBox.tokenCost);
			}
		});
	});
});
