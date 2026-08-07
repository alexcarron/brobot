import { InvalidArgumentError } from "../../../utilities/error-utils";
import { FIRST_PLACE_POINTS, SECOND_PLACE_POINTS, THIRD_PLACE_POINTS } from "../constants/vote.constants";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { VoteRepository } from "../repositories/vote.repository";
import { PublishedName, PublishedNameID, PublishedNameResolvable } from "../types/published-name.types";
import { Placement, Rank, Ranks, Vote, VoteInfo, VoteID, VoteResolvable } from "../types/vote.types";
import { NameVotedTwiceError, VoteOutOfOrderError } from "../utilities/error.utility";
import { PlayerService } from "./player.service";
import { PublishedNameService } from "./published-name.service";

/**
 * Provides access to the dynamic votes data. Votes point at published name entries, each of which is one anonymous voting entry.
 */
export class VoteService {
	/**
	 * Constructs a new VoteService instance.
	 * @param voteRepository - The repository used for accessing votes.
	 * @param playerService - The service used for resolving the players who own published names.
	 * @param publishedNameService - The service used for accessing published name entries.
	 */
	constructor(
		public voteRepository: VoteRepository,
		public playerService: PlayerService,
		public publishedNameService: PublishedNameService
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new VoteService(
			VoteRepository.fromDB(db),
			PlayerService.fromDB(db),
			PublishedNameService.fromDB(db),
		);
	}

	static asMock() {
		const db = createMockDB();
		return VoteService.fromDB(db);
	}

	/**
	 * Resolves a vote from the given resolvable.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveVote(voteResolvable: VoteResolvable): Vote {
		return this.voteRepository.resolveVote(voteResolvable);
	}

	/**
	 * Resolves a vote resolvable to a vote ID.
	 * @param voteResolvable - The vote resolvable to resolve.
	 * @returns The resolved vote ID.
	 * @throws {Error} If the vote resolvable is invalid.
	 */
	resolveID(voteResolvable: VoteResolvable): VoteID {
		return this.voteRepository.resolveID(voteResolvable);
	}

	/**
	 * Checks if a vote with the given properties exists.
	 * @param voteResolvable - The vote resolvable to check.
	 * @returns A boolean indicating if the vote exists.
	 */
	doesVoteExist(voteResolvable: VoteResolvable): boolean {
		const voteID = this.resolveID(voteResolvable);
		return this.voteRepository.doesVoteExist(voteID);
	}

	/**
	 * Gets the set of ranks a given vote has missing votes for.
	 * @param voteResolvable - The vote resolvable to get the missing ranks of.
	 * @returns A set of the ranks that are missing from the vote.
	 */
	getMissingRanksOfVote(voteResolvable: VoteResolvable | null): Set<Rank> {
		if (voteResolvable === null)
			return new Set([Ranks.FIRST, Ranks.SECOND, Ranks.THIRD]);

		if (!this.doesVoteExist(voteResolvable))
			return new Set([Ranks.FIRST, Ranks.SECOND, Ranks.THIRD]);

		const vote = this.resolveVote(voteResolvable);
		const missingRanks: Set<Rank> = new Set();
		if (vote.votedFirstPublishedName === null) missingRanks.add(Ranks.FIRST);
		if (vote.votedSecondPublishedName === null) missingRanks.add(Ranks.SECOND);
		if (vote.votedThirdPublishedName === null) missingRanks.add(Ranks.THIRD);
		return missingRanks;
	}

