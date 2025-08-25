import { InvalidArgumentError } from "../../../utilities/error-utils";
import { AtLeastOne, IfDefined } from "../../../utilities/types/generic-types";
import { DatabaseQuerier } from "../database/database-querier";
import { DBVote, Vote } from "../types/vote.types";
import { VoteAlreadyExistsError, VoteNotFoundError } from "../utilities/error.utility";

/**
 * Provides access to the dynamic votes data.
 */
export class VoteRepository {
	db: DatabaseQuerier;

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(db: DatabaseQuerier) {
		this.db = db;
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns An array of vote objects.
	 */
	getVotes(): Vote[] {
		const query = `SELECT * FROM vote`;
		const getAllVotes = this.db.prepare(query);
		return getAllVotes.all() as DBVote[];
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param voterID - The ID of the user who voted.
	 * @returns A vote object if found, otherwise undefined.
	 */
	getVoteByVoterID(voterID: string): IfDefined<Vote> {
		const query = `SELECT * FROM vote WHERE voterID = @voterID`;
		const getVoteByVoterID = this.db.prepare(query);
		return getVoteByVoterID.get({ voterID }) as IfDefined<DBVote>;
	}

	/**
	 * Retrieves a list of votes by the ID of the player voted for.
	 * @param playerVotedForID - The ID of the player voted for.
	 * @returns A list of vote objects.
	 */
	getVotesByVotedForID(playerVotedForID: string): Vote[] {
		const query = `SELECT * FROM vote WHERE playerVotedForID = @playerVotedForID`;
		const getVotesByVotedForID = this.db.prepare(query);
		return getVotesByVotedForID.all({ playerVotedForID }) as DBVote[];
	}

	/**
	 * Checks if a vote with the given properties exists.
	 * @param voteData - The vote data to check for.
	 * @param voteData.voterID - The ID of the user who voted.
	 * @param voteData.playerVotedForID - The ID of the player voted for.
	 * @returns A promise that resolves with a boolean indicating if the vote exists.
	 */
	doesVoteExist({ voterID, playerVotedForID }: AtLeastOne<Vote>): boolean {
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
	 * @param vote - The vote object to add.
	 * @param vote.voterID - The ID of the user who voted.
	 * @param vote.playerVotedForID - The ID of the player voted for.
	 */
	addVote({ voterID, playerVotedForID }: Vote) {
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
	 * @param vote - The vote object with the new player ID.
	 * @param vote.voterID - The ID of the user who voted.
	 * @param vote.playerVotedForID - The ID of the player voted for.
	 */
	changeVote({ voterID, playerVotedForID }: Vote) {
		if (!voterID)
			throw new InvalidArgumentError("changeVote: Missing voterID");

		if (!playerVotedForID)
			throw new InvalidArgumentError("changeVote: Missing playerVotedForID");

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
	 * @param voterID - The ID of the user who voted.
	 */
	deleteVote(voterID: string) {
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