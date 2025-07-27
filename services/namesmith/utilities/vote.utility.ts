import { Vote } from "../types/vote.types"

/**
 * Checks if a given value is an object with the expected properties of a vote.
 * @param value - The value to check.
 * @returns If the value is an object with the expected properties of a vote.
 */
export const isVote = (value: unknown): value is Vote => (
	value !== null &&
	typeof value === 'object' &&
	'voterID' in value &&
	typeof value.voterID === 'string' &&
	'playerVotedForID' in value &&
	typeof value.playerVotedForID === 'string'
)