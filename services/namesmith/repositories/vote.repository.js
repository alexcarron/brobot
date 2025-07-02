const Database = require("better-sqlite3");

/**
 * Provides access to the dynamic votes data.
 */
class VoteRepository {
	/**
	 * @type {Database}
	 */
	db;

/**
 * Constructs a new VoteRepository instance.
 * @param {Database} db - The database connection to use.
 */

	constructor(db) {
		this.db = db;
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns {Promise<Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>>} An array of vote objects.
	 */
	async getVotes() {
		const query = `SELECT * FROM vote`;
		const getAllVotes = this.db.prepare(query);
		return getAllVotes.all();
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param {string} voterID - The ID of the user who voted.
	 * @returns {Promise<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * } | undefined>} A vote object if found, otherwise undefined.
	 */
	async getVoteByVoterID(voterID) {
		const query = `SELECT * FROM vote WHERE voterID = @voterID`;
		const getVoteByVoterID = this.db.prepare(query);
		return getVoteByVoterID.get({ voterID });
	}

	/**
	 * Retrieves a list of votes by the ID of the player voted for.
	 * @param {string} playerVotedForID - The ID of the player voted for.
	 * @returns {Promise<Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>>} A list of vote objects.
	 */
	async getVotesByVotedForID(playerVotedForID) {
		const query = `SELECT * FROM vote WHERE playerVotedForID = @playerVotedForID`;
		const getVotesByVotedForID = this.db.prepare(query);
		return getVotesByVotedForID.all({ playerVotedForID });
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object to add.
	 * @returns {Promise<void>} A promise that resolves once the vote has been saved.
	 */
	async addVote({ voterID, playerVotedForID }) {
		if (!voterID)
			throw new Error("addVote: Missing voterID");

		if (!playerVotedForID)
			throw new Error("addVote: Missing playerVotedForID");

		const query = `
			INSERT INTO vote (voterID, playerVotedForID)
			VALUES (@voterID, @playerVotedForID)
		`;
		const addVote = this.db.prepare(query);
		const vote = addVote.run({ voterID, playerVotedForID });
		console.log(vote);
		if (vote.changes === 0)
			throw new Error("addVote: Failed to add vote because the voterID already exists");
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new player voted for ID.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object with the new player ID.
	 * @returns {Promise<void>} A promise that resolves once the vote has been saved.
	 */
	async changeVote({ voterID, playerVotedForID }) {
		if (!voterID)
			throw new Error("changeVote: Missing voterID");

		if (!playerVotedForID)
			throw new Error("changeVote: Missing playerVotedForID");

		const query = `
			UPDATE vote
			SET playerVotedForID = @playerVotedForID
			WHERE voterID = @voterID
		`;
		const changeVote = this.db.prepare(query);
		const vote = changeVote.run({ voterID, playerVotedForID });
		if (vote.changes === 0)
			throw new Error("changeVote: Failed to change vote because the voterID does not exist");
	}

	/**
	 * Deletes a vote by a given voter ID.
	 * @param {string} voterID - The ID of the user who voted.
	 * @returns {Promise<void>} A promise that resolves once the vote has been deleted.
	 */
	async deleteVote(voterID) {
		const query = `DELETE FROM vote WHERE voterID = @voterID`;
		const deleteVote = this.db.prepare(query);
		const vote = deleteVote.run({ voterID });
		if (vote.changes === 0)
			throw new Error("deleteVote: Failed to delete vote because the voterID does not exist");
	}

	/**
	 * Resets the list of votes, clearing all existing votes.
	 * @returns {Promise<void>} A promise that resolves once the votes have been cleared and saved.
	 */
	async reset() {
		const query = `DELETE FROM vote`;
		const reset = this.db.prepare(query);
		reset.run();
	}
}

module.exports = VoteRepository;