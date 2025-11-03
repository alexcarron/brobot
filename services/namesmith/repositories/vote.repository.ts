import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { WithRequiredAndOneOther } from '../../../utilities/types/generic-types';
import { isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { DBVote, Vote, VoteDefinition, VoteID, VoteResolvable } from "../types/vote.types";
import { VoteAlreadyExistsError, VoteNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";

/**
 * Provides access to the dynamic votes data.
 */
export class VoteRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param playerRepository - The player repository instance used for retrieving player data.
	 */
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new VoteRepository(db, PlayerRepository.fromDB(db));
	}

	private toVoteFromDB(dbVote: DBVote): Vote {
		const playerVotedFor = this.playerRepository.resolvePlayer(dbVote.playerVotedForID);

		return {
			voterID: dbVote.voterID,
			playerVotedFor,
		};
	}

	private toVotesFromDB(dbVotes: DBVote[]): Vote[] {
		return dbVotes.map(dbVote => this.toVoteFromDB(dbVote));
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns An array of vote objects.
	 */
	getVotes(): Vote[] {
		const dbVotes = this.db.getRows(
			'SELECT * FROM vote'
		) as DBVote[];

		return this.toVotesFromDB(dbVotes);
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param voterID - The ID of the user who voted.
	 * @returns A vote object if found, otherwise undefined.
	 */
	getVoteByVoterID(voterID: string): Vote | null {
		const vote = this.db.getRow(
			'SELECT * FROM vote WHERE voterID = @voterID',
			{ voterID }
		) as DBVote | undefined;

		if (vote === undefined) return null;

		return this.toVoteFromDB(vote);
	}

	/**
	 * Retrieves a vote by the ID of the user who voted or throws a VoteNotFoundError if it does not exist.
	 * @param voterID - The ID of the user who voted.
	 * @returns A vote object if found.
	 * @throws VoteNotFoundError - If the vote does not exist.
	 */
	getVoteOrThrow(voterID: string): Vote {
		return returnNonNullOrThrow(
			this.getVoteByVoterID(voterID),
			new VoteNotFoundError(voterID)
		);
	}

	/**
	 * Checks if a vote with the given properties exists.
	 * @param id - The ID of the vote to check.
	 * @returns A promise that resolves with a boolean indicating if the vote exists.
	 */
	doesVoteExist(id: VoteID): boolean {
		return this.db.getValue(
			'SELECT 1 FROM vote WHERE voterID = @voterID LIMIT 1',
			{ voterID: id }
		) === 1;
	}

	/**
	 * Resolves a vote from the given resolvable.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveVote(voteResolvable: VoteResolvable): Vote {
		if (isString(voteResolvable)) {
			const voteID = voteResolvable;
			return this.getVoteOrThrow(voteID);
		}
		else if ('voter' in voteResolvable) {
			const { voter } = voteResolvable;
			const playerResolvable = voter;
			const playerID = this.playerRepository.resolveID(playerResolvable);
			return this.getVoteOrThrow(playerID);
		}
		else {
			const { voterID } = voteResolvable;
			return this.getVoteOrThrow(voterID);
		}
	}

	/**
	 * Resolves a vote resolvable to a vote ID.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote ID.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveID(voteResolvable: VoteResolvable): VoteID {
		if (isString(voteResolvable)) {
			const voteID = voteResolvable;
			return voteID;
		}
		else if ('voter' in voteResolvable) {
			const { voter } = voteResolvable;
			const playerResolvable = voter;
			const playerID = this.playerRepository.resolveID(playerResolvable);
			return playerID;
		}
		else {
			const { voterID } = voteResolvable;
			return voterID;
		}
	}

	/**
	 * Adds a new vote to the list of votes.
	 * @param voteDefintion - The vote object to add.
	 * @param voteDefintion.voter - The user or player who voted.
	 * @param voteDefintion.playerVotedFor - The player voted for.
	 * @returns The added vote object.
	 */
	addVote(
		{
			voter: voterResolvable,
			playerVotedFor: playerVotedForResolvable
		}: VoteDefinition
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const playerVotedForID = this.playerRepository.resolveID(playerVotedForResolvable);

		if (this.doesVoteExist(voterID))
			throw new VoteAlreadyExistsError(voterID);

		this.db.run(
			`INSERT INTO vote (voterID, playerVotedForID)
			VALUES (@voterID, @playerVotedForID)`,
			{ voterID, playerVotedForID }
		);

		return this.getVoteOrThrow(voterID);
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new player voted for ID.
	 * @param voteDefintion - The vote object to update.
	 * @param voteDefintion.voter - The user or player who voted.
	 * @param voteDefintion.playerVotedFor - The player voted for.
	 * @returns The updated vote object.
	 */
	updateVote(
		{
			voter: voterResolvable,
			playerVotedFor: playerVotedForResolvable
		}: WithRequiredAndOneOther<VoteDefinition, 'voter'>
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const playerVotedForID = this.playerRepository.resolveID(playerVotedForResolvable);

		if (!this.doesVoteExist(voterID))
			throw new VoteNotFoundError(voterID);


		this.db.run(
			`UPDATE vote
			SET playerVotedForID = @playerVotedForID
			WHERE voterID = @voterID`,
			{ voterID, playerVotedForID }
		);

		return this.getVoteOrThrow(voterID);
	}

	/**
	 * Deletes a vote by a given voter ID.
	 * @param voterID - The ID of the user who voted.
	 */
	removeVote(voterID: VoteID) {
		const query = `DELETE FROM vote WHERE voterID = @voterID`;
		const deleteVote = this.db.prepare(query);
		const vote = deleteVote.run({ voterID });
		if (vote.changes === 0)
			throw new VoteNotFoundError(voterID);
	}

	/**
	 * Resets the list of votes, clearing all existing votes.
	 */
	removeVotes() {
		const query = `DELETE FROM vote`;
		const reset = this.db.prepare(query);
		reset.run();
	}
}