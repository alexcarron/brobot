/**
 * Checks if a given value is an object with the expected properties of a vote.
 * @param {any} value - The value to check.
 * @returns {boolean} If the value is an object with the expected properties of a vote.
 */
const isVote = (value) => (
	value !== null &&
	typeof value === 'object' &&
	'voterID' in value &&
	typeof value.voterID === 'string' &&
	'playerVotedForID' in value &&
	typeof value.playerVotedForID === 'string'
)

module.exports = { isVote }