	/**
	 * Gets the set of published name IDs that are voted in the ranks besides the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to ignore.
	 * @returns The set of published name IDs voted in the ranks besides the given rank.
	 */
	private getPublishedNameIDsNotVotedInRank(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Set<PublishedNameID> {
		const vote = this.resolveVote(voteResolvable);
		const publishedNameIDsNotVotedInRank: Set<PublishedNameID> = new Set();
		switch (rank) {
			case Ranks.FIRST:
				if (vote.votedSecondPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedSecondPublishedName.id);
				if (vote.votedThirdPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedThirdPublishedName.id);
				break;

			case Ranks.SECOND:
				if (vote.votedFirstPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedFirstPublishedName.id);
				if (vote.votedThirdPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedThirdPublishedName.id);
				break;

			case Ranks.THIRD:
				if (vote.votedFirstPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedFirstPublishedName.id);
				if (vote.votedSecondPublishedName !== null) publishedNameIDsNotVotedInRank.add(vote.votedSecondPublishedName.id);
				break;
		}

		return publishedNameIDsNotVotedInRank;
	}

	/**
	 * Gets the map of ranks to the published names voted for in the given vote.
	 * @param voteResolvable - The vote to look at.
	 * @returns The map of ranks to the published names voted for in the given vote.
	 */
	getRanksToVotedPublishedName(voteResolvable: VoteResolvable): Map<Rank, PublishedName> {
		if (!this.doesVoteExist(voteResolvable)) return new Map();

		const vote = this.resolveVote(voteResolvable);
		const rankToVotedPublishedName: Map<Rank, PublishedName> = new Map();
		if (vote.votedFirstPublishedName !== null) rankToVotedPublishedName.set(Ranks.FIRST, vote.votedFirstPublishedName);
		if (vote.votedSecondPublishedName !== null) rankToVotedPublishedName.set(Ranks.SECOND, vote.votedSecondPublishedName);
		if (vote.votedThirdPublishedName !== null) rankToVotedPublishedName.set(Ranks.THIRD, vote.votedThirdPublishedName);
		return rankToVotedPublishedName;
	}

	private toRanksToVotedName(rankToVotedPublishedName: Map<Rank, PublishedName>): Map<Rank, string> {
		return new Map(
			Array.from(rankToVotedPublishedName).map(([rank, publishedName]) => [rank, publishedName.name])
		)
	}

	/**
	 * Gets the map of ranks to the names voted for in the given vote.
	 * @param voteResolvable - The vote to look at.
	 * @returns The map of ranks to the names voted for in the given vote.
	 */
	getRanksToVotedName(voteResolvable: VoteResolvable): Map<Rank, string> {
		const rankToVotedPublishedName = this.getRanksToVotedPublishedName(voteResolvable);
		return this.toRanksToVotedName(rankToVotedPublishedName);
	}

	/**
	 * Gets the map of ranks to the published names voted for in the given vote, excluding the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to exclude.
	 * @returns The map of ranks to the published names voted for in the given vote, excluding the given rank.
	 */
	getOtherRanksToVotedPublishedName(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Map<Rank, PublishedName> {
		const vote = this.resolveVote(voteResolvable);
		const rankToVotedPublishedName: Map<Rank, PublishedName> = new Map();
		switch (rank) {
			case Ranks.FIRST:
				if (vote.votedSecondPublishedName !== null) rankToVotedPublishedName.set(Ranks.SECOND, vote.votedSecondPublishedName);
				if (vote.votedThirdPublishedName !== null) rankToVotedPublishedName.set(Ranks.THIRD, vote.votedThirdPublishedName);
				break;

			case Ranks.SECOND:
				if (vote.votedFirstPublishedName !== null) rankToVotedPublishedName.set(Ranks.FIRST, vote.votedFirstPublishedName);
				if (vote.votedThirdPublishedName !== null) rankToVotedPublishedName.set(Ranks.THIRD, vote.votedThirdPublishedName);
				break;

			case Ranks.THIRD:
				if (vote.votedFirstPublishedName !== null) rankToVotedPublishedName.set(Ranks.FIRST, vote.votedFirstPublishedName);
				if (vote.votedSecondPublishedName !== null) rankToVotedPublishedName.set(Ranks.SECOND, vote.votedSecondPublishedName);
				break;
		}

		return rankToVotedPublishedName;
	}

	/**
	 * Gets the map of ranks to the names voted for in the given vote, excluding the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to exclude.
	 * @returns The map of ranks to the names voted for in the given vote, excluding the given rank.
	 */
	getOtherRanksToVotedName(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Map<Rank, string> {
		const otherRanksToVotedPublishedName = this.getOtherRanksToVotedPublishedName(voteResolvable, rank);
		return this.toRanksToVotedName(otherRanksToVotedPublishedName);
	}

	/**
	 * Gets the rank that a given published name is voted for in a vote, if any.
	 * @param voteResolvable - The vote to look at.
	 * @param publishedNameResolvable - The published name to look for.
	 * @returns The rank the published name is voted for in the vote, or null if it is not voted for.
	 */
	getRankOfPublishedNameInVote(
		voteResolvable: VoteResolvable | null,
		publishedNameResolvable: PublishedNameResolvable
	): Rank | null {
		if (voteResolvable === null) return null;
		if (!this.doesVoteExist(voteResolvable)) return null;
		const vote = this.resolveVote(voteResolvable);
		const publishedNameID = this.publishedNameService.resolveID(publishedNameResolvable);

		if (vote.votedFirstPublishedName?.id === publishedNameID) return Ranks.FIRST;
		if (vote.votedSecondPublishedName?.id === publishedNameID) return Ranks.SECOND;
		if (vote.votedThirdPublishedName?.id === publishedNameID) return Ranks.THIRD;

		return null;
	}

	/**
	 * Gets the published name the given user voted for in the given rank.
	 * @param voterID - The vote resolvable to get the published name voted for in the rank.
	 * @param rank - The rank to get the published name voted for in.
	 * @returns The published name the given user voted for in the given rank.
	 */
	getPublishedNameVotedInRank(voterID: VoteID, rank: Rank): PublishedName | null {
		if (!this.voteRepository.doesVoteExist(voterID)) return null;

		const vote = this.voteRepository.getVoteOrThrow(voterID);
		switch (rank) {
			case Ranks.FIRST:
				return vote.votedFirstPublishedName;
			case Ranks.SECOND:
				return vote.votedSecondPublishedName;
			case Ranks.THIRD:
				return vote.votedThirdPublishedName;
		}
	}

	/**
	 * Has a given voter vote a given published name as the given rank, adding or updating their vote.
	 * @param voterResolvable - The user or player who is voting.
	 * @param publishedNameResolvable - The published name being voted on.
	 * @param rank - The rank the published name is being voted for.
	 * @returns The created or updated vote object.
	 */
	votePublishedNameAsRank(
		voterResolvable: VoteID,
		publishedNameResolvable: PublishedNameResolvable,
		rank: Rank
	): Vote {
		const voterID = this.playerService.resolveID(voterResolvable);
		const existingVote = this.voteRepository.getVoteByVoterID(voterID);
		const votedPublishedNameID = this.publishedNameService.resolveID(publishedNameResolvable);
		const missingRanks = this.getMissingRanksOfVote(existingVote);
		const previousRankOfPublishedName = this.getRankOfPublishedNameInVote(existingVote, publishedNameResolvable);
		let vote = null;

		switch (rank) {
			case Ranks.FIRST:
				vote = {votedFirstPublishedName: publishedNameResolvable};
				break;

			case Ranks.SECOND:
				if (missingRanks.has(Ranks.FIRST))
					throw new VoteOutOfOrderError(voterID, votedPublishedNameID, Ranks.FIRST, rank);

				vote = {votedSecondPublishedName: publishedNameResolvable};
				break;

			case Ranks.THIRD:
				if (missingRanks.has(Ranks.FIRST))
					throw new VoteOutOfOrderError(voterID, votedPublishedNameID, Ranks.FIRST, rank);

				if (missingRanks.has(Ranks.SECOND))
					throw new VoteOutOfOrderError(voterID, votedPublishedNameID, Ranks.SECOND, rank);

				vote = {votedThirdPublishedName: publishedNameResolvable};
				break;

			default:
				throw new InvalidArgumentError(`Expected the rank passed to votePublishedNameAsRank to be 1st, 2nd, or 3rd, but was ${rank}.`);
		}

		if (previousRankOfPublishedName !== null) {
			switch (previousRankOfPublishedName) {
				case Ranks.FIRST:
					if (rank === Ranks.SECOND || rank === Ranks.THIRD)
						throw new VoteOutOfOrderError(voterID, votedPublishedNameID, previousRankOfPublishedName, rank);
					break;

				case Ranks.SECOND:
					if (rank === Ranks.THIRD)
						throw new VoteOutOfOrderError(voterID, votedPublishedNameID, previousRankOfPublishedName, rank);

					if (rank === Ranks.FIRST)
						this.voteRepository.updateVote({
							voter: voterID,
							votedSecondPublishedName: null,
						});
					break;

				case Ranks.THIRD:
					if (rank === Ranks.FIRST || rank === Ranks.SECOND)
						this.voteRepository.updateVote({
							voter: voterID,
							votedThirdPublishedName: null,
						});
					break;
			}
		}

		if (existingVote === null) {
			this.voteRepository.addVote({voter: voterID});
		}
		else {
			const otherPublishedNameIDsVoted = this.getPublishedNameIDsNotVotedInRank(existingVote, rank);
			if (otherPublishedNameIDsVoted.has(votedPublishedNameID)) {
				const rankVotedIn = this.getRankOfPublishedNameInVote(existingVote, publishedNameResolvable)!;
				throw new NameVotedTwiceError(voterID, votedPublishedNameID, rankVotedIn, rank);
			}
		}

		const updatedVote = this.voteRepository.updateVote({
			voter: voterID,
			...vote
		});
		return updatedVote;
	}

	/**
	 * Removes a vote from the vote repository.
	 * @param voteResolvable - The vote to remove, either a Vote object or a VoteID.
	 * @returns The vote removed, or null if the vote does not exist.
	 */
	removeVote(voteResolvable: VoteResolvable): Vote | null {
		const voteID = this.resolveID(voteResolvable);
		if (!this.voteRepository.doesVoteExist(voteID)) return null;

		const deletedVote = this.voteRepository.getVoteOrThrow(voteID);
		this.voteRepository.removeVote(voteID);
		return deletedVote;
	}

	/**
	 * Resets the vote repository, clearing all stored votes.
	 */
	reset() {
		this.voteRepository.removeVotes();
	}

	/**
	 * Gets the current points of every published name entry based on the votes.
	 * @returns A map of published name IDs to their current points in order of highest to lowest score.
	 */
	getPublishedNameIDToPoints(): Map<PublishedNameID, number> {
		const votes = this.voteRepository.getVotes();
		const publishedNameIDToPoints = new Map<PublishedNameID, number>();

		for (const publishedName of this.publishedNameService.getPublishedNames()) {
			publishedNameIDToPoints.set(publishedName.id, 0);
		}

		for (const vote of votes) {
			if (vote.votedFirstPublishedName !== null) {
				const publishedNameID = vote.votedFirstPublishedName.id;
				const previousScore = publishedNameIDToPoints.get(publishedNameID) ?? 0;
				publishedNameIDToPoints.set(publishedNameID, previousScore + FIRST_PLACE_POINTS);
			}

			if (vote.votedSecondPublishedName !== null) {
				const publishedNameID = vote.votedSecondPublishedName.id;
				const previousScore = publishedNameIDToPoints.get(publishedNameID) ?? 0;
				publishedNameIDToPoints.set(publishedNameID, previousScore + SECOND_PLACE_POINTS);
			}

			if (vote.votedThirdPublishedName !== null) {
				const publishedNameID = vote.votedThirdPublishedName.id;
				const previousScore = publishedNameIDToPoints.get(publishedNameID) ?? 0;
				publishedNameIDToPoints.set(publishedNameID, previousScore + THIRD_PLACE_POINTS);
			}
		}

		return new Map(
			[...publishedNameIDToPoints.entries()].sort(([ , points1], [ , points2]) =>
				points2 - points1
			)
		);
	}

	/**
	 * Gets the placements of the published name entries in the current vote in order of highest to lowest points.
	 * @returns The placements in order of highest to lowest points.
	 */
	getPlacements(): Placement[] {
		const votes = this.voteRepository.getVotes();
		const publishedNames = this.publishedNameService.getPublishedNames();
		const publishedNameIDToVoteInfo = new Map<PublishedNameID, VoteInfo>();
		const publishedNameIDToEntry = new Map<PublishedNameID, PublishedName>();

		for (const publishedName of publishedNames) {
			publishedNameIDToEntry.set(publishedName.id, publishedName);
			publishedNameIDToVoteInfo.set(publishedName.id, {
				points: 0,
				firstPlaceVotes: 0,
				firstPlacePoints: 0,
				secondPlaceVotes: 0,
				secondPlacePoints: 0,
				thirdPlaceVotes: 0,
				thirdPlacePoints: 0
			});
		}

		for (const vote of votes) {
			if (vote.votedFirstPublishedName !== null) {
				const publishedNameID = vote.votedFirstPublishedName.id;
				publishedNameIDToVoteInfo.get(publishedNameID)!.points += FIRST_PLACE_POINTS;
				publishedNameIDToVoteInfo.get(publishedNameID)!.firstPlaceVotes += 1;
				publishedNameIDToVoteInfo.get(publishedNameID)!.firstPlacePoints += FIRST_PLACE_POINTS;
			}

			if (vote.votedSecondPublishedName !== null) {
				const publishedNameID = vote.votedSecondPublishedName.id;
				publishedNameIDToVoteInfo.get(publishedNameID)!.points += SECOND_PLACE_POINTS;
				publishedNameIDToVoteInfo.get(publishedNameID)!.secondPlaceVotes += 1;
				publishedNameIDToVoteInfo.get(publishedNameID)!.secondPlacePoints += SECOND_PLACE_POINTS;
			}

			if (vote.votedThirdPublishedName !== null) {
				const publishedNameID = vote.votedThirdPublishedName.id;
				publishedNameIDToVoteInfo.get(publishedNameID)!.points += THIRD_PLACE_POINTS;
				publishedNameIDToVoteInfo.get(publishedNameID)!.thirdPlaceVotes += 1;
				publishedNameIDToVoteInfo.get(publishedNameID)!.thirdPlacePoints += THIRD_PLACE_POINTS;
			}
		}

		const sortedPublishedNameIDToVoteInfo = new Map(
			[...publishedNameIDToVoteInfo.entries()].sort(([ , {points: score1}], [ , {points: score2}]) =>
				score2 - score1
			)
		);

		const placements: Placement[] = [];
		let previousPoints: number | null = null;
		let rank = 1;
		let index = 0;
		for (const [publishedNameID, voteInfo] of [...sortedPublishedNameIDToVoteInfo.entries()]) {
			if (voteInfo.points === previousPoints) {
				rank -= 1;
			}
			else {
				rank = index + 1;
			}

			const publishedName = publishedNameIDToEntry.get(publishedNameID)!;
			const placement: Placement = {
				rank: rank,
				publishedName,
				player: this.playerService.resolvePlayer(publishedName.playerID),
				name: publishedName.name,
				...voteInfo,
			};

			placements.push(placement);

			previousPoints = voteInfo.points;
			rank += 1;
			index += 1;
		}

		return placements;
	}
}
