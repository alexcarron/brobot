const { loadObjectFromJsonInGitHub, saveObjectToJsonInGitHub } = require("../../../utilities/github-json-storage-utils");

/**
 * Provides access to the dynamic votes data.
 */
class VoteRepository {
	static REPO_NAME = "namesmith-votes";
	votes = [];

	async load() {
		this.votes = await loadObjectFromJsonInGitHub(VoteRepository.REPO_NAME);
	}

	async save() {
		await saveObjectToJsonInGitHub(this.votes, VoteRepository.REPO_NAME);
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns {Promise<Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>>} An array of vote objects.
	 */
	async getVotes() {
		await this.load();
		return this.votes;
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param {string} voterID - The ID of the user who voted.
	 * @returns {Promise<Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>>} An array of vote objects filtered by the voter ID.
	 */
	async getVoteByVoterID(voterID) {
		await this.load();
		return this.votes.filter(vote => vote.voterID === voterID);
	}

	/**
	 * Retrieves a vote by the ID of the player who was voted for.
	 * @param {string} playerVotedForID - The ID of the player who was voted for.
	 * @returns {Promise<Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>>} An array of vote objects filtered by the player voted for ID.
	 */
	async getVoteByVotedForID(playerVotedForID) {
		await this.load();
		return this.votes.filter(vote => vote.playerVotedForID === playerVotedForID);
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object to add.
	 * @returns {Promise<void>} A promise that resolves once the vote has been saved.
	 */
	async addVote({ voterID, playerVotedForID }) {
		const vote = { voterID, playerVotedForID };
		this.votes.push(vote);
		await this.save();
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new player voted for ID.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object with the new player ID.
	 * @returns {Promise<void>} A promise that resolves once the vote has been saved.
	 */
	async changeVote({ voterID, playerVotedForID }) {
		const vote = this.votes.find(vote => vote.voterID === voterID);
		vote.playerVotedForID = playerVotedForID;
		await this.save();
	}

	/**
	 * Deletes a vote by a given voter ID.
	 * @param {string} voterID - The ID of the user who voted.
	 * @returns {Promise<void>} A promise that resolves once the vote has been deleted.
	 */
	async deleteVote(voterID) {
		this.votes = this.votes.filter(vote => vote.voterID !== voterID);
		await this.save();
	}

	/**
	 * Resets the list of votes, clearing all existing votes.
	 * @returns {Promise<void>} A promise that resolves once the votes have been cleared and saved.
	 */
	async reset() {
		this.votes = [];
		await this.save();
	}
}

module.exports = VoteRepository;