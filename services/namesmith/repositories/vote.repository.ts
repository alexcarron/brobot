import { returnNonNullOrThrow } from "../../../utilities/error-utils";
import { resolveOptionals } from '../../../utilities/optional-utils';
import { WithRequiredAndOneOther } from '../../../utilities/types/generic-types';
import { isNotNullable, isString } from "../../../utilities/types/type-guards";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { asMinimalVote, asMinimalVotes, MinimalVote, Vote, VoteDefinition, VoteID, VoteResolvable } from "../types/vote.types";
import { VoteAlreadyExistsError, VoteNotFoundError } from "../utilities/error.utility";
import { PlayerRepository } from "./player.repository";
import { PublishedNameRepository } from "./published-name.repository";

/**
 * Provides access to the dynamic votes data. A vote points at up to three published name entries by rank.
 */
export class VoteRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 * @param playerRepository - The player repository instance used for resolving voters.
	 * @param publishedNameRepository - The published name repository instance used for resolving voted entries.
	 */
	constructor(
		public db: DatabaseQuerier,
		public playerRepository: PlayerRepository,
		public publishedNameRepository: PublishedNameRepository
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new VoteRepository(db,
			PlayerRepository.fromDB(db),
			PublishedNameRepository.fromDB(db)
		);
	}

	static asMock() {
		const db = createMockDB();
		return VoteRepository.fromDB(db);
	}

	get playerIDResolver() {
		return this.playerRepository.resolveID.bind(this.playerRepository);
	}

	get publishedNameResolver() {
		return this.publishedNameRepository.resolvePublishedName.bind(this.publishedNameRepository);
	}

	get publishedNameIDResolver() {
		return this.publishedNameRepository.resolveID.bind(this.publishedNameRepository);
	}

	private toVoteFromMinimal(minimalVote: MinimalVote): Vote {
		const [votedFirstPublishedName, votedSecondPublishedName, votedThirdPublishedName] =
			resolveOptionals(this.publishedNameResolver,
				minimalVote.votedFirstPublishedNameID,
				minimalVote.votedSecondPublishedNameID,
				minimalVote.votedThirdPublishedNameID
			);

		return {
			voterID: minimalVote.voterID,
			votedFirstPublishedName,
			votedSecondPublishedName,
			votedThirdPublishedName
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
			const playerID = this.playerRepository.resolveID(voter);
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
			const playerID = this.playerRepository.resolveID(voter);
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
	 * @param voteDefintion.votedFirstPublishedName - The published name voted as 1st place.
	 * @param voteDefintion.votedSecondPublishedName - The published name voted as 2nd place.
	 * @param voteDefintion.votedThirdPublishedName - The published name voted as 3rd place.
	 * @returns The added vote object.
	 */
	addVote(
		{
			voter: voterResolvable,
			votedFirstPublishedName: votedFirstResolvable,
			votedSecondPublishedName: votedSecondResolvable,
			votedThirdPublishedName: votedThirdResolvable
		}: VoteDefinition
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const [votedFirstPublishedNameID, votedSecondPublishedNameID, votedThirdPublishedNameID] =
			resolveOptionals(this.publishedNameIDResolver,
				votedFirstResolvable,
				votedSecondResolvable,
				votedThirdResolvable
			);

		if (this.doesVoteExist(voterID))
			throw new VoteAlreadyExistsError(voterID);

		this.db.insertIntoTable('vote', {
			voterID,
			votedFirstPublishedNameID,
			votedSecondPublishedNameID,
			votedThirdPublishedNameID
		});

		return this.getVoteOrThrow(voterID);
	}

	/**
	 * Changes the vote of a user by replacing the vote with a new published name voted for.
	 * @param voteDefintion - The vote object to update.
	 * @param voteDefintion.voter - The user or player who voted.
	 * @param voteDefintion.votedFirstPublishedName - The published name voted as 1st place.
	 * @param voteDefintion.votedSecondPublishedName - The published name voted as 2nd place.
	 * @param voteDefintion.votedThirdPublishedName - The published name voted as 3rd place.
	 * @returns The updated vote object.
	 */
	updateVote(
		{
			voter: voterResolvable,
			votedFirstPublishedName: votedFirstResolvable,
			votedSecondPublishedName: votedSecondResolvable,
			votedThirdPublishedName: votedThirdResolvable,
		}: WithRequiredAndOneOther<VoteDefinition, 'voter'>
	): Vote {
		const voterID = this.playerRepository.resolveID(voterResolvable);
		const [votedFirstPublishedNameID, votedSecondPublishedNameID, votedThirdPublishedNameID] =
			resolveOptionals(this.publishedNameIDResolver,
				votedFirstResolvable,
				votedSecondResolvable,
				votedThirdResolvable,
			);

		for (const publishedNameID of [votedFirstPublishedNameID, votedSecondPublishedNameID, votedThirdPublishedNameID]) {
			if (isNotNullable(publishedNameID)) {
				this.publishedNameResolver(publishedNameID);
			}
		}

		if (!this.doesVoteExist(voterID))
			throw new VoteNotFoundError(voterID);

		this.db.updateInTable('vote', {
			fieldsUpdating: { votedFirstPublishedNameID, votedSecondPublishedNameID, votedThirdPublishedNameID },
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
