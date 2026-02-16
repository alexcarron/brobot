import { InvalidArgumentError } from "../../../utilities/error-utils";
import { DatabaseQuerier } from "../database/database-querier";
import { createMockDB } from "../mocks/mock-database";
import { VoteRepository } from "../repositories/vote.repository";
import { Player, PlayerID, PlayerResolvable } from "../types/player.types";
import { Rank, Ranks, Vote, VoteID, VoteResolvable } from "../types/vote.types";
import { NameVotedTwiceError, VoteOutOfOrderError } from "../utilities/error.utility";
import { PlayerService } from "./player.service";

/**
 * Provides access to the dynamic votes data.
 */
export class VoteService {
	/**
	 * Constructs a new VoteService instance.
	 * @param voteRepository - The repository used for accessing votes.
	 * @param playerService - The service used for accessing players.
	 */
	constructor(
		public voteRepository: VoteRepository,
		public playerService: PlayerService
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new VoteService(
			VoteRepository.fromDB(db),
			PlayerService.fromDB(db),
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
		if (vote.votedFirstPlayer === null) missingRanks.add(Ranks.FIRST);
		if (vote.votedSecondPlayer === null) missingRanks.add(Ranks.SECOND);
		if (vote.votedThirdPlayer === null) missingRanks.add(Ranks.THIRD);
		return missingRanks;
	}

	/**
	 * Gets the set of players who are voted in the ranks besides the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to ignore.
	 * @returns The set of players who are voted in the ranks besides the given rank.
	 */
	private getPlayerIDsNotVotedInRank(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Set<PlayerID> {
		const vote = this.resolveVote(voteResolvable);
		const playerIDsNotVotedInRank: Set<PlayerID> = new Set();
		switch (rank) {
			case Ranks.FIRST: 
				if (vote.votedSecondPlayer !== null) playerIDsNotVotedInRank.add(vote.votedSecondPlayer.id);
				if (vote.votedThirdPlayer !== null) playerIDsNotVotedInRank.add(vote.votedThirdPlayer.id);
				break;

			case Ranks.SECOND:
				if (vote.votedFirstPlayer !== null) playerIDsNotVotedInRank.add(vote.votedFirstPlayer.id);
				if (vote.votedThirdPlayer !== null) playerIDsNotVotedInRank.add(vote.votedThirdPlayer.id);
				break;

			case Ranks.THIRD:
				if (vote.votedFirstPlayer !== null) playerIDsNotVotedInRank.add(vote.votedFirstPlayer.id);
				if (vote.votedSecondPlayer !== null) playerIDsNotVotedInRank.add(vote.votedSecondPlayer.id);
				break;
		}

		return playerIDsNotVotedInRank;
	}

	/**
	 * Gets the map of ranks to the players voted for in the given vote.
	 * @param voteResolvable - The vote to look at.
	 * @returns The map of ranks to the players voted for in the given vote.
	 */
	getRanksToVotedPlayer(voteResolvable: VoteResolvable): Map<Rank, Player> {
		if (!this.doesVoteExist(voteResolvable)) return new Map();
		
		const vote = this.resolveVote(voteResolvable);
		const rankToVotedPlayer: Map<Rank, Player> = new Map();
		if (vote.votedFirstPlayer !== null) rankToVotedPlayer.set(Ranks.FIRST, vote.votedFirstPlayer);
		if (vote.votedSecondPlayer !== null) rankToVotedPlayer.set(Ranks.SECOND, vote.votedSecondPlayer);
		if (vote.votedThirdPlayer !== null) rankToVotedPlayer.set(Ranks.THIRD, vote.votedThirdPlayer);
		return rankToVotedPlayer;
	}

	private toRanksToVotedName(ranksToVotedPlayer: Map<Rank, Player>): Map<Rank, string> {
		return new Map(
			Array.from(ranksToVotedPlayer).map(([rank, player]) => [rank, player.publishedName!])
		)
	}

	/**
	 * Gets the map of ranks to the names of the players voted for in the given vote.
	 * @param voteResolvable - The vote to look at.
	 * @returns The map of ranks to the names of the players voted for in the given vote.
	 */
	getRanksToVotedName(voteResolvable: VoteResolvable): Map<Rank, string> {
		const ranksToVotedPlayer = this.getRanksToVotedPlayer(voteResolvable);
		return this.toRanksToVotedName(ranksToVotedPlayer);
	}


	/**
	 * Gets the map of ranks to the players voted for in the given vote, excluding the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to exclude.
	 * @returns The map of ranks to the players voted for in the given vote, excluding the given rank.
	 */
	getOtherRanksToVotedPlayer(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Map<Rank, Player> {
		const vote = this.resolveVote(voteResolvable);
		const rankToVotedPlayer: Map<Rank, Player> = new Map();
		switch (rank) {
			case Ranks.FIRST: 
				if (vote.votedSecondPlayer !== null) rankToVotedPlayer.set(Ranks.SECOND, vote.votedSecondPlayer);
				if (vote.votedThirdPlayer !== null) rankToVotedPlayer.set(Ranks.THIRD, vote.votedThirdPlayer);
				break;

			case Ranks.SECOND:
				if (vote.votedFirstPlayer !== null) rankToVotedPlayer.set(Ranks.FIRST, vote.votedFirstPlayer);
				if (vote.votedThirdPlayer !== null) rankToVotedPlayer.set(Ranks.THIRD, vote.votedThirdPlayer);
				break;

			case Ranks.THIRD:
				if (vote.votedFirstPlayer !== null) rankToVotedPlayer.set(Ranks.FIRST, vote.votedFirstPlayer);
				if (vote.votedSecondPlayer !== null) rankToVotedPlayer.set(Ranks.SECOND, vote.votedSecondPlayer);
				break;
		}

		return rankToVotedPlayer;
	}

	/**
	 * Gets the map of ranks to the names of the players voted for in the given vote, excluding the given rank.
	 * @param voteResolvable - The vote to look at.
	 * @param rank - The rank to exclude.
	 * @returns The map of ranks to the names of the players voted for in the given vote, excluding the given rank.
	 */
	getOtherRanksToVotedName(
		voteResolvable: VoteResolvable,
		rank: Rank
	): Map<Rank, string> {
		const otherRanksToVotedPlayer = this.getOtherRanksToVotedPlayer(voteResolvable, rank);
		return this.toRanksToVotedName(otherRanksToVotedPlayer);
	}

	/**
	 * Gets the rank that a given player is voted for in a vote if they are voted for in the vote.
	 * @param voteResolvable - The vote to look at.
	 * @param playerResolvable - The player to look for.
	 * @returns The rank that the player is voted for in the vote, or null if the player is not voted for in the vote.
	 */
	getRankOfPlayerInVote(
		voteResolvable: VoteResolvable | null, 
		playerResolvable: PlayerResolvable
	): Rank | null {
		if (voteResolvable === null) return null;
		if (!this.doesVoteExist(voteResolvable)) return null;
		const vote = this.resolveVote(voteResolvable);
		const playerID = this.playerService.resolveID(playerResolvable);

		if (vote.votedFirstPlayer?.id === playerID) return Ranks.FIRST;
		if (vote.votedSecondPlayer?.id === playerID) return Ranks.SECOND;
		if (vote.votedThirdPlayer?.id === playerID) return Ranks.THIRD;
		
		return null;
	}

	/**
	 * Has a given voter vote a given player as the given rank, adding or updating their vote.
	 * @param voterResolvable - The user or player who is voting.
	 * @param playerResolvable - The player being voted on.
	 * @param rank - The rank the player is being voted for.
	 * @returns The created or updated vote object.
	 */
	votePlayerAsRank(
		voterResolvable: VoteID | PlayerResolvable,
		playerResolvable: PlayerResolvable,
		rank: Rank
	): Vote {
		const voterID = this.playerService.resolveID(voterResolvable);
		const existingVote = this.voteRepository.getVoteByVoterID(voterID);
		const votedPlayerID = this.playerService.resolveID(playerResolvable);
		const missingRanks = this.getMissingRanksOfVote(existingVote);
		const previousRankOfPlayer = this.getRankOfPlayerInVote(existingVote, playerResolvable);
		let vote = null;

		switch (rank) {
			case Ranks.FIRST:					
				vote = {votedFirstPlayer: playerResolvable};
				break;

			case Ranks.SECOND:
				if (missingRanks.has(Ranks.FIRST)) 
					throw new VoteOutOfOrderError(voterID, votedPlayerID, Ranks.FIRST, rank);
					
				vote = {votedSecondPlayer: playerResolvable};
				break;

			case Ranks.THIRD:
				if (missingRanks.has(Ranks.FIRST)) 
					throw new VoteOutOfOrderError(voterID, votedPlayerID, Ranks.FIRST, rank);

				if (missingRanks.has(Ranks.SECOND)) 
					throw new VoteOutOfOrderError(voterID, votedPlayerID, Ranks.SECOND, rank);
				
				vote = {votedThirdPlayer: playerResolvable};
				break;
		
			default:
				throw new InvalidArgumentError(`Expected the rank passed to votePlayerAsRank to be 1st, 2nd, or 3rd, but was ${rank}.`);
		}

		if (previousRankOfPlayer !== null) {
			switch (previousRankOfPlayer) {
				case Ranks.FIRST:
					if (rank === Ranks.SECOND || rank === Ranks.THIRD)
						throw new VoteOutOfOrderError(voterID, votedPlayerID, previousRankOfPlayer, rank);
					break;

				case Ranks.SECOND:
					if (rank === Ranks.THIRD)
						throw new VoteOutOfOrderError(voterID, votedPlayerID, previousRankOfPlayer, rank);

					if (rank === Ranks.FIRST)
						this.voteRepository.updateVote({
							voter: voterID,
							votedSecondPlayer: null,
						});
					break;

				case Ranks.THIRD:
					if (rank === Ranks.FIRST || rank === Ranks.SECOND)
						this.voteRepository.updateVote({
							voter: voterID,
							votedThirdPlayer: null,
						});
					break;
			}
		}
		
		if (existingVote === null) {
			this.voteRepository.addVote({voter: voterID});
		}
		else {
			const otherPlayerIDsVoted = this.getPlayerIDsNotVotedInRank(existingVote, rank);
			if (otherPlayerIDsVoted.has(votedPlayerID)) {
				const rankVotedIn = this.getRankOfPlayerInVote(existingVote, playerResolvable)!;
				throw new NameVotedTwiceError(voterID, votedPlayerID, rankVotedIn, rank);
			}
		}
		

		const updatedVote = this.voteRepository.updateVote({
			voter: voterID,
			...vote
		});
		return updatedVote;
	}

	/**
	 * Gets the player the given user voted for in the given rank
	 * @param voterID - The vote resolvable to get the player voted for in the rank.
	 * @param rank - The rank to get the player voted for in.
	 * @returns The player the given user voted for in the given rank
	 */
	getPlayerVotedInRank(voterID: VoteID, rank: Rank): Player | null {
		if (!this.voteRepository.doesVoteExist(voterID)) return null;
		
		const vote = this.voteRepository.getVoteOrThrow(voterID);
		switch (rank) {
			case Ranks.FIRST:
				return vote.votedFirstPlayer;
			case Ranks.SECOND:
				return vote.votedSecondPlayer;
			case Ranks.THIRD:
				return vote.votedThirdPlayer;
		}
	}
	
	/**
	 * Resets the vote repository, clearing all stored votes.
	 */
	reset() {
		this.voteRepository.removeVotes();
	}
}
