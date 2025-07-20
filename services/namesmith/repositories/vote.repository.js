const { InvalidArgumentError, ResourceConflictError, ResourceNotFoundError } = require("../../../utilities/error-utils");
const DatabaseQuerier = require("../database/database-querier");
const { VoteAlreadyExistsError, VoteNotFoundError } = require("../utilities/error.utility");

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
			throw new InvalidArgumentError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		this.db = db;
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns {Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>} An array of vote objects.
	 */
	getVotes() {
		const query = `SELECT * FROM vote`;
		const getAllVotes = this.db.prepare(query);
		return getAllVotes.all();
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param {string} voterID - The ID of the user who voted.
	 * @returns {{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * } | undefined} A vote object if found, otherwise undefined.
	 */
	getVoteByVoterID(voterID) {
		const query = `SELECT * FROM vote WHERE voterID = @voterID`;
		const getVoteByVoterID = this.db.prepare(query);
		return getVoteByVoterID.get({ voterID });
	}

	/**
	 * Retrieves a list of votes by the ID of the player voted for.
	 * @param {string} playerVotedForID - The ID of the player voted for.
	 * @returns {Array<{
	 * 	voterID: string,
	 *  playerVotedForID: string
	 * }>} A list of vote objects.
	 */
	getVotesByVotedForID(playerVotedForID) {
		const query = `SELECT * FROM vote WHERE playerVotedForID = @playerVotedForID`;
		const getVotesByVotedForID = this.db.prepare(query);
		return getVotesByVotedForID.all({ playerVotedForID });
	}

	/**
	 * Checks if a vote with the given properties exists.
	 * @param {{ voterID: string, playerVotedForID: string }} voteData - The vote data to check for.
	 * @returns {boolean} A promise that resolves with a boolean indicating if the vote exists.
	 */
	doesVoteExist({ voterID, playerVotedForID }) {
		if (voterID === undefined && playerVotedForID === undefined)
			throw new InvalidArgumentError(`doesVoteExist: Missing voterID and playerVotedForID`);
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
	 */
	addVote({ voterID, playerVotedForID }) {
		if (!voterID)
			throw new InvalidArgumentError("addVote: Missing voterID");

		if (!playerVotedForID)
			throw new InvalidArgumentError("addVote: Missing playerVotedForID");

		const query = `
			INSERT INTO vote (voterID, playerVotedForID)
			VALUES (@voterID, @playerVotedForID)
		`;
		const addVote = this.db.prepare(query);
		const vote = addVote.run({ voterID, playerVotedForID });

		if (vote.changes === 0)
			throw new VoteAlreadyExistsError(voterID);
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new player voted for ID.
	 * @param {{ voterID: string, playerVotedForID: string }} vote - The vote object with the new player ID.
	 */
	changeVote({ voterID, playerVotedForID }) {
		if (!voterID)
			throw new InvalidArgumentError("changeVote: Missing voterID");

		if (!playerVotedForID)
			throw new InvalidArgumentError("changeVote: Missing playerVotedForID");

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
			throw new VoteNotFoundError(voterID);
	}

	/**
	 * Deletes a vote by a given voter ID.
	 * @param {string} voterID - The ID of the user who voted.
	 */
	deleteVote(voterID) {
		const query = `DELETE FROM vote WHERE voterID = @voterID`;
		const deleteVote = this.db.prepare(query);
		const vote = deleteVote.run({ voterID });
		if (vote.changes === 0)
			throw new VoteNotFoundError(voterID);
	}

	/**
	 * Resets the list of votes, clearing all existing votes.
	 */
	reset() {
		const query = `DELETE FROM vote`;
		const reset = this.db.prepare(query);
		reset.run();
	}
}

module.exports = VoteRepository;