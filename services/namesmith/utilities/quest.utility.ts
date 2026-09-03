import { CharacterReward, Reward, TokenReward } from "../types/quest.types";

/**
 * Creates a typed reward object for quests.
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
	 * @returns A tokens type reward object.
	 */
	tokens: (numTokens: number): TokenReward => ({
		type: 'tokens',
		numTokens
	}),

	/**
	 * Create a character-based reward.
	 * @param characters - Characters to add to the player's inventory.
	 * @returns A characters type reward object.
	 */
	characters: (characters: string): CharacterReward => ({
		type: 'characters',
		characters
	})
} as const;

/**
 * Checks if a reward is a certain type for type narrowing.
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