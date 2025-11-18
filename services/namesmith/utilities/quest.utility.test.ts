import { makeSure } from "../../../utilities/jest/jest-utils";
import { DBQuest, Quest } from "../types/quest.types";
import { createReward, isReward, toQuest } from "./quest.utility";

describe('quest.utility.ts', () => {
	describe('toQuest()', () => {
		it('converts a DBQuest into a Quest', () => {
			const dbQuest: DBQuest = {
				id: 1,
				name: 'Test Quest',
				description: 'Test Description',
				tokensReward: 10,
				charactersReward: 'ABC',
				wasShown: 1,
				isShown: 1
			};

			const quest: Quest = toQuest(dbQuest);

			makeSure(quest).is({
				id: 1,
				name: 'Test Quest',
				description: 'Test Description',
				tokensReward: 10,
				charactersReward: 'ABC',
				wasShown: true,
				isShown: true
			});
		});
	});

	describe('createReward', () => {
		it('exposes tokens and characters factory functions', () => {
			makeSure(typeof createReward.tokens).is('function');
			makeSure(typeof createReward.characters).is('function');
		});

		describe('tokens()', () => {
			it('creates a TokenReward with the correct shape and values', () => {
				const tokenReward = createReward.tokens(100);

				makeSure(tokenReward).is({
					type: 'tokens',
					numTokens: 100
				});
			});

			it('works with zero and negative numbers (keeps value passed)', () => {
				const zeroTokensReward = createReward.tokens(0);
				const negativeTokensReward = createReward.tokens(-5);

				makeSure(zeroTokensReward).is({ type: 'tokens', numTokens: 0 });
				makeSure(negativeTokensReward).is({ type: 'tokens', numTokens: -5 });
			});
		});

		describe('characters()', () => {
			it('creates a CharacterReward with the correct shape and values', () => {
				const charactersReward = createReward.characters('ABC');

				makeSure(charactersReward).is({
					type: 'characters',
					characters: 'ABC'
				});
			});

			it('works with empty string and long strings (keeps value passed)', () => {
				const noCharactersReward = createReward.characters('');
				const manyCharactersReward = createReward.characters('a'.repeat(1000));

				makeSure(noCharactersReward).is({ type: 'characters', characters: '' });
				makeSure(manyCharactersReward).is({ type: 'characters', characters: 'a'.repeat(1000) });
			});
		});
	});

	describe('isReward', () => {
		it('exposes tokens and characters type guards', () => {
			makeSure(typeof isReward.tokens).is('function');
			makeSure(typeof isReward.characters).is('function');
		});

		describe('tokens()', () => {
			it('returns true if the reward is a TokenReward', () => {
				const tokenReward = createReward.tokens(100);

				makeSure(isReward.tokens(tokenReward)).toBe(true);
			});

			it('returns false if the reward is not a TokenReward', () => {
				const charactersReward = createReward.characters('ABC');

				makeSure(isReward.tokens(charactersReward)).toBe(false);
			});
		});

		describe('characters()', () => {
			it('returns true if the reward is a CharacterReward', () => {
				const charactersReward = createReward.characters('ABC');

				makeSure(isReward.characters(charactersReward)).toBe(true);
			});

			it('returns false if the reward is not a CharacterReward', () => {
				const tokenReward = createReward.tokens(100);

				makeSure(isReward.characters(tokenReward)).toBe(false);
			});
		});
	});
});