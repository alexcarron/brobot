import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { resolveOptionals } from '../../../utilities/optional-utils';
import { WithRequiredAndOneOther } from '../../../utilities/types/generic-types';
import { isNotNullable, isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { asMinimalVote, asMinimalVotes, MinimalVote, Vote, VoteDefinition, VoteID, VoteResolvable } from "../types/vote.types";
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

	static asMock() {
		const db = createMockDB();
		return VoteRepository.fromDB(db);
	}

	get playerResolver() {
		return this.playerRepository.resolvePlayer.bind(this.playerRepository);
	}

	get playerIDResolver() {
		return this.playerRepository.resolveID.bind(this.playerRepository);
	}

	private toVoteFromMinimal(minimalVote: MinimalVote): Vote {
		const [votedFirstPlayer, votedSecondPlayer, votedThirdPlayer] = 
			resolveOptionals(this.playerResolver, 
				minimalVote.votedFirstPlayerID, 
				minimalVote.votedSecondPlayerID, 
				minimalVote.votedThirdPlayerID
			);
		
		return {
			voterID: minimalVote.voterID,
			votedFirstPlayer,
			votedSecondPlayer,
			votedThirdPlayer
		};
	}

	private toVotesFromMinimal(minimalVotes: MinimalVote[]): Vote[] {
		return minimalVotes.map(dbVote => this.toVoteFromMinimal(dbVote));
	}

	/**
	 * Returns a list of all vote objects.
	 * @returns An array of vote objects.
	 */
	getVotes(): Vote[] {
		const rows = this.db.getRows(
			'SELECT * FROM vote'
		);

		return this.toVotesFromMinimal(
			asMinimalVotes(rows)
		);
	}

	/**
	 * Retrieves a vote by the ID of the user who voted.
	 * @param voterID - The ID of the user who voted.
	 * @returns A vote object if found, otherwise undefined.
	 */
	getVoteByVoterID(voterID: string): Vote | null {
		const row = this.db.getRow(
			'SELECT * FROM vote WHERE voterID = @voterID',
			{ voterID }
		);

		if (row === undefined)
			return null;

		return this.toVoteFromMinimal(
			asMinimalVote(row)
		);
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
		return this.db.doesExistInTable('vote', { voterID: id });
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
	 * @param voteDefintion.votedFirstPlayer - The player whose name was voted as 1st place.
	 * @param voteDefintion.votedSecondPlayer - The player whose name was voted as 2nd place.
	 * @param voteDefintion.votedThirdPlayer - The player whose name was voted as 3rd place.
	 * @returns The added vote object.
	 */
	addVote(
		{
			voter: voterResolvable,
			votedFirstPlayer: votedFirstPlayerResolvable,
			votedSecondPlayer: votedSecondPlayerResolvable,
			votedThirdPlayer: votedThirdPlayerResolvable
		}: VoteDefinition
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const [votedFirstPlayerID, votedSecondPlayerID, votedThirdPlayerID] = 
			resolveOptionals(this.playerIDResolver,
				votedFirstPlayerResolvable,
				votedSecondPlayerResolvable,
				votedThirdPlayerResolvable
			);

		if (this.doesVoteExist(voterID))
			throw new VoteAlreadyExistsError(voterID);

		this.db.insertIntoTable('vote', {
			voterID, 
			votedFirstPlayerID, 
			votedSecondPlayerID, 
			votedThirdPlayerID
		});

		return this.getVoteOrThrow(voterID);
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new player voted for ID.
	 * @param voteDefintion - The vote object to update.
	 * @param voteDefintion.voter - The user or player who voted.
	 * @param voteDefintion.votedFirstPlayer - The player whose name was voted as 1st place.
	 * @param voteDefintion.votedSecondPlayer - The player whose name was voted as 2nd place.
	 * @param voteDefintion.votedThirdPlayer - The player whose name was voted as 3rd place.
	 * @returns The updated vote object.
	 */
	updateVote(
		{
			voter: voterResolvable,
			votedFirstPlayer: votedFirstPlayerResolvable,
			votedSecondPlayer: votedSecondPlayerResolvable,
			votedThirdPlayer: votedThirdPlayerResolvable,
		}: WithRequiredAndOneOther<VoteDefinition, 'voter'>
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const [votedFirstPlayerID, votedSecondPlayerID, votedThirdPlayerID] = 
			resolveOptionals(this.playerIDResolver,
				votedFirstPlayerResolvable,
				votedSecondPlayerResolvable,
				votedThirdPlayerResolvable,
			);

		for (const playerID of [votedFirstPlayerID, votedSecondPlayerID, votedThirdPlayerID]) {
			if (isNotNullable(playerID)) {
				this.playerResolver(playerID);
			}
		}

		if (!this.doesVoteExist(voterID))
			throw new VoteNotFoundError(voterID);

		this.db.updateInTable('vote', {
			fieldsUpdating: { votedFirstPlayerID, votedSecondPlayerID, votedThirdPlayerID },
			identifiers: { voterID }
		});

		return this.getVoteOrThrow(voterID);
	}

	/**
	 * Deletes a vote by a given voter ID.
	 * @param voterID - The ID of the user who voted.
	 */
	removeVote(voterID: VoteID) {
		const runResult = this.db.deleteFromTable('vote', { voterID });

		if (runResult.changes === 0)
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