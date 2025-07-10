const Database = require("better-sqlite3");
const DatabaseQuerier = require("../database/database-querier");

/**
 * Provides access to the dynamic votes data.
 */
class VoteRepository {
	/**
	 * @type {DatabaseQuerier}
	 */
	db;

	/**
	 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
	 */
	constructor(db) {
		if (!(db instanceof DatabaseQuerier))
			throw new TypeError("CharacterRepository: db must be an instance of DatabaseQuerier.");

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
	 * Checks if a vote with the given properties exists.
	 * @param {{ voterID: string, playerVotedForID: string }} voteData - The vote data to check for.
	 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating if the vote exists.
	 */
	async doesVoteExist({ voterID, playerVotedForID }) {
		if (voterID === undefined && playerVotedForID === undefined)
			throw new TypeError(`doesVoteExist: Missing voterID and playerVotedForID`);
		else if (voterID === undefined) {
			const query = `SELECT * FROM vote WHERE playerVotedForID = @playerVotedForID LIMIT 1`;
			const vote = this.db.getRow(query, { playerVotedForID });
			return vote !== undefined;
		}
		else if (playerVotedForID === undefined) {
			const query = `SELECT * FROM vote WHERE voterID = @voterID LIMIT 1`;
			const vote = this.db.getRow(query, { voterID });
			return vote !== undefined;
		}
		else {
			const query = `SELECT * FROM vote WHERE voterID = @voterID AND playerVotedForID = @playerVotedForID LIMIT 1`;
			const vote = this.db.getRow(query, { voterID, playerVotedForID });
			return vote !== undefined;
		}
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

		console.log({
			players: this.db.getRows(`SELECT * FROM player`),
			votesFromVoter: this.db.getRows(
				`SELECT * FROM vote WHERE voterID = @voterID`,
				{ voterID },
			),
			allVotes: this.db.getRows(`SELECT * FROM vote`),
		});

		const query = `
			UPDATE vote
			SET playerVotedForID = @playerVotedForID
			WHERE voterID = @voterID
		`;
		const vote = this.db.run(query, { voterID, playerVotedForID });
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