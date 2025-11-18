import { CharacterReward, DBQuest, Quest, Reward, TokenReward } from "../types/quest.types";

/**
 * Converts a DBQuest object to a Quest object.
 * @param dbQuest The DBQuest object to convert.
 * @returns The converted Quest object.
 */
export function toQuest(dbQuest: DBQuest): Quest {
	return {
		...dbQuest,
		wasShown: dbQuest.wasShown === 1,
		isShown: dbQuest.isShown === 1
	};
}

/**
 * Factory utilities for creating typed rewards.
 *
 * Each method returns a fully-formed `Reward` variant so callers
 * never need to remember the underlying object shape.
 * @example
 * const rewardsForQuest: Reward[] = {
 * 	createReward.tokens(100),
 * 	createReward.characters('ABC'),
 * }
 */
export const createReward = {
	/**
	 * Create a token-based reward.
	 * @param numTokens - Number of tokens to grant.
	 * @returns A reward object of type `"tokens"`.
	 */
	tokens: (numTokens: number): TokenReward => ({
		type: 'tokens',
		numTokens
	}),

	/**
	 * Create a character-based reward.
	 * @param characters - Characters to add to the player's inventory.
	 * @returns A reward object of type `"characters"`.
	 */
	characters: (characters: string): CharacterReward => ({
		type: 'characters',
		characters
	})
} as const;

/**
 * Utility functions for checking if a reward is of a certain type.
 * Used for type narrowing a reward object.
 * @example
 * function handleReward(reward: Reward) {
 * 	if (isReward.tokens(reward)) {
 * 		console.log(`You earned ${reward.numTokens} tokens!`);
 * 	}
 * 	else if (isReward.characters(reward)) {
 * 		console.log(`You received ${reward.characters} characters!`);
 * 	}
 * }
 */
export const isReward = {
	/**
	 * Checks if a reward is a TokenReward.
	 * @param reward - The reward to check.
	 * @returns If the reward is a TokenReward.
	 */
	tokens: (reward: Reward): reward is TokenReward =>
			reward.type === 'tokens',

	/**
	 * Checks if a reward is a CharacterReward.
	 * @param reward - The reward to check.
	 * @returns If the reward is a CharacterReward.
	 */
	characters: (reward: Reward): reward is CharacterReward =>
		reward.type === 'characters'
}