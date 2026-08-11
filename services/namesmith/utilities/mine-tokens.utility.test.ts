import { makeSure } from "../../../utilities/jest/jest-utils";
import { FIRST_LAYER_CHARACTER_DISCOVERY_CHANCE } from "../constants/mine-tokens.constants";
import {
	getCharacterDiscoveryChanceAtLayer,
	getCollapseChanceAtLayer,
	getExpectedTokensAtLayer,
	getTokensKeptAfterCollapse,
	doesMineCollapseAtLayer,
	isCharacterDiscoveredAtLayer,
	getRandomTokensGivenForMine,
} from "./mine-tokens.utility";

describe('mine-tokens.utility', () => {
	describe('getCollapseChanceAtLayer()', () => {
		it('should return 0 on layer 1', () => {
			makeSure(getCollapseChanceAtLayer(1)).is(0);
		});

		it('should be monotonically non-decreasing as layer increases', () => {
			let previousChance = getCollapseChanceAtLayer(1);

			for (let layer = 2; layer <= 30; layer++) {
				const chance = getCollapseChanceAtLayer(layer);
				makeSure(chance).isGreaterThanOrEqualTo(previousChance);
				previousChance = chance;
			}
		});

		it('should stay below 1 even at great depth', () => {
			makeSure(getCollapseChanceAtLayer(100)).isLessThan(1);
		});
	});

	describe('doesMineCollapseAtLayer()', () => {
		it('should never collapse on layer 1', () => {
			for (let index = 0; index < 50; index++) {
				makeSure(doesMineCollapseAtLayer(1)).isFalse();
			}
		});
	});

	describe('getExpectedTokensAtLayer()', () => {
		it('should equal the base mining expected value on layer 1', () => {
			makeSure(getExpectedTokensAtLayer(1)).is(1.5);
		});

		it('should scale up with depth', () => {
			makeSure(getExpectedTokensAtLayer(5)).isGreaterThan(getExpectedTokensAtLayer(1));
		});
	});

	describe('getRandomTokensGivenForMine()', () => {
		it('should return a positive number of tokens', () => {
			for (let layer = 1; layer <= 10; layer++) {
				makeSure(getRandomTokensGivenForMine(layer)).isGreaterThan(0);
			}
		});
	});

	describe('getCharacterDiscoveryChanceAtLayer()', () => {
		it('should return the first-layer discovery chance on layer 1', () => {
			makeSure(getCharacterDiscoveryChanceAtLayer(1)).is(FIRST_LAYER_CHARACTER_DISCOVERY_CHANCE);
		});

		it('should be rare on shallow layers', () => {
			makeSure(getCharacterDiscoveryChanceAtLayer(2)).isLessThan(0.1);
		});

		it('should never exceed the discovery chance cap, even at great depth', () => {
			makeSure(getCharacterDiscoveryChanceAtLayer(1000)).isLessThanOrEqualTo(0.25);
		});
	});

	describe('rollDidDiscoverCharacter()', () => {
		it('should never discover a character on layer 1', () => {
			for (let index = 0; index < 50; index++) {
				makeSure(isCharacterDiscoveredAtLayer(1)).isFalse();
			}
		});
	});

	describe('getTokensKeptAfterCollapse()', () => {
		it.each([
			[10, 2],
			[11, 2],
			[100, 25],
			[3, 0],
			[0, 0],
		])('should floor 25%% of %i tokens collected to %i tokens kept', (tokensCollected, expectedTokensKept) => {
			makeSure(getTokensKeptAfterCollapse(tokensCollected)).is(expectedTokensKept);
		});
	});
});